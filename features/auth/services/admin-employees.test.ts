import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  assignEmployeeProductAccess: vi.fn(),
  createEmployeeAccountForActor: vi.fn(),
  findEmployeeDetailForActor: vi.fn(),
  hashPassword: vi.fn(),
  listEmployeesForActor: vi.fn(),
  logDeniedPrivilegedAuditAttempt: vi.fn(),
  recordPrivilegedAuditEvent: vi.fn(),
  updateEmployeeIdentityForActor: vi.fn(),
  updateEmployeeRoleStatusForActor: vi.fn(),
}));

vi.mock("@/features/auth/services/audit-events", () => ({
  logDeniedPrivilegedAuditAttempt: mocks.logDeniedPrivilegedAuditAttempt,
  recordPrivilegedAuditEvent: mocks.recordPrivilegedAuditEvent,
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
  updateEmployeeIdentityAdminService,
  updateEmployeeProductAccessAdminService,
  updateEmployeeRoleStatusAdminService,
} from "@/features/auth/services/admin-employees";
import {
  LastActiveOwnerError,
} from "@/features/auth/services/employee-repository";

const actor = { id: "owner-1", globalRole: "owner" as const };
const requestContext = { clientIp: "local", userAgentHash: null };
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
    mocks.recordPrivilegedAuditEvent.mockResolvedValue({});
  });

  it("creates an employee with a generated temporary password hash", async () => {
    mocks.createEmployeeAccountForActor.mockResolvedValue(employee);

    const result = await createEmployeeAdminService(
      actor,
      {
        companyEmail: " Employee@Example.com ",
        personalEmail: " Personal@Example.com ",
        firstName: " Employee ",
        middleName: "",
        lastName: " Example ",
        phone: " 555-0100 ",
        githubUrl: " https://github.com/employee ",
        globalRole: "employee",
        status: "active",
      },
      requestContext
    );

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
    expect(mocks.recordPrivilegedAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actor,
        action: "employee.create",
        outcome: "success",
        targetEmployeeAccountId: employee.id,
        requestContext,
      })
    );
    expect(JSON.stringify(mocks.recordPrivilegedAuditEvent.mock.calls)).not.toContain(
      result.temporaryPassword
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
      },
      requestContext
    );

    expect(result).toEqual({
      success: false,
      error: "Only Owners can create or change administrator roles.",
    });
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.createEmployeeAccountForActor).not.toHaveBeenCalled();
    expect(mocks.logDeniedPrivilegedAuditAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "employee.create",
        reason: "actor_cannot_manage_admin_roles",
      })
    );
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
      },
      requestContext
    );

    expect(result).toEqual({
      success: false,
      error: "You are not authorized to manage employee accounts.",
    });
    expect(mocks.hashPassword).not.toHaveBeenCalled();
    expect(mocks.createEmployeeAccountForActor).not.toHaveBeenCalled();
    expect(mocks.logDeniedPrivilegedAuditAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "employee.create",
        reason: "actor_cannot_manage_employees",
      })
    );
  });

  it("requires confirmation for high-impact role and status changes", async () => {
    mocks.findEmployeeDetailForActor.mockResolvedValue({
      ...employee,
      globalRole: "owner",
      status: "active",
    });

    const result = await updateEmployeeRoleStatusAdminService(
      actor,
      {
        employeeAccountId: employeeId,
        globalRole: "employee",
        status: "suspended",
      },
      requestContext
    );

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

    const result = await updateEmployeeRoleStatusAdminService(
      actor,
      {
        employeeAccountId: employeeId,
        globalRole: "employee",
        status: "active",
        confirmation: "CONFIRM",
      },
      requestContext
    );

    expect(result).toEqual({
      success: false,
      error: "The last active Owner cannot be demoted, suspended, or terminated.",
    });
  });

  it("records safe before and after details for employee identity updates", async () => {
    mocks.findEmployeeDetailForActor.mockResolvedValue(employee);
    mocks.updateEmployeeIdentityForActor.mockResolvedValue({
      ...employee,
      companyEmail: "updated@example.com",
      firstName: "Updated",
    });

    const result = await updateEmployeeIdentityAdminService(
      actor,
      {
        employeeAccountId: employeeId,
        companyEmail: "updated@example.com",
        personalEmail: "personal@example.com",
        firstName: "Updated",
        lastName: "Example",
        phone: "555-0100",
        githubUrl: "https://github.com/employee",
      },
      requestContext
    );

    expect(result).toEqual({
      success: true,
      message: "Employee identity updated.",
    });
    expect(mocks.recordPrivilegedAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "employee.identity.update",
        details: {
          before: expect.objectContaining({ companyEmail: "employee@example.com" }),
          after: expect.objectContaining({ companyEmail: "updated@example.com" }),
        },
      })
    );
  });

  it("fails closed when a privileged mutation audit write fails", async () => {
    mocks.findEmployeeDetailForActor.mockResolvedValue(employee);
    mocks.updateEmployeeIdentityForActor.mockResolvedValue(employee);
    mocks.recordPrivilegedAuditEvent.mockRejectedValue(new Error("audit failed"));

    await expect(
      updateEmployeeIdentityAdminService(
        actor,
        {
          employeeAccountId: employeeId,
          companyEmail: "employee@example.com",
          personalEmail: "personal@example.com",
          firstName: "Employee",
          lastName: "Example",
          phone: "555-0100",
          githubUrl: "https://github.com/employee",
        },
        requestContext
      )
    ).rejects.toThrow("audit failed");
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

    const result = await updateEmployeeProductAccessAdminService(
      actor,
      {
        employeeAccountId: employeeId,
        productKey: "kvisa_assistant",
        productRole: "reviewer",
      },
      requestContext
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.confirmation).toContain("CONFIRM");
    expect(mocks.assignEmployeeProductAccess).not.toHaveBeenCalled();
  });
});
