import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getDb: mocks.getDb,
}));

import * as repository from "@/features/auth/services/employee-repository";

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-02T00:00:00.000Z");
const credentialRow = {
  id: "employee-1",
  companyEmail: "employee@example.com",
  personalEmail: "personal@example.com",
  firstName: "Employee",
  middleName: null,
  lastName: "Example",
  phone: "555-0100",
  githubUrl: "https://github.com/employee",
  passwordHash: "hash",
  globalRole: "employee",
  status: "active",
  emailVerifiedAt: new Date("2026-01-03T00:00:00.000Z"),
  createdAt,
  updatedAt,
};

describe("employee repository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("creates employees with normalized company email and returns a DTO", async () => {
    const returning = vi.fn().mockResolvedValue([
      {
        ...credentialRow,
        companyEmail: "employee@example.com",
      },
    ]);
    const values = vi.fn(() => ({ returning }));
    const insert = vi.fn(() => ({ values }));
    mocks.getDb.mockReturnValue({ insert });

    const employee = await repository.createEmployeeAccount({
      companyEmail: " Employee@Example.com ",
      personalEmail: " Personal@Example.com ",
      firstName: " Employee ",
      middleName: "",
      lastName: " Example ",
      phone: " 555-0100 ",
      githubUrl: " https://github.com/employee ",
      passwordHash: "hash",
      globalRole: "employee",
      status: "active",
      verified: true,
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        companyEmail: "employee@example.com",
        personalEmail: "personal@example.com",
        firstName: "Employee",
        middleName: null,
      })
    );
    expect(employee).toEqual({
      id: "employee-1",
      companyEmail: "employee@example.com",
      personalEmail: "personal@example.com",
      firstName: "Employee",
      middleName: null,
      lastName: "Example",
      phone: "555-0100",
      githubUrl: "https://github.com/employee",
      globalRole: "employee",
      status: "active",
      emailVerifiedAt: credentialRow.emailVerifiedAt,
      createdAt,
      updatedAt,
    });
    expect("passwordHash" in employee).toBe(false);
  });

  it("maps duplicate company email violations to a domain error", async () => {
    const returning = vi.fn().mockRejectedValue({
      code: "23505",
      constraint_name: "employee_accounts_company_email_idx",
    });
    mocks.getDb.mockReturnValue({
      insert: () => ({ values: () => ({ returning }) }),
    });

    await expect(
      repository.createEmployeeAccount({
        companyEmail: "employee@example.com",
        personalEmail: "personal@example.com",
        firstName: "Employee",
        lastName: "Example",
        phone: "555-0100",
        githubUrl: "https://github.com/employee",
        passwordHash: "hash",
        globalRole: "employee",
        status: "active",
        verified: true,
      })
    ).rejects.toBeInstanceOf(repository.DuplicateCompanyEmailError);
  });

  it("does not expose an employee hard-delete API", () => {
    expect("deleteEmployeeAccount" in repository).toBe(false);
    expect("deleteEmployeeById" in repository).toBe(false);
  });

  it("scopes employee reads to self or administrators", () => {
    expect(
      repository.canReadEmployee(
        { id: "employee-1", globalRole: "employee" },
        "employee-1"
      )
    ).toBe(true);
    expect(
      repository.canReadEmployee(
        { id: "employee-1", globalRole: "employee" },
        "employee-2"
      )
    ).toBe(false);
    expect(
      repository.canReadEmployee(
        { id: "admin-1", globalRole: "system_admin" },
        "employee-2"
      )
    ).toBe(true);
  });

  it("requires owner or system administrator for employee management", () => {
    expect(
      repository.canManageEmployees({ id: "owner-1", globalRole: "owner" })
    ).toBe(true);
    expect(
      repository.canManageEmployees({ id: "admin-1", globalRole: "system_admin" })
    ).toBe(true);
    expect(
      repository.canManageEmployees({ id: "employee-1", globalRole: "employee" })
    ).toBe(false);
  });

  it("requires owner for administrator role changes", () => {
    expect(
      repository.canManageAdminRoles({ id: "owner-1", globalRole: "owner" })
    ).toBe(true);
    expect(
      repository.canManageAdminRoles({
        id: "admin-1",
        globalRole: "system_admin",
      })
    ).toBe(false);
    expect(
      repository.canManageAdminRoles({
        id: "employee-1",
        globalRole: "employee",
      })
    ).toBe(false);
  });

  it("protects the last active owner through the legacy status helper", async () => {
    const firstFindLimit = vi.fn().mockResolvedValue([
      {
        ...credentialRow,
        id: "owner-1",
        globalRole: "owner",
        status: "active",
      },
    ]);
    const secondFindLimit = vi.fn().mockResolvedValue([
      {
        ...credentialRow,
        id: "owner-1",
        globalRole: "owner",
        status: "active",
      },
    ]);
    const countWhere = vi.fn().mockResolvedValue([{ value: 0 }]);
    const update = vi.fn();

    mocks.getDb
      .mockReturnValueOnce({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: firstFindLimit,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: () => ({
          from: () => ({
            where: () => ({
              limit: secondFindLimit,
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        select: () => ({
          from: () => ({
            where: countWhere,
          }),
        }),
      })
      .mockReturnValue({ update });

    await expect(
      repository.updateEmployeeStatus({
        actor: { id: "owner-2", globalRole: "owner" },
        employeeAccountId: "owner-1",
        status: "suspended",
      })
    ).rejects.toBeInstanceOf(repository.LastActiveOwnerError);
    expect(update).not.toHaveBeenCalled();
  });

  it("fetches the signed-in employee profile with product access", async () => {
    const rows = [
      {
        employee: credentialRow,
        access: {
          employeeAccountId: "employee-1",
          productKey: "kvisa_assistant",
          productRole: "reviewer",
          launchAccessEnabled: true,
          createdAt,
          updatedAt,
        },
      },
    ];
    const where = vi.fn().mockResolvedValue(rows);

    mocks.getDb.mockReturnValue({
      select: () => ({
        from: () => ({
          leftJoin: () => ({
            where,
          }),
        }),
      }),
    });

    const employee =
      await repository.findOwnEmployeeWithProductAccess("employee-1");

    expect(where).toHaveBeenCalledOnce();
    expect(employee).toEqual({
      id: "employee-1",
      companyEmail: "employee@example.com",
      personalEmail: "personal@example.com",
      firstName: "Employee",
      middleName: null,
      lastName: "Example",
      phone: "555-0100",
      githubUrl: "https://github.com/employee",
      globalRole: "employee",
      status: "active",
      emailVerifiedAt: credentialRow.emailVerifiedAt,
      createdAt,
      updatedAt,
      productAccess: [
        {
          employeeAccountId: "employee-1",
          productKey: "kvisa_assistant",
          productRole: "reviewer",
          launchAccessEnabled: true,
          createdAt,
          updatedAt,
        },
      ],
    });
  });

  it("updates only permitted self-service profile fields", async () => {
    const returning = vi.fn().mockResolvedValue([
      {
        ...credentialRow,
        personalEmail: "personal@example.com",
        phone: "555-0100",
        githubUrl: "https://github.com/employee",
      },
    ]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn((payload: Record<string, unknown>) => {
      void payload;
      return { where };
    });
    const update = vi.fn(() => ({ set }));
    mocks.getDb.mockReturnValue({ update });

    await repository.updateOwnEmployeeProfile({
      employeeAccountId: "employee-1",
      personalEmail: " Personal@Example.com ",
      phone: " 555-0100 ",
      githubUrl: " https://github.com/employee ",
    });

    expect(set).toHaveBeenCalledWith({
      personalEmail: "personal@example.com",
      phone: "555-0100",
      githubUrl: "https://github.com/employee",
      updatedAt: expect.any(Date),
    });
    const updatePayload = set.mock.calls[0]?.[0];
    expect(updatePayload).not.toHaveProperty("companyEmail");
    expect(updatePayload).not.toHaveProperty("globalRole");
    expect(updatePayload).not.toHaveProperty("status");
    expect(updatePayload).not.toHaveProperty("productAccess");
    expect(where).toHaveBeenCalledOnce();
  });

  it("evaluates product launch access independently from global roles", async () => {
    mockLaunchRows([
      {
        employee: credentialRow,
        productRole: "reviewer",
        launchAccessEnabled: true,
      },
    ]);

    await expect(
      repository.canEmployeeLaunchProduct({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
        allowedRoles: ["reviewer"],
      })
    ).resolves.toBe(true);

    mockLaunchRows([
      {
        employee: credentialRow,
        productRole: "support",
        launchAccessEnabled: true,
      },
    ]);

    await expect(
      repository.canEmployeeLaunchProduct({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
        allowedRoles: ["reviewer"],
      })
    ).resolves.toBe(false);
  });

  it("returns launch employee identity and product role after authorization", async () => {
    mockLaunchRows([
      {
        employee: credentialRow,
        productRole: "reviewer",
        launchAccessEnabled: true,
      },
    ]);

    await expect(
      repository.findEmployeeProductLaunchAuthorization({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
      })
    ).resolves.toEqual({
      employee: {
        id: "employee-1",
        companyEmail: "employee@example.com",
        personalEmail: "personal@example.com",
        firstName: "Employee",
        middleName: null,
        lastName: "Example",
        phone: "555-0100",
        githubUrl: "https://github.com/employee",
        globalRole: "employee",
        status: "active",
        emailVerifiedAt: credentialRow.emailVerifiedAt,
        createdAt,
        updatedAt,
      },
      productRole: "reviewer",
    });
  });

  it.each(["pending", "suspended", "terminated"] as const)(
    "denies %s employees launch authorization",
    async (status) => {
      mockLaunchRows([
        {
          employee: { ...credentialRow, status },
          productRole: "reviewer",
          launchAccessEnabled: true,
        },
      ]);

      await expect(
        repository.findEmployeeProductLaunchAuthorization({
          employeeAccountId: "employee-1",
          productKey: "kvisa_assistant",
        })
      ).resolves.toBeNull();
    }
  );

  it("denies unverified, missing, role-disallowed, and launch-disabled employees", async () => {
    mockLaunchRows([
      {
        employee: { ...credentialRow, emailVerifiedAt: null },
        productRole: "reviewer",
        launchAccessEnabled: true,
      },
    ]);

    await expect(
      repository.findEmployeeProductLaunchAuthorization({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
      })
    ).resolves.toBeNull();

    mockLaunchRows([]);

    await expect(
      repository.findEmployeeProductLaunchAuthorization({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
      })
    ).resolves.toBeNull();

    mockLaunchRows([
      {
        employee: credentialRow,
        productRole: "support",
        launchAccessEnabled: true,
      },
    ]);

    await expect(
      repository.findEmployeeProductLaunchAuthorization({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
        allowedRoles: ["reviewer"],
      })
    ).resolves.toBeNull();

    mockLaunchRows([
      {
        employee: credentialRow,
        productRole: "reviewer",
        launchAccessEnabled: false,
      },
    ]);

    await expect(
      repository.findEmployeeProductLaunchAuthorization({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
      })
    ).resolves.toBeNull();
  });
});

function mockLaunchRows(rows: unknown[]) {
  mocks.getDb.mockReturnValue({
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => ({
            limit: () => Promise.resolve(rows),
          }),
        }),
      }),
    }),
  });
}
