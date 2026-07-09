import "server-only";

import { eq } from "drizzle-orm";

import {
  formatZodErrors,
  isHoneypotFilled,
  rateLimitError,
} from "@/features/auth/services/action-utils";
import {
  canEmployeeSignIn,
  findEmployeeByEmail,
  markRecoveryCodeUsed,
} from "@/features/auth/services/employee-repository";
import type { ActionResult } from "@/features/auth/types";
import {
  loginSchema,
  recoveryCodeSchema,
  totpCodeSchema,
} from "@/features/auth/validation/schemas";
import {
  clearPendingLoginCookie,
  clearSessionCookie,
  getPendingLoginIdFromCookies,
  getSessionIdFromCookies,
  setPendingLoginCookie,
  setSessionCookie,
} from "@/lib/auth/cookies";
import {
  LOGIN_INVALID_MESSAGE,
  MAX_PENDING_LOGIN_ATTEMPTS,
  TOTP_INVALID_MESSAGE,
} from "@/lib/auth/constants";
import {
  createPendingLogin,
  deletePendingLogin,
  getPendingLogin,
  incrementPendingLoginAttempts,
} from "@/lib/auth/pending-login";
import { verifyLoginPassword } from "@/lib/auth/password";
import { deleteSession, rotateSession } from "@/lib/auth/session";
import {
  decryptTotpSecret,
  verifyRecoveryCode,
  verifyTotpCode,
} from "@/lib/auth/totp";
import { getDb } from "@/lib/db";
import { recoveryCodes, totpSettings } from "@/lib/db/schema";
import { checkAuthRateLimits } from "@/lib/security/auth-rate-limit";

export async function loginEmployeeService(
  input: Record<string, FormDataEntryValue | null>,
  clientIp: string
): Promise<ActionResult> {
  if (isHoneypotFilled(input)) {
    console.warn("Auth honeypot submission blocked.", { action: "login" });
    return { success: false, error: LOGIN_INVALID_MESSAGE };
  }

  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const rateLimit = await checkAuthRateLimits("login", [
    `ip:${clientIp}`,
    `email:${parsed.data.email}`,
  ]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const employee = await findEmployeeByEmail(parsed.data.email);
  const passwordValid = await verifyLoginPassword(
    employee ? { passwordHash: employee.passwordHash } : null,
    parsed.data.password
  );

  if (!employee || !passwordValid || !canEmployeeSignIn(employee)) {
    return { success: false, error: LOGIN_INVALID_MESSAGE };
  }

  const [totp] = await getDb()
    .select()
    .from(totpSettings)
    .where(eq(totpSettings.employeeAccountId, employee.id))
    .limit(1);

  if (totp?.enabled) {
    const currentSessionId = await getSessionIdFromCookies();

    if (currentSessionId) {
      await deleteSession(currentSessionId);
      await clearSessionCookie();
    }

    const pendingLogin = await createPendingLogin(employee.id);
    await setPendingLoginCookie(pendingLogin.id);

    return { success: true, requiresTotp: true };
  }

  const currentSessionId = await getSessionIdFromCookies();
  const session = await rotateSession(currentSessionId, employee.id);
  await setSessionCookie(session.id);

  return { success: true, redirectTo: "/portal" };
}

export async function verifyLoginTotpService(
  input: Record<string, FormDataEntryValue | null>,
  clientIp: string
): Promise<ActionResult> {
  const pendingLoginId = await getPendingLoginIdFromCookies();

  if (!pendingLoginId) {
    return { success: false, error: LOGIN_INVALID_MESSAGE };
  }

  const pendingLogin = await getPendingLogin(pendingLoginId);

  if (!pendingLogin) {
    await clearPendingLoginCookie();
    return { success: false, error: LOGIN_INVALID_MESSAGE };
  }

  const rateLimit = await checkAuthRateLimits("totp", [
    `pending:${pendingLoginId}`,
    `ip:${clientIp}`,
    `employee:${pendingLogin.employeeAccountId}`,
  ]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const totpInput = input.code;
  const recoveryInput = input.recoveryCode;
  const hasTotp = typeof totpInput === "string" && totpInput.trim() !== "";
  const hasRecovery =
    typeof recoveryInput === "string" && recoveryInput.trim() !== "";

  if (hasTotp === hasRecovery) {
    await incrementOrClearPendingLogin(pendingLoginId);
    return { success: false, error: TOTP_INVALID_MESSAGE };
  }

  let codeValid = false;

  if (hasRecovery) {
    const parsed = recoveryCodeSchema.safeParse({ code: recoveryInput });

    if (parsed.success) {
      const codes = await getDb()
        .select()
        .from(recoveryCodes)
        .where(eq(recoveryCodes.employeeAccountId, pendingLogin.employeeAccountId));

      for (const code of codes) {
        if (code.usedAt) {
          continue;
        }

        if (await verifyRecoveryCode(code.codeHash, parsed.data.code)) {
          codeValid = await markRecoveryCodeUsed(code.id);
          break;
        }
      }
    }
  } else {
    const parsed = totpCodeSchema.safeParse({ code: totpInput });

    if (parsed.success) {
      const [totp] = await getDb()
        .select()
        .from(totpSettings)
        .where(eq(totpSettings.employeeAccountId, pendingLogin.employeeAccountId))
        .limit(1);

      if (totp?.enabled) {
        codeValid = await verifyTotpCode(
          decryptTotpSecret(totp.secretEncrypted),
          parsed.data.code
        );
      }
    }
  }

  if (!codeValid) {
    await incrementOrClearPendingLogin(pendingLoginId);
    return { success: false, error: TOTP_INVALID_MESSAGE };
  }

  await deletePendingLogin(pendingLoginId);
  await clearPendingLoginCookie();

  const currentSessionId = await getSessionIdFromCookies();
  const session = await rotateSession(
    currentSessionId,
    pendingLogin.employeeAccountId
  );
  await setSessionCookie(session.id);

  return { success: true, redirectTo: "/portal" };
}

export async function logoutEmployeeService(): Promise<void> {
  const sessionId = await getSessionIdFromCookies();

  if (sessionId) {
    await deleteSession(sessionId);
  }

  await clearSessionCookie();
  await clearPendingLoginCookie();
}

async function incrementOrClearPendingLogin(pendingLoginId: string): Promise<void> {
  const attempts = await incrementPendingLoginAttempts(pendingLoginId);

  if (attempts >= MAX_PENDING_LOGIN_ATTEMPTS) {
    await deletePendingLogin(pendingLoginId);
    await clearPendingLoginCookie();
  }
}
