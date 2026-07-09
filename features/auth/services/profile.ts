import "server-only";

import { formatZodErrors } from "@/features/auth/services/action-utils";
import {
  findOwnEmployeeWithProductAccess,
  updateOwnEmployeeProfile,
  type EmployeeWithProductAccess,
} from "@/features/auth/services/employee-repository";
import type { ActionResult } from "@/features/auth/types";
import { selfUpdateEmployeeProfileSchema } from "@/features/auth/validation/schemas";

export async function getOwnEmployeeProfileService(
  employeeAccountId: string
): Promise<EmployeeWithProductAccess | null> {
  return findOwnEmployeeWithProductAccess(employeeAccountId);
}

export async function updateOwnEmployeeProfileService(
  employeeAccountId: string,
  input: Record<string, FormDataEntryValue | null>
): Promise<ActionResult> {
  const parsed = selfUpdateEmployeeProfileSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, fieldErrors: formatZodErrors(parsed.error) };
  }

  const employee = await updateOwnEmployeeProfile({
    employeeAccountId,
    ...parsed.data,
  });

  if (!employee) {
    return { success: false, error: "Your employee profile could not be updated." };
  }

  return { success: true, message: "Profile updated." };
}
