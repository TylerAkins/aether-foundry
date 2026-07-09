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
  canEmployeeLaunchProduct: vi.fn(),
}));

vi.mock("@/features/auth/services/employee-repository", () => ({
  canEmployeeLaunchProduct: mocks.canEmployeeLaunchProduct,
}));

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
  });

  it("authorizes an assigned employee when the product is enabled", async () => {
    mocks.canEmployeeLaunchProduct.mockResolvedValue(true);

    await expect(
      getEmployeeProductLaunch({
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
        registry: enabledRegistry,
      })
    ).resolves.toEqual({
      status: "launchable",
      product: enabledRegistry.kvisa_assistant,
      launchUrl: "http://localhost:3001",
    });
  });

  it("rejects employees without product access", async () => {
    mocks.canEmployeeLaunchProduct.mockResolvedValue(false);

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
    expect(mocks.canEmployeeLaunchProduct).not.toHaveBeenCalled();
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
