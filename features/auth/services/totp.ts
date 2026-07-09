import "server-only";

import QRCode from "qrcode";
import { eq } from "drizzle-orm";

import {
  formatZodErrors,
  rateLimitError,
} from "@/features/auth/services/action-utils";
import { findEmployeeById } from "@/features/auth/services/employee-repository";
import type { ActionResult } from "@/features/auth/types";
import {
  disableTotpSchema,
  totpCodeSchema,
} from "@/features/auth/validation/schemas";
import { setSessionCookie } from "@/lib/auth/cookies";
import { verifyLoginPassword } from "@/lib/auth/password";
import { reissueEmployeeSession } from "@/lib/auth/session";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  generateTotpUri,
  hashRecoveryCode,
  verifyRecoveryCode,
  verifyTotpCode,
} from "@/lib/auth/totp";
import { getDb } from "@/lib/db";
import { recoveryCodes, totpSettings } from "@/lib/db/schema";
import { checkAuthRateLimits } from "@/lib/security/auth-rate-limit";

export async function beginTotpSetupService(
  employeeAccountId: string,
  clientIp: string
): Promise<ActionResult> {
  const rateLimit = await checkAuthRateLimits("totp-setup", [
    `ip:${clientIp}`,
    `employee:${employeeAccountId}`,
  ]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const employee = await findEmployeeById(employeeAccountId);

  if (!employee) {
    return { success: false, error: "Employee account was not found." };
  }

  const secret = generateTotpSecret();
  const encryptedSecret = encryptTotpSecret(secret);
  const [existing] = await getDb()
    .select()
    .from(totpSettings)
    .where(eq(totpSettings.employeeAccountId, employeeAccountId))
    .limit(1);

  if (existing?.enabled) {
    return {
      success: false,
      error: "TOTP is already enabled. Remove it before starting setup again.",
    };
  }

  if (existing) {
    await getDb()
      .update(totpSettings)
      .set({
        secretEncrypted: encryptedSecret,
        enabled: false,
        updatedAt: new Date(),
      })
      .where(eq(totpSettings.id, existing.id));
  } else {
    await getDb().insert(totpSettings).values({
      employeeAccountId,
      secretEncrypted: encryptedSecret,
      enabled: false,
    });
  }

  const uri = generateTotpUri(employee.email, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(uri);

  return { success: true, qrCodeDataUrl };
}

export async function confirmTotpSetupService(
  employeeAccountId: string,
  input: Record<string, FormDataEntryValue | null>,
  clientIp: string
): Promise<ActionResult> {
  const parsed = totpCodeSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const rateLimit = await checkAuthRateLimits("totp-setup", [
    `ip:${clientIp}`,
    `employee:${employeeAccountId}`,
  ]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const [totp] = await getDb()
    .select()
    .from(totpSettings)
    .where(eq(totpSettings.employeeAccountId, employeeAccountId))
    .limit(1);

  if (!totp || totp.enabled) {
    return { success: false, error: "TOTP setup is not available." };
  }

  const codeValid = await verifyTotpCode(
    decryptTotpSecret(totp.secretEncrypted),
    parsed.data.code
  );

  if (!codeValid) {
    return { success: false, error: "The verification code is invalid." };
  }

  const plaintextCodes = generateRecoveryCodes();
  const hashedCodes = await Promise.all(plaintextCodes.map(hashRecoveryCode));

  await getDb()
    .delete(recoveryCodes)
    .where(eq(recoveryCodes.employeeAccountId, employeeAccountId));
  await getDb().insert(recoveryCodes).values(
    hashedCodes.map((codeHash) => ({
      employeeAccountId,
      codeHash,
    }))
  );
  await getDb()
    .update(totpSettings)
    .set({ enabled: true, updatedAt: new Date() })
    .where(eq(totpSettings.id, totp.id));
  await setSessionCookie((await reissueEmployeeSession(employeeAccountId)).id);

  return { success: true, recoveryCodes: plaintextCodes };
}

export async function disableTotpService(
  employeeAccountId: string,
  input: Record<string, FormDataEntryValue | null>,
  clientIp: string
): Promise<ActionResult> {
  const parsed = disableTotpSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const rateLimit = await checkAuthRateLimits("totp-disable", [
    `ip:${clientIp}`,
    `employee:${employeeAccountId}`,
  ]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const employee = await findEmployeeById(employeeAccountId);

  if (!employee) {
    return { success: false, error: "Employee account was not found." };
  }

  const passwordValid = await verifyLoginPassword(
    { passwordHash: employee.passwordHash },
    parsed.data.password
  );

  if (!passwordValid) {
    return { success: false, error: "The password or verification code is invalid." };
  }

  const secondFactorValid = await verifySecondFactor(
    employeeAccountId,
    parsed.data.code,
    parsed.data.recoveryCode
  );

  if (!secondFactorValid) {
    return { success: false, error: "The password or verification code is invalid." };
  }

  await getDb()
    .delete(recoveryCodes)
    .where(eq(recoveryCodes.employeeAccountId, employeeAccountId));
  await getDb()
    .delete(totpSettings)
    .where(eq(totpSettings.employeeAccountId, employeeAccountId));
  await setSessionCookie((await reissueEmployeeSession(employeeAccountId)).id);

  return { success: true, message: "TOTP has been removed." };
}

export async function regenerateRecoveryCodesService(
  employeeAccountId: string,
  input: Record<string, FormDataEntryValue | null>,
  clientIp: string
): Promise<ActionResult> {
  const parsed = totpCodeSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const rateLimit = await checkAuthRateLimits("recovery-regen", [
    `ip:${clientIp}`,
    `employee:${employeeAccountId}`,
  ]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const secondFactorValid = await verifySecondFactor(
    employeeAccountId,
    parsed.data.code,
    undefined
  );

  if (!secondFactorValid) {
    return { success: false, error: "The verification code is invalid." };
  }

  const plaintextCodes = generateRecoveryCodes();
  const hashedCodes = await Promise.all(plaintextCodes.map(hashRecoveryCode));

  await getDb()
    .delete(recoveryCodes)
    .where(eq(recoveryCodes.employeeAccountId, employeeAccountId));
  await getDb().insert(recoveryCodes).values(
    hashedCodes.map((codeHash) => ({
      employeeAccountId,
      codeHash,
    }))
  );
  await setSessionCookie((await reissueEmployeeSession(employeeAccountId)).id);

  return { success: true, recoveryCodes: plaintextCodes };
}

async function verifySecondFactor(
  employeeAccountId: string,
  code: string | undefined,
  recoveryCode: string | undefined
): Promise<boolean> {
  const hasTotp = Boolean(code?.trim());
  const hasRecovery = Boolean(recoveryCode?.trim());

  if (hasTotp === hasRecovery) {
    return false;
  }

  if (hasTotp && code) {
    const parsed = totpCodeSchema.safeParse({ code });

    if (!parsed.success) {
      return false;
    }

    const [totp] = await getDb()
      .select()
      .from(totpSettings)
      .where(eq(totpSettings.employeeAccountId, employeeAccountId))
      .limit(1);

    return Boolean(
      totp?.enabled &&
        (await verifyTotpCode(decryptTotpSecret(totp.secretEncrypted), parsed.data.code))
    );
  }

  if (!recoveryCode) {
    return false;
  }

  const codes = await getDb()
    .select()
    .from(recoveryCodes)
    .where(eq(recoveryCodes.employeeAccountId, employeeAccountId));

  for (const entry of codes) {
    if (entry.usedAt) {
      continue;
    }

    if (await verifyRecoveryCode(entry.codeHash, recoveryCode)) {
      return true;
    }
  }

  return false;
}
