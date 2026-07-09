"use server";

import { redirect } from "next/navigation";

import { formDataToRecord } from "@/features/auth/server/form-data";
import {
  createEmployeeAdminService,
  updateEmployeeIdentityAdminService,
  updateEmployeeProductAccessAdminService,
  updateEmployeeRoleStatusAdminService,
} from "@/features/auth/services/admin-employees";
import {
  requestPasswordResetService,
  requestVerificationEmailService,
  resetPasswordService,
  verifyEmailService,
} from "@/features/auth/services/email-flows";
import {
  loginEmployeeService,
  logoutEmployeeService,
  verifyLoginTotpService,
} from "@/features/auth/services/login";
import { updateOwnEmployeeProfileService } from "@/features/auth/services/profile";
import {
  beginTotpSetupService,
  confirmTotpSetupService,
  disableTotpService,
  regenerateRecoveryCodesService,
} from "@/features/auth/services/totp";
import type { ActionResult } from "@/features/auth/types";
import { requireEmployeeSession } from "@/lib/auth/current-session";
import { getAuditRequestContext, getAuthClientIp } from "@/lib/security/client-ip";

export async function signInAction(formData: FormData): Promise<ActionResult> {
  const result = await loginEmployeeService(
    formDataToRecord(formData),
    await getAuthClientIp()
  );

  if (result.redirectTo) {
    redirect(result.redirectTo);
  }

  return result;
}

export async function verifyLoginTotpAction(
  formData: FormData
): Promise<ActionResult> {
  const result = await verifyLoginTotpService(
    formDataToRecord(formData),
    await getAuthClientIp()
  );

  if (result.redirectTo) {
    redirect(result.redirectTo);
  }

  return result;
}

export async function signOutAction(): Promise<void> {
  await logoutEmployeeService();
  redirect("/sign-in");
}

export async function requestVerificationEmailAction(
  formData: FormData
): Promise<ActionResult> {
  return requestVerificationEmailService(
    formDataToRecord(formData),
    await getAuthClientIp()
  );
}

export async function verifyEmailAction(formData: FormData): Promise<ActionResult> {
  return verifyEmailService(formDataToRecord(formData), await getAuthClientIp());
}

export async function requestPasswordResetAction(
  formData: FormData
): Promise<ActionResult> {
  return requestPasswordResetService(
    formDataToRecord(formData),
    await getAuthClientIp()
  );
}

export async function resetPasswordAction(
  formData: FormData
): Promise<ActionResult> {
  return resetPasswordService(formDataToRecord(formData), await getAuthClientIp());
}

export async function beginTotpSetupAction(): Promise<ActionResult> {
  const session = await requireEmployeeSession();

  return beginTotpSetupService(session.employee.id, await getAuthClientIp());
}

export async function beginTotpSetupFormAction(): Promise<ActionResult> {
  return beginTotpSetupAction();
}

export async function confirmTotpSetupAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireEmployeeSession();

  return confirmTotpSetupService(
    session.employee.id,
    formDataToRecord(formData),
    await getAuthClientIp()
  );
}

export async function disableTotpAction(formData: FormData): Promise<ActionResult> {
  const session = await requireEmployeeSession();

  return disableTotpService(
    session.employee.id,
    formDataToRecord(formData),
    await getAuthClientIp()
  );
}

export async function regenerateRecoveryCodesAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireEmployeeSession();

  return regenerateRecoveryCodesService(
    session.employee.id,
    formDataToRecord(formData),
    await getAuthClientIp()
  );
}

export async function updateOwnEmployeeProfileAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireEmployeeSession();

  return updateOwnEmployeeProfileService(
    session.employee.id,
    formDataToRecord(formData)
  );
}

export async function createEmployeeAdminAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireEmployeeSession();

  return createEmployeeAdminService(
    session.employee,
    formDataToRecord(formData),
    await getAuditRequestContext()
  );
}

export async function updateEmployeeIdentityAdminAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireEmployeeSession();

  return updateEmployeeIdentityAdminService(
    session.employee,
    formDataToRecord(formData),
    await getAuditRequestContext()
  );
}

export async function updateEmployeeRoleStatusAdminAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireEmployeeSession();

  return updateEmployeeRoleStatusAdminService(
    session.employee,
    formDataToRecord(formData),
    await getAuditRequestContext()
  );
}

export async function updateEmployeeProductAccessAdminAction(
  formData: FormData
): Promise<ActionResult> {
  const session = await requireEmployeeSession();

  return updateEmployeeProductAccessAdminService(
    session.employee,
    formDataToRecord(formData),
    await getAuditRequestContext()
  );
}
