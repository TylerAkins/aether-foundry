import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findEmployeeByEmail: vi.fn(),
  canEmployeeSignIn: vi.fn(),
  findEmployeeCredentialsById: vi.fn(),
  markRecoveryCodeUsed: vi.fn(),
  verifyLoginPassword: vi.fn(),
  getDb: vi.fn(),
  checkAuthRateLimits: vi.fn(),
  getSessionIdFromCookies: vi.fn(),
  setSessionCookie: vi.fn(),
  clearSessionCookie: vi.fn(),
  getPendingLoginIdFromCookies: vi.fn(),
  setPendingLoginCookie: vi.fn(),
  clearPendingLoginCookie: vi.fn(),
  createPendingLogin: vi.fn(),
  getPendingLogin: vi.fn(),
  incrementPendingLoginAttempts: vi.fn(),
  deletePendingLogin: vi.fn(),
  deleteSession: vi.fn(),
  rotateSession: vi.fn(),
  verifyTotpCode: vi.fn(),
  verifyRecoveryCode: vi.fn(),
  decryptTotpSecret: vi.fn(),
}));

vi.mock("@/features/auth/services/employee-repository", () => ({
  findEmployeeByEmail: mocks.findEmployeeByEmail,
  canEmployeeSignIn: mocks.canEmployeeSignIn,
  findEmployeeCredentialsById: mocks.findEmployeeCredentialsById,
  markRecoveryCodeUsed: mocks.markRecoveryCodeUsed,
}));

vi.mock("@/lib/auth/password", () => ({
  verifyLoginPassword: mocks.verifyLoginPassword,
}));

vi.mock("@/lib/db", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/security/auth-rate-limit", () => ({
  checkAuthRateLimits: mocks.checkAuthRateLimits,
}));

vi.mock("@/lib/auth/cookies", () => ({
  getSessionIdFromCookies: mocks.getSessionIdFromCookies,
  setSessionCookie: mocks.setSessionCookie,
  clearSessionCookie: mocks.clearSessionCookie,
  getPendingLoginIdFromCookies: mocks.getPendingLoginIdFromCookies,
  setPendingLoginCookie: mocks.setPendingLoginCookie,
  clearPendingLoginCookie: mocks.clearPendingLoginCookie,
}));

vi.mock("@/lib/auth/pending-login", () => ({
  createPendingLogin: mocks.createPendingLogin,
  getPendingLogin: mocks.getPendingLogin,
  incrementPendingLoginAttempts: mocks.incrementPendingLoginAttempts,
  deletePendingLogin: mocks.deletePendingLogin,
}));

vi.mock("@/lib/auth/session", () => ({
  deleteSession: mocks.deleteSession,
  rotateSession: mocks.rotateSession,
}));

vi.mock("@/lib/auth/totp", () => ({
  decryptTotpSecret: mocks.decryptTotpSecret,
  verifyRecoveryCode: mocks.verifyRecoveryCode,
  verifyTotpCode: mocks.verifyTotpCode,
}));

import {
  loginEmployeeService,
  verifyLoginTotpService,
} from "@/features/auth/services/login";

