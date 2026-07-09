import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  checkAuthRateLimits: vi.fn(),
  findEmployeeById: vi.fn(),
  getDb: vi.fn(),
  toDataURL: vi.fn(),
  generateTotpSecret: vi.fn(),
  encryptTotpSecret: vi.fn(),
  generateTotpUri: vi.fn(),
}));

vi.mock("@/lib/security/auth-rate-limit", () => ({
  checkAuthRateLimits: mocks.checkAuthRateLimits,
}));

vi.mock("@/features/auth/services/employee-repository", () => ({
  findEmployeeById: mocks.findEmployeeById,
}));

vi.mock("@/lib/db", () => ({
  getDb: mocks.getDb,
}));

vi.mock("@/lib/auth/totp", () => ({
  decryptTotpSecret: vi.fn(),
  encryptTotpSecret: mocks.encryptTotpSecret,
  generateRecoveryCodes: vi.fn(),
  generateTotpSecret: mocks.generateTotpSecret,
  generateTotpUri: mocks.generateTotpUri,
  hashRecoveryCode: vi.fn(),
  verifyRecoveryCode: vi.fn(),
  verifyTotpCode: vi.fn(),
}));

vi.mock("@/lib/auth/cookies", () => ({
  setSessionCookie: vi.fn(),
}));

vi.mock("@/lib/auth/password", () => ({
  verifyLoginPassword: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  reissueEmployeeSession: vi.fn(),
}));

vi.mock("qrcode", () => ({
  default: {
    toDataURL: mocks.toDataURL,
  },
}));

import { beginTotpSetupService } from "@/features/auth/services/totp";

const employee = {
  id: "employee-1",
  email: "employee@example.com",
  passwordHash: "hash",
  role: "employee",
  status: "active",
  emailVerifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("beginTotpSetupService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.checkAuthRateLimits.mockResolvedValue({ allowed: true });
    mocks.findEmployeeById.mockResolvedValue(employee);
    mocks.generateTotpSecret.mockReturnValue("secret");
    mocks.encryptTotpSecret.mockReturnValue("encrypted-secret");
    mocks.generateTotpUri.mockReturnValue("otpauth://totp/Aether");
    mocks.toDataURL.mockResolvedValue("data:image/png;base64,qr");
  });

  it("does not overwrite or disable an existing enabled TOTP setting", async () => {
    const update = vi.fn();
    mocks.getDb.mockReturnValue({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([{ id: "totp-1", enabled: true }]),
          }),
        }),
      }),
      update,
    });

    const result = await beginTotpSetupService(employee.id, "127.0.0.1");

    expect(result).toEqual({
      success: false,
      error: "TOTP is already enabled. Remove it before starting setup again.",
    });
    expect(update).not.toHaveBeenCalled();
  });
});
