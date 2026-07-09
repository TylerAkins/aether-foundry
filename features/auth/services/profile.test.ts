import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findOwnEmployeeWithProductAccess: vi.fn(),
  updateOwnEmployeeProfile: vi.fn(),
}));

vi.mock("@/features/auth/services/employee-repository", async () => {
  const actual =
    await vi.importActual<typeof import("@/features/auth/services/employee-repository")>(
      "@/features/auth/services/employee-repository"
    );

  return {
    ...actual,
    findOwnEmployeeWithProductAccess: mocks.findOwnEmployeeWithProductAccess,
    updateOwnEmployeeProfile: mocks.updateOwnEmployeeProfile,
  };
});

import {
  getOwnEmployeeProfileService,
  updateOwnEmployeeProfileService,
} from "@/features/auth/services/profile";

const employee = {
  id: "employee-1",
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

describe("profile services", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("reads only the signed-in employee profile", async () => {
    mocks.findOwnEmployeeWithProductAccess.mockResolvedValue(employee);

    await expect(getOwnEmployeeProfileService("employee-1")).resolves.toBe(
      employee
    );
    expect(mocks.findOwnEmployeeWithProductAccess).toHaveBeenCalledWith(
      "employee-1"
    );
  });

  it("updates only allowed self-service profile fields", async () => {
    mocks.updateOwnEmployeeProfile.mockResolvedValue(employee);

    const result = await updateOwnEmployeeProfileService("employee-1", {
      personalEmail: " Personal@Example.com ",
      phone: " 555-0100 ",
      githubUrl: " https://github.com/employee ",
      companyEmail: "attacker@example.com",
      globalRole: "owner",
      status: "active",
      productKey: "kvisa_assistant",
    });

    expect(result).toEqual({ success: true, message: "Profile updated." });
    expect(mocks.updateOwnEmployeeProfile).toHaveBeenCalledWith({
      employeeAccountId: "employee-1",
      personalEmail: "personal@example.com",
      phone: "555-0100",
      githubUrl: "https://github.com/employee",
    });
  });

  it("returns field errors for invalid profile updates", async () => {
    const result = await updateOwnEmployeeProfileService("employee-1", {
      personalEmail: "nope",
      phone: "",
      githubUrl: "https://example.com/employee",
    });

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.personalEmail).toContain(
      "Enter a valid personal email."
    );
    expect(result.fieldErrors?.phone).toContain("Phone is required.");
    expect(result.fieldErrors?.githubUrl).toContain("Enter a valid GitHub URL.");
    expect(mocks.updateOwnEmployeeProfile).not.toHaveBeenCalled();
  });
});