const employee = {
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
  emailVerifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("loginEmployeeService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.checkAuthRateLimits.mockResolvedValue({ allowed: true });
    mocks.canEmployeeSignIn.mockReturnValue(true);
    mocks.findEmployeeCredentialsById.mockResolvedValue(employee);
    mocks.getSessionIdFromCookies.mockResolvedValue(null);
    mocks.rotateSession.mockResolvedValue({ id: "session-1" });
    mockTotpRows([]);
  });

  it("signs in a verified active employee and rotates the session", async () => {
    mocks.findEmployeeByEmail.mockResolvedValue(employee);
    mocks.verifyLoginPassword.mockResolvedValue(true);

    const result = await loginEmployeeService(
      { email: "Employee@Example.com", password: "password" },
      "127.0.0.1"
    );

    expect(result).toEqual({ success: true, redirectTo: "/portal" });
    expect(mocks.rotateSession).toHaveBeenCalledWith(null, employee.id);
    expect(mocks.setSessionCookie).toHaveBeenCalledWith("session-1");
  });

  it("returns the same safe response for unknown email and bad password", async () => {
    mocks.findEmployeeByEmail.mockResolvedValue(null);
    mocks.verifyLoginPassword.mockResolvedValue(false);

    const unknownResult = await loginEmployeeService(
      { email: "missing@example.com", password: "password" },
      "127.0.0.1"
    );

    mocks.findEmployeeByEmail.mockResolvedValue(employee);
    mocks.verifyLoginPassword.mockResolvedValue(false);

    const badPasswordResult = await loginEmployeeService(
      { email: "employee@example.com", password: "password" },
      "127.0.0.1"
    );

    expect(unknownResult).toEqual(badPasswordResult);
  });

  it("requires a second factor when TOTP is enabled", async () => {
    mocks.findEmployeeByEmail.mockResolvedValue(employee);
    mocks.verifyLoginPassword.mockResolvedValue(true);
    mocks.getSessionIdFromCookies.mockResolvedValue("old-session");
    mocks.createPendingLogin.mockResolvedValue({ id: "pending-1" });
    mockTotpRows([{ enabled: true }]);

    const result = await loginEmployeeService(
      { email: "employee@example.com", password: "password" },
      "127.0.0.1"
    );

    expect(result).toEqual({ success: true, requiresTotp: true });
    expect(mocks.deleteSession).toHaveBeenCalledWith("old-session");
    expect(mocks.setPendingLoginCookie).toHaveBeenCalledWith("pending-1");
  });

  it("returns a throttled response without checking credentials", async () => {
    mocks.checkAuthRateLimits.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 30,
    });

    const result = await loginEmployeeService(
      { email: "employee@example.com", password: "password" },
      "127.0.0.1"
    );

    expect(result).toEqual({
      success: false,
      error: "Too many attempts. Try again in 30 seconds.",
    });
    expect(mocks.verifyLoginPassword).not.toHaveBeenCalled();
  });

  it.each(["pending", "suspended", "terminated"])(
    "rejects %s employees",
    async (status) => {
      mocks.findEmployeeByEmail.mockResolvedValue({ ...employee, status });
      mocks.verifyLoginPassword.mockResolvedValue(true);
      mocks.canEmployeeSignIn.mockReturnValue(false);

      const result = await loginEmployeeService(
        { email: "employee@example.com", password: "password" },
        "127.0.0.1"
      );

      expect(result).toEqual({
        success: false,
        error: "The email or password you entered is incorrect.",
      });
      expect(mocks.rotateSession).not.toHaveBeenCalled();
    }
  );
});

describe("verifyLoginTotpService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.checkAuthRateLimits.mockResolvedValue({ allowed: true });
    mocks.getPendingLoginIdFromCookies.mockResolvedValue("pending-1");
    mocks.getPendingLogin.mockResolvedValue({
      id: "pending-1",
      employeeAccountId: employee.id,
      attemptCount: 0,
      expiresAt: new Date(Date.now() + 1000),
      createdAt: new Date(),
    });
    mocks.canEmployeeSignIn.mockReturnValue(true);
    mocks.findEmployeeCredentialsById.mockResolvedValue(employee);
    mocks.getSessionIdFromCookies.mockResolvedValue(null);
    mocks.rotateSession.mockResolvedValue({ id: "session-1" });
  });

  it("completes TOTP login with a valid authenticator code", async () => {
    mocks.decryptTotpSecret.mockReturnValue("secret");
    mocks.verifyTotpCode.mockResolvedValue(true);
    mockTotpRows([{ enabled: true, secretEncrypted: "encrypted" }]);

    const result = await verifyLoginTotpService(
      { code: "123456" },
      "127.0.0.1"
    );

    expect(result).toEqual({ success: true, redirectTo: "/portal" });
    expect(mocks.deletePendingLogin).toHaveBeenCalledWith("pending-1");
    expect(mocks.setSessionCookie).toHaveBeenCalledWith("session-1");
  });

  it("uses each recovery code only once", async () => {
    mocks.verifyRecoveryCode.mockResolvedValue(true);
    mocks.markRecoveryCodeUsed.mockResolvedValue(false);
    mockRecoveryCodeRows([{ id: "code-1", codeHash: "hash", usedAt: null }]);

    const result = await verifyLoginTotpService(
      { recoveryCode: "abcd-efgh" },
      "127.0.0.1"
    );

    expect(result.success).toBe(false);
    expect(mocks.rotateSession).not.toHaveBeenCalled();
  });

  it("does not rotate a session when the employee is no longer active", async () => {
    mocks.decryptTotpSecret.mockReturnValue("secret");
    mocks.verifyTotpCode.mockResolvedValue(true);
    mocks.findEmployeeCredentialsById.mockResolvedValue({
      ...employee,
      status: "suspended",
    });
    mocks.canEmployeeSignIn.mockReturnValue(false);
    mockTotpRows([{ enabled: true, secretEncrypted: "encrypted" }]);

    const result = await verifyLoginTotpService(
      { code: "123456" },
      "127.0.0.1"
    );

    expect(result).toEqual({
      success: false,
      error: "The email or password you entered is incorrect.",
    });
    expect(mocks.rotateSession).not.toHaveBeenCalled();
    expect(mocks.deletePendingLogin).toHaveBeenCalledWith("pending-1");
  });
});

function mockTotpRows(rows: unknown[]) {
  mocks.getDb.mockReturnValue({
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(rows),
        }),
      }),
    }),
  });
}

function mockRecoveryCodeRows(rows: unknown[]) {
  mocks.getDb.mockReturnValue({
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(rows),
      }),
    }),
  });
}
