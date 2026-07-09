import { describe, expect, it, vi } from "vitest";

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

import {
  createProductRegistry,
  listEnabledProducts,
} from "@/lib/products/registry";

describe("product registry", () => {
  it("registers KVisaAssistant metadata and roles", () => {
    const registry = createProductRegistry({
      KVISA_ASSISTANT_ENABLED: true,
      KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001",
    });

    expect(registry.kvisa_assistant).toEqual(
      expect.objectContaining({
        key: "kvisa_assistant",
        displayName: "K Visa Assistant",
        enabled: true,
        launchUrl: "http://localhost:3001",
        roles: ["owner", "admin", "reviewer", "support"],
      })
    );
  });

  it("excludes disabled products from enabled listings", () => {
    const registry = createProductRegistry({
      KVISA_ASSISTANT_ENABLED: false,
      KVISA_ASSISTANT_LAUNCH_URL: undefined,
    });

    expect(listEnabledProducts(registry)).toEqual([]);
  });
});
