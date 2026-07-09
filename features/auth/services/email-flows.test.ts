import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findEmployeeByEmail: vi.fn(),
  canEmployeeSignIn: vi.fn(),
  createPasswordResetToken: vi.fn(),
  consumePasswordResetToken: vi.fn(),
  updateEmployeePassword: vi.fn(),
  createEmailVerificationToken: vi.fn(),
  consumeEmailVerificationToken: vi.fn(),
  hashPassword: vi.fn(),
  deleteEmployeeSessions: vi.fn(),
  send: vi.fn(),
  checkAuthRateLimits: vi.fn(),
}));

vi.mock("@/features/auth/services/employee-repository", () => ({
  findEmployeeByEmail: mocks.findEmployeeByEmail,
  canEmployeeSignIn: mocks.canEmployeeSignIn,
  createPasswordResetToken: mocks.createPasswordResetToken,
  consumePasswordResetToken: mocks.consumePasswordResetToken,
  updateEmployeePassword: mocks.updateEmployeePassword,
  createEmailVerificationToken: mocks.createEmailVerificationToken,
  consumeEmailVerificationToken: mocks.consumeEmailVerificationToken,
}));

vi.mock("@/lib/auth/password", () => ({
  hashPassword: mocks.hashPassword,
}));

vi.mock("@/lib/auth/session", () => ({
  deleteEmployeeSessions: mocks.deleteEmployeeSessions,
}));

vi.mock("@/lib/email/provider", () => ({
  getEmailProvider: () => ({ send: mocks.send }),
}));

vi.mock("@/lib/security/auth-rate-limit", () => ({
  checkAuthRateLimits: mocks.checkAuthRateLimits,
}));

vi.mock("@/lib/env/app", () => ({
  appEnv: {
    APP_URL: "https://aether.example",
  },
}));

import {
  requestPasswordResetService,
  requestVerificationEmailService,
  resetPasswordService,
  verifyEmailService,
} from "@/features/auth/services/email-flows";

const employee = {
  id: "employee-1",
  companyEmail: "employee@example.com",
  personalEmail: "personal@example.com",
  firstName: "Employee",
  middleName: null,
  lastName: "Example",
  phone: "555-0100",
  githubUrl: "https://github.com/employee",
  passwordHash: "old-hash",
  globalRole: "employee",
  status: "active",
  emailVerifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("email auth flows", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.checkAuthRateLimits.mockResolvedValue({ allowed: true });
    mocks.canEmployeeSignIn.mockReturnValue(true);
    mocks.hashPassword.mockResolvedValue("new-hash");
  });

  it("returns the same reset request message for known and unknown emails", async () => {
    mocks.findEmployeeByEmail.mockResolvedValue(null);

    const unknown = await requestPasswordResetService(
      { email: "missing@example.com" },
      "127.0.0.1"
    );

    mocks.findEmployeeByEmail.mockResolvedValue(employee);

    const known = await requestPasswordResetService(
      { email: "employee@example.com" },
      "127.0.0.1"
    );

    expect(unknown).toEqual(known);
    expect(mocks.createPasswordResetToken).toHaveBeenCalledWith(
      expect.objectContaining({ employeeAccountId: employee.id })
    );
  });

  it("does not create reset tokens for honeypot submissions", async () => {
    const result = await requestPasswordResetService(
      { email: "employee@example.com", companyWebsite: "bot" },
      "127.0.0.1"
    );

    expect(result.success).toBe(true);
    expect(mocks.createPasswordResetToken).not.toHaveBeenCalled();
  });

  it("updates password and invalidates sessions after reset token consume", async () => {
    mocks.consumePasswordResetToken.mockResolvedValue(employee);

    const result = await resetPasswordService(
      { token: "reset-token-with-enough-length", password: "new secure password" },
      "127.0.0.1"
    );

    expect(result.success).toBe(true);
    expect(mocks.updateEmployeePassword).toHaveBeenCalledWith({
      employeeAccountId: employee.id,
      passwordHash: "new-hash",
    });
    expect(mocks.deleteEmployeeSessions).toHaveBeenCalledWith(employee.id);
  });

  it("verifies email tokens only through the consume function", async () => {
    mocks.consumeEmailVerificationToken.mockResolvedValue({
      ...employee,
      emailVerifiedAt: new Date(),
    });

    const result = await verifyEmailService(
      { token: "verify-token-with-enough-length" },
      "127.0.0.1"
    );

    expect(result).toEqual({
      success: true,
      message: "Your employee account is verified.",
    });
    expect(mocks.consumeEmailVerificationToken).toHaveBeenCalledWith(
      "verify-token-with-enough-length"
    );
  });

  it("creates verification tokens only for active unverified employees", async () => {
    mocks.findEmployeeByEmail.mockResolvedValue({
      ...employee,
      emailVerifiedAt: null,
    });

    const result = await requestVerificationEmailService(
      { email: "employee@example.com" },
      "127.0.0.1"
    );

    expect(result.success).toBe(true);
    expect(mocks.createEmailVerificationToken).toHaveBeenCalledWith(
      expect.objectContaining({ employeeAccountId: employee.id })
    );
  });

  it("does not create reset tokens for suspended or terminated employees", async () => {
    mocks.findEmployeeByEmail.mockResolvedValue({
      ...employee,
      status: "suspended",
    });
    mocks.canEmployeeSignIn.mockReturnValue(false);

    const suspendedResult = await requestPasswordResetService(
      { email: "employee@example.com" },
      "127.0.0.1"
    );

    mocks.findEmployeeByEmail.mockResolvedValue({
      ...employee,
      status: "terminated",
    });

    const terminatedResult = await requestPasswordResetService(
      { email: "employee@example.com" },
      "127.0.0.1"
    );

    expect(suspendedResult.success).toBe(true);
    expect(terminatedResult.success).toBe(true);
    expect(mocks.createPasswordResetToken).not.toHaveBeenCalled();
  });
});
