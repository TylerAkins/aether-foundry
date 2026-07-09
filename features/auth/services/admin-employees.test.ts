import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  assignEmployeeProductAccess: vi.fn(),
  createEmployeeAccountForActor: vi.fn(),
  findEmployeeDetailForActor: vi.fn(),
  hashPassword: vi.fn(),
  listEmployeesForActor: vi.fn(),
  updateEmployeeIdentityForActor: vi.fn(),
  updateEmployeeRoleStatusForActor: vi.fn(),
}));

vi.mock("@/features/auth/services/employee-repository", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/auth/services/employee-repository")>(
      "@/features/auth/services/employee-repository"
    );

  return {
    ...actual,
    assignEmployeeProductAccess: mocks.assignEmployeeProductAccess,
    createEmployeeAccountForActor: mocks.createEmployeeAccountForActor,
    findEmployeeDetailForActor: mocks.findEmployeeDetailForActor,
    listEmployeesForActor: mocks.listEmployeesForActor,
    updateEmployeeIdentityForActor: mocks.updateEmployeeIdentityForActor,
    updateEmployeeRoleStatusForActor: mocks.updateEmployeeRoleStatusForActor,
  };
});

vi.mock("@/lib/auth/password", () => ({
  hashPassword: mocks.hashPassword,
}));

import {
  createEmployeeAdminService,
  updateEmployeeProductAccessAdminService,
  updateEmployeeRoleStatusAdminService,
} from "@/features/auth/services/admin-employees";
import {
  LastActiveOwnerError,
} from "@/features/auth/services/employee-repository";

const actor = { id: "owner-1", globalRole: "owner" as const };
const employeeId = "00000000-0000-4000-8000-000000000001";
const employee = {
  id: employeeId,
  companyEmail: "employee@example.com",
  personalEmail: "personal@example.com",
  firstName: "Employee",
  middleName: null,
  lastName: "Example",
  phone: "555-0100",
  githubUrl: "https://github.com/employee",
  globalRole: "employee" as const,
  status: "active" as const,
  emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  productAccess: [],
};

describe("admin employee services", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.hashPassword.mockResolvedValue("hashed-password");
  });

  it("creates an employee with a generated temporary password hash", async () => {
    mocks.createEmployeeAccountForActor.mockResolvedValue(employee);

    const result = await createEmployeeAdminService(actor, {
      companyEmail: " Employee@Example.com ",
      personalEmail: " Personal@Example.com ",
      firstName: " Employee ",
      middleName: "",
      lastName: " Example ",
      phone: " 555-0100 ",
      githubUrl: " https://github.com/employee ",
      globalRole: "employee",
      status: "active",
    });

    expect(result.success).toBe(true);
    expect(result.temporaryPassword).toEqual(expect.any(String));
    expect(result.temporaryPassword).toHaveLength(32);
    expect(mocks.hashPassword).toHaveBeenCalledWith(result.temporaryPassword);
    expect(mocks.createEmployeeAccountForActor).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        companyEmail: "employee@example.com",
        personalEmail: "personal@example.com",
        firstName: "Employee",
        middleName: "",
        passwordHash: "hashed-password",
        verified: true,
      })
    );
  });

  it("maps administrator role escalation attempts to an action error", async () => {
    const result = await createEmployeeAdminService(
      { id: "admin-1", globalRole: "system_admin" },
      {
        companyEmail: "employee@example.com",
        personalEmail: "personal@example.com",
        firstName: "Employee",
        lastName: "Example",
        phone: "555-0100",
        githubUrl: "https://github.com/employee",
        globalRole: "owner",
        status: "active",
      }
    );

    expect(result).toEqual({
      success: false,
      error: "Only Owners can create or change administrator roles.",
    });
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.createEmployeeAccountForActor).not.toHaveBeenCalled();
  });

  it("does not hash temporary passwords for forbidden employee create attempts", async () => {
    const result = await createEmployeeAdminService(
      { id: "employee-1", globalRole: "employee" },
      {
        companyEmail: "employee@example.com",
        personalEmail: "personal@example.com",
        firstName: "Employee",
        lastName: "Example",
        phone: "555-0100",
        githubUrl: "https://github.com/employee",
        globalRole: "employee",
        status: "active",
      }
    );

    expect(result).toEqual({
      success: false,
      error: "You are not authorized to manage employee accounts.",
    });
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.createEmployeeAccountForActor).not.toHaveBeenCalled();
  });

  it("requires confirmation for high-impact role and status changes", async () => {
    mocks.findEmployeeDetailForActor.mockResolvedValue({
      ...employee,
      globalRole: "owner",
      status: "active",
    });

    const result = await updateEmployeeRoleStatusAdminService(actor, {
      employeeAccountId: employeeId,
      globalRole: "employee",
      status: "suspended",
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.confirmation).toContain("CONFIRM");
    expect(mocks.updateEmployeeRoleStatusForActor).not.toHaveBeenCalled();
  });

  it("maps last active owner protection to an action error", async () => {
    mocks.findEmployeeDetailForActor.mockResolvedValue({
      ...employee,
      globalRole: "owner",
      status: "active",
    });
    mocks.updateEmployeeRoleStatusForActor.mockRejectedValue(
      new LastActiveOwnerError()
    );

    const result = await updateEmployeeRoleStatusAdminService(actor, {
      employeeAccountId: employeeId,
      globalRole: "employee",
      status: "active",
      confirmation: "CONFIRM",
    });

    expect(result).toEqual({
      success: false,
      error: "The last active Owner cannot be demoted, suspended, or terminated.",
    });
  });

  it("requires confirmation before disabling product launch access", async () => {
    mocks.findEmployeeDetailForActor.mockResolvedValue({
      ...employee,
      productAccess: [
        {
          employeeAccountId: employeeId,
          productKey: "kvisa_assistant",
          productRole: "reviewer",
          launchAccessEnabled: true,
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          updatedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
    });

    const result = await updateEmployeeProductAccessAdminService(actor, {
      employeeAccountId: employeeId,
      productKey: "kvisa_assistant",
      productRole: "reviewer",
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.confirmation).toContain("CONFIRM");
    expect(mocks.assignEmployeeProductAccess).not.toHaveBeenCalled();
  });
});
