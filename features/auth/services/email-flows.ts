import "server-only";

import {
  formatZodErrors,
  isHoneypotFilled,
  rateLimitError,
} from "@/features/auth/services/action-utils";
import {
  canEmployeeSignIn,
  consumeEmailVerificationToken,
  consumePasswordResetToken,
  createEmailVerificationToken,
  createPasswordResetToken,
  findEmployeeByEmail,
  updateEmployeePassword,
} from "@/features/auth/services/employee-repository";
import type { ActionResult } from "@/features/auth/types";
import {
  emailSchema,
  resetPasswordSchema,
  tokenSchema,
} from "@/features/auth/validation/schemas";
import {
  EMAIL_VERIFICATION_TOKEN_TTL_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
  RESET_REQUEST_MESSAGE,
  VERIFICATION_REQUEST_MESSAGE,
} from "@/lib/auth/constants";
import { hashPassword } from "@/lib/auth/password";
import { deleteEmployeeSessions } from "@/lib/auth/session";
import { generateSecureToken } from "@/lib/auth/tokens";
import { appEnv } from "@/lib/env/app";
import { getEmailProvider } from "@/lib/email/provider";
import { checkAuthRateLimits } from "@/lib/security/auth-rate-limit";

export async function requestVerificationEmailService(
  input: Record<string, FormDataEntryValue | null>,
  clientIp: string
): Promise<ActionResult> {
  if (isHoneypotFilled(input)) {
    console.warn("Auth honeypot submission blocked.", { action: "verify" });
    return { success: true, message: VERIFICATION_REQUEST_MESSAGE };
  }

  const parsed = emailSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const rateLimit = await checkAuthRateLimits("resend", [
    `ip:${clientIp}`,
    `email:${parsed.data.email}`,
  ]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const employee = await findEmployeeByEmail(parsed.data.email);

  if (employee && employee.status === "active" && !employee.emailVerifiedAt) {
    const token = generateSecureToken();
    await createEmailVerificationToken({
      employeeAccountId: employee.id,
      token,
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
    });
    await getEmailProvider().send({
      to: employee.email,
      subject: "Verify your Aether Foundry employee account",
      text: `Verify your account: ${appEnv.APP_URL}/verify-email?token=${token}`,
    });
  }

  return { success: true, message: VERIFICATION_REQUEST_MESSAGE };
}

export async function verifyEmailService(
  input: Record<string, FormDataEntryValue | null>,
  clientIp: string
): Promise<ActionResult> {
  const parsed = tokenSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const rateLimit = await checkAuthRateLimits("verify", [`ip:${clientIp}`]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const employee = await consumeEmailVerificationToken(parsed.data.token);

  if (!employee) {
    return { success: false, error: "This verification link is invalid or expired." };
  }

  return { success: true, message: "Your employee account is verified." };
}

export async function requestPasswordResetService(
  input: Record<string, FormDataEntryValue | null>,
  clientIp: string
): Promise<ActionResult> {
  if (isHoneypotFilled(input)) {
    console.warn("Auth honeypot submission blocked.", { action: "reset" });
    return { success: true, message: RESET_REQUEST_MESSAGE };
  }

  const parsed = emailSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const rateLimit = await checkAuthRateLimits("reset", [
    `ip:${clientIp}`,
    `email:${parsed.data.email}`,
  ]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const employee = await findEmployeeByEmail(parsed.data.email);

  if (employee && canEmployeeSignIn(employee)) {
    const token = generateSecureToken();
    await createPasswordResetToken({
      employeeAccountId: employee.id,
      token,
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
    });
    await getEmailProvider().send({
      to: employee.email,
      subject: "Reset your Aether Foundry password",
      text: `Reset your password: ${appEnv.APP_URL}/reset-password?token=${token}`,
    });
  }

  return { success: true, message: RESET_REQUEST_MESSAGE };
}

export async function resetPasswordService(
  input: Record<string, FormDataEntryValue | null>,
  clientIp: string
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const rateLimit = await checkAuthRateLimits("reset", [`ip:${clientIp}`]);

  if (!rateLimit.allowed) {
    return rateLimitError(rateLimit.retryAfterSeconds);
  }

  const employee = await consumePasswordResetToken(parsed.data.token);

  if (!employee || !canEmployeeSignIn(employee)) {
    return { success: false, error: "This reset link is invalid or expired." };
  }

  await updateEmployeePassword({
    employeeAccountId: employee.id,
    passwordHash: await hashPassword(parsed.data.password),
  });
  await deleteEmployeeSessions(employee.id);

  return { success: true, message: "Your password has been reset." };
}
