import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env/app", () => ({
  appEnv: {
    APP_ENV: "test",
    APP_URL: "http://localhost:3000",
    SESSION_SECRET: "a".repeat(32),
    ENCRYPTION_KEY: "b".repeat(32),
    AUTH_EMAIL_FROM: "Aether Foundry <security@example.com>",
    TRUST_PROXY_HEADERS: false,
    TRUSTED_PROXY_CIDRS: [],
    KVISA_ASSISTANT_ENABLED: false,
    KVISA_ASSISTANT_LAUNCH_URL: undefined,
  },
}));

const mocks = vi.hoisted(() => ({
  findEmployeeProductLaunchAuthorization: vi.fn(),
  signKVisaAssistantLaunchToken: vi.fn(),
}));

vi.mock("@/features/auth/services/employee-repository", () => ({
  findEmployeeProductLaunchAuthorization: mocks.findEmployeeProductLaunchAuthorization,
}));

vi.mock("@/lib/products/kvisa-launch-token", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/products/kvisa-launch-token")>(
      "@/lib/products/kvisa-launch-token"
    );

  return {
    ...actual,
    signKVisaAssistantLaunchToken: mocks.signKVisaAssistantLaunchToken,
  };
});

import { getEmployeeProductLaunch } from "@/lib/products/launcher";
import { createProductRegistry } from "@/lib/products/registry";

const enabledRegistry = createProductRegistry({
  KVISA_ASSISTANT_ENABLED: true,
  KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001",
});
const disabledRegistry = createProductRegistry({
  KVISA_ASSISTANT_ENABLED: false,
  KVISA_ASSISTANT_LAUNCH_URL: undefined,
});

describe("product launcher", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.signKVisaAssistantLaunchToken.mockResolvedValue("signed-launch-token");
  });

  it("authorizes an assigned employee and appends a signed launch token", async () => {
    mocks.findEmployeeProductLaunchAuthorization.mockResolvedValue({
      employee: {
        id: "employee-1",
        companyEmail: "employee@example.com",
        firstName: "Employee",
        middleName: null,
        lastName: "Example",
        globalRole: "employee",
      },
      productRole: "reviewer",
    });

    await expect(
      getEmployeeProductLaunch({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
        registry: enabledRegistry,
      })
    ).resolves.toEqual({
      status: "launchable",
      product: enabledRegistry.kvisa_assistant,
      launchUrl: "http://localhost:3001/?launch_token=signed-launch-token",
      launchToken: "signed-launch-token",
    });
    expect(mocks.signKVisaAssistantLaunchToken).toHaveBeenCalledWith({
      employee: {
        id: "employee-1",
        companyEmail: "employee@example.com",
        firstName: "Employee",
        middleName: null,
        lastName: "Example",
        globalRole: "employee",
      },
      productKey: "kvisa_assistant",
      productRole: "reviewer",
    });
  });

  it("preserves product launch URL query params when adding the token", async () => {
    const registry = createProductRegistry({
      KVISA_ASSISTANT_ENABLED: true,
      KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001/start?source=portal",
    });
    mocks.findEmployeeProductLaunchAuthorization.mockResolvedValue({
      employee: {
        id: "employee-1",
        companyEmail: "employee@example.com",
        firstName: "Employee",
        middleName: null,
        lastName: "Example",
        globalRole: "employee",
      },
      productRole: "reviewer",
    });

    await expect(
      getEmployeeProductLaunch({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
        registry,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        launchUrl:
          "http://localhost:3001/start?source=portal&launch_token=signed-launch-token",
      })
    );
  });

  it("rejects employees without product access", async () => {
    mocks.findEmployeeProductLaunchAuthorization.mockResolvedValue(null);

    await expect(
      getEmployeeProductLaunch({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
        registry: enabledRegistry,
      })
    ).resolves.toEqual({
      status: "unauthorized",
      product: enabledRegistry.kvisa_assistant,
    });
    expect(mocks.signKVisaAssistantLaunchToken).not.toHaveBeenCalled();
  });

  it("rejects disabled products before checking employee assignment", async () => {
    await expect(
      getEmployeeProductLaunch({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
        registry: disabledRegistry,
      })
    ).resolves.toEqual({
      status: "disabled",
      product: disabledRegistry.kvisa_assistant,
    });
    expect(mocks.findEmployeeProductLaunchAuthorization).not.toHaveBeenCalled();
    expect(mocks.signKVisaAssistantLaunchToken).not.toHaveBeenCalled();
  });

  it("rejects unknown product keys", async () => {
    await expect(
      getEmployeeProductLaunch({
        employeeAccountId: "employee-1",
        productKey: "unknown_product",
        registry: enabledRegistry,
      })
    ).resolves.toEqual({ status: "unknown" });
  });
});
