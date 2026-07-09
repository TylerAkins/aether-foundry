import "server-only";

import { randomBytes } from "node:crypto";

import { formatZodErrors } from "@/features/auth/services/action-utils";
import {
  DuplicateCompanyEmailError,
  LastActiveOwnerError,
  PrivilegeEscalationError,
  assignEmployeeProductAccess,
  canManageAdminRoles,
  canManageEmployees,
  createEmployeeAccountForActor,
  findEmployeeDetailForActor,
  listEmployeesForActor,
  updateEmployeeIdentityForActor,
  updateEmployeeRoleStatusForActor,
  type EmployeeActor,
  type EmployeeWithProductAccess,
} from "@/features/auth/services/employee-repository";
import type { ActionResult } from "@/features/auth/types";
import {
  adminCreateEmployeeSchema,
  adminUpdateEmployeeIdentitySchema,
  adminUpdateEmployeeRoleStatusSchema,
  adminUpdateProductAccessSchema,
} from "@/features/auth/validation/schemas";
import { hashPassword } from "@/lib/auth/password";
import type { ProductRole } from "@/lib/db/schema";

const FORBIDDEN_MESSAGE = "You are not authorized to manage employee accounts.";
const CONFIRMATION_VALUE = "CONFIRM";

export async function listEmployeesAdminService(
  actor: EmployeeActor
): Promise<EmployeeWithProductAccess[] | null> {
  return listEmployeesForActor(actor);
}

export async function getEmployeeAdminService(
  actor: EmployeeActor,
  employeeAccountId: string
): Promise<EmployeeWithProductAccess | null> {
  return findEmployeeDetailForActor(actor, employeeAccountId);
}

export async function createEmployeeAdminService(
  actor: EmployeeActor,
  input: Record<string, FormDataEntryValue | null>
): Promise<ActionResult> {
  const parsed = adminCreateEmployeeSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  if (!canManageEmployees(actor)) {
    return { success: false, error: FORBIDDEN_MESSAGE };
  }

  if (
    (parsed.data.globalRole === "owner" ||
      parsed.data.globalRole === "system_admin") &&
    !canManageAdminRoles(actor)
  ) {
    return adminMutationError(new PrivilegeEscalationError());
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  try {
    const employee = await createEmployeeAccountForActor({
      actor,
      ...parsed.data,
      passwordHash,
      verified: true,
    });

    if (!employee) {
      return { success: false, error: FORBIDDEN_MESSAGE };
    }

    return {
      success: true,
      message: "Employee account created.",
      temporaryPassword,
      redirectTo: `/portal/admin/employees/${employee.id}`,
    };
  } catch (error) {
    return adminMutationError(error);
  }
}

export async function updateEmployeeIdentityAdminService(
  actor: EmployeeActor,
  input: Record<string, FormDataEntryValue | null>
): Promise<ActionResult> {
  const parsed = adminUpdateEmployeeIdentitySchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  try {
    const employee = await updateEmployeeIdentityForActor({
      actor,
      ...parsed.data,
    });

    if (!employee) {
      return { success: false, error: FORBIDDEN_MESSAGE };
    }

    return { success: true, message: "Employee identity updated." };
  } catch (error) {
    return adminMutationError(error);
  }
}

export async function updateEmployeeRoleStatusAdminService(
  actor: EmployeeActor,
  input: Record<string, FormDataEntryValue | null>
): Promise<ActionResult> {
  const parsed = adminUpdateEmployeeRoleStatusSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const current = await findEmployeeDetailForActor(
    actor,
    parsed.data.employeeAccountId
  );

  if (!current) {
    return { success: false, error: FORBIDDEN_MESSAGE };
  }

  if (
    requiresRoleStatusConfirmation(current, parsed.data) &&
    parsed.data.confirmation !== CONFIRMATION_VALUE
  ) {
    return {
      success: false,
      fieldErrors: {
        confirmation: "Type CONFIRM to apply this role or status change.",
      },
    };
  }

  try {
    const employee = await updateEmployeeRoleStatusForActor({
      actor,
      employeeAccountId: parsed.data.employeeAccountId,
      globalRole: parsed.data.globalRole,
      status: parsed.data.status,
    });

    if (!employee) {
      return { success: false, error: FORBIDDEN_MESSAGE };
    }

    return { success: true, message: "Employee role and status updated." };
  } catch (error) {
    return adminMutationError(error);
  }
}

export async function updateEmployeeProductAccessAdminService(
  actor: EmployeeActor,
  input: Record<string, FormDataEntryValue | null>
): Promise<ActionResult> {
  const parsed = adminUpdateProductAccessSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const current = await findEmployeeDetailForActor(
    actor,
    parsed.data.employeeAccountId
  );

  if (!current) {
    return { success: false, error: FORBIDDEN_MESSAGE };
  }

  const existingAccess = current.productAccess.find(
    (access) => access.productKey === parsed.data.productKey
  );

  if (
    existingAccess?.launchAccessEnabled &&
    !parsed.data.launchAccessEnabled &&
    parsed.data.confirmation !== CONFIRMATION_VALUE
  ) {
    return {
      success: false,
      fieldErrors: {
        confirmation: "Type CONFIRM to disable product launch access.",
      },
    };
  }

  const access = await assignEmployeeProductAccess({
    actor,
    employeeAccountId: parsed.data.employeeAccountId,
    productKey: parsed.data.productKey,
    productRole: parsed.data.productRole as ProductRole,
    launchAccessEnabled: parsed.data.launchAccessEnabled,
  });

  if (!access) {
    return { success: false, error: FORBIDDEN_MESSAGE };
  }

  return { success: true, message: "Product access updated." };
}

function generateTemporaryPassword(): string {
  return randomBytes(24).toString("base64url");
}

function requiresRoleStatusConfirmation(
  current: EmployeeWithProductAccess,
  next: { globalRole: string; status: string }
): boolean {
  const demotesAdministrator =
    (current.globalRole === "owner" || current.globalRole === "system_admin") &&
    next.globalRole !== current.globalRole;
  const disablesActiveEmployee =
    current.status === "active" &&
    (next.status === "suspended" || next.status === "terminated");

  return demotesAdministrator || disablesActiveEmployee;
}

function adminMutationError(error: unknown): ActionResult {
  if (error instanceof DuplicateCompanyEmailError) {
    return { success: false, error: error.message };
  }

  if (
    error instanceof LastActiveOwnerError ||
    error instanceof PrivilegeEscalationError
  ) {
    return { success: false, error: error.message };
  }

  throw error;
}
