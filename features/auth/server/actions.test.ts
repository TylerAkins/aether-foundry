import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireEmployeeSession: vi.fn(),
  updateOwnEmployeeProfileService: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("@/lib/auth/current-session", () => ({
  requireEmployeeSession: mocks.requireEmployeeSession,
}));

vi.mock("@/features/auth/services/profile", () => ({
  updateOwnEmployeeProfileService: mocks.updateOwnEmployeeProfileService,
}));

vi.mock("@/features/auth/services/admin-employees", () => ({
  createEmployeeAdminService: vi.fn(),
  updateEmployeeIdentityAdminService: vi.fn(),
  updateEmployeeProductAccessAdminService: vi.fn(),
  updateEmployeeRoleStatusAdminService: vi.fn(),
}));

vi.mock("@/features/auth/services/email-flows", () => ({
  requestPasswordResetService: vi.fn(),
  requestVerificationEmailService: vi.fn(),
  resetPasswordService: vi.fn(),
  verifyEmailService: vi.fn(),
}));

vi.mock("@/features/auth/services/login", () => ({
  loginEmployeeService: vi.fn(),
  logoutEmployeeService: vi.fn(),
  verifyLoginTotpService: vi.fn(),
}));

vi.mock("@/features/auth/services/totp", () => ({
  beginTotpSetupService: vi.fn(),
  confirmTotpSetupService: vi.fn(),
  disableTotpService: vi.fn(),
  regenerateRecoveryCodesService: vi.fn(),
}));

vi.mock("@/lib/security/client-ip", () => ({
  getAuditRequestContext: vi.fn(async () => ({
    clientIp: "127.0.0.1",
    userAgentHash: "user-agent-hash",
  })),
  getAuthClientIp: vi.fn(async () => "127.0.0.1"),
}));

import { updateOwnEmployeeProfileAction } from "@/features/auth/server/actions";

describe("auth server actions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireEmployeeSession.mockResolvedValue({
      employee: {
        id: "employee-1",
        companyEmail: "employee@example.com",
        globalRole: "employee",
        status: "active",
        emailVerifiedAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      session: { id: "session-1" },
    });
  });

  it("requires the current employee session for profile updates", async () => {
    mocks.updateOwnEmployeeProfileService.mockResolvedValue({
      success: true,
      message: "Profile updated.",
    });
    const formData = new FormData();
    formData.set("personalEmail", "personal@example.com");
    formData.set("phone", "555-0100");
    formData.set("githubUrl", "https://github.com/employee");

    await expect(updateOwnEmployeeProfileAction(formData)).resolves.toEqual({
      success: true,
      message: "Profile updated.",
    });
    expect(mocks.requireEmployeeSession).toHaveBeenCalledOnce();
    expect(mocks.updateOwnEmployeeProfileService).toHaveBeenCalledWith(
      "employee-1",
      {
        personalEmail: "personal@example.com",
        phone: "555-0100",
        githubUrl: "https://github.com/employee",
      }
    );
  });
});
