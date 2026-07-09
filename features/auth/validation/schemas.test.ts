import { describe, expect, it } from "vitest";

import {
  createEmployeeSchema,
  productAccessSchema,
  selfUpdateEmployeeProfileSchema,
} from "@/features/auth/validation/schemas";

const validEmployeeInput = {
  companyEmail: "Employee@Example.com",
  personalEmail: "Personal@Example.com",
  firstName: "Employee",
  lastName: "Example",
  phone: "555-0100",
  githubUrl: "https://github.com/employee",
  password: "secure password",
  globalRole: "employee",
  status: "active",
  verified: true,
};

describe("employee validation schemas", () => {
  it("normalizes email and accepts a complete employee identity", () => {
    const result = createEmployeeSchema.parse(validEmployeeInput);

    expect(result.companyEmail).toBe("employee@example.com");
    expect(result.personalEmail).toBe("personal@example.com");
  });

  it("requires identity fields including GitHub URL", () => {
    const result = createEmployeeSchema.safeParse({
      ...validEmployeeInput,
      firstName: "",
      githubUrl: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.firstName).toContain(
      "First name is required."
    );
    expect(result.error?.flatten().fieldErrors.githubUrl).toContain(
      "Enter a valid GitHub URL."
    );
  });

  it("rejects invalid global roles and statuses", () => {
    const roleResult = createEmployeeSchema.safeParse({
      ...validEmployeeInput,
      globalRole: "admin",
    });
    const statusResult = createEmployeeSchema.safeParse({
      ...validEmployeeInput,
      status: "disabled",
    });

    expect(roleResult.success).toBe(false);
    expect(statusResult.success).toBe(false);
  });

  it("rejects product roles outside the selected product", () => {
    const result = productAccessSchema.safeParse({
      employeeAccountId: "00000000-0000-4000-8000-000000000000",
      productKey: "kvisa_assistant",
      productRole: "billing_admin",
      launchAccessEnabled: true,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.productRole).toContain(
      "Product role is invalid for this product."
    );
  });

  it("normalizes self-service profile fields", () => {
    const result = selfUpdateEmployeeProfileSchema.parse({
      personalEmail: " Personal@Example.com ",
      phone: " 555-0100 ",
      githubUrl: " https://github.com/employee ",
    });

    expect(result).toEqual({
      personalEmail: "personal@example.com",
      phone: "555-0100",
      githubUrl: "https://github.com/employee",
    });
  });

  it("rejects invalid self-service profile fields", () => {
    const result = selfUpdateEmployeeProfileSchema.safeParse({
      personalEmail: "not-an-email",
      phone: "",
      githubUrl: "https://example.com/employee",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.personalEmail).toContain(
      "Enter a valid personal email."
    );
    expect(result.error?.flatten().fieldErrors.phone).toContain(
      "Phone is required."
    );
    expect(result.error?.flatten().fieldErrors.githubUrl).toContain(
      "Enter a valid GitHub URL."
    );
  });
});
