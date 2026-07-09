import { describe, expect, it } from "vitest";

import { parseAppEnv } from "@/lib/env/app-schema";

const validEnv = {
  APP_ENV: "local",
  APP_URL: "http://localhost:3000",
  SESSION_SECRET: "a".repeat(32),
  ENCRYPTION_KEY: "b".repeat(32),
  AUTH_EMAIL_FROM: "Aether Foundry <security@example.com>",
};

describe("parseAppEnv", () => {
  it("parses valid local auth environment", () => {
    expect(parseAppEnv(validEnv)).toEqual(
      expect.objectContaining({
        APP_ENV: "local",
        APP_URL: "http://localhost:3000",
        TRUST_PROXY_HEADERS: false,
        TRUSTED_PROXY_CIDRS: [],
        KVISA_ASSISTANT_ENABLED: false,
      })
    );
  });

  it("requires long session and encryption secrets", () => {
    expect(() =>
      parseAppEnv({ ...validEnv, SESSION_SECRET: "short" })
    ).toThrow("SESSION_SECRET must be at least 32 characters.");
    expect(() =>
      parseAppEnv({ ...validEnv, ENCRYPTION_KEY: "short" })
    ).toThrow("ENCRYPTION_KEY must be at least 32 characters.");
  });

  it("requires Redis and Resend in production", () => {
    expect(() =>
      parseAppEnv({ ...validEnv, APP_ENV: "production" })
    ).toThrow("REDIS_URL is required when APP_ENV=production.");
    expect(() =>
      parseAppEnv({
        ...validEnv,
        APP_ENV: "production",
        REDIS_URL: "redis://localhost:6379",
      })
    ).toThrow("RESEND_API_KEY is required when APP_ENV=production.");
  });

  it("requires a KVisaAssistant launch URL only when the product is enabled", () => {
    expect(
      parseAppEnv({ ...validEnv, KVISA_ASSISTANT_ENABLED: "false" })
        .KVISA_ASSISTANT_LAUNCH_URL
    ).toBeUndefined();

    expect(() =>
      parseAppEnv({ ...validEnv, KVISA_ASSISTANT_ENABLED: "true" })
    ).toThrow(
      "KVISA_ASSISTANT_LAUNCH_URL is required when KVISA_ASSISTANT_ENABLED=true."
    );

    expect(
      parseAppEnv({
        ...validEnv,
        KVISA_ASSISTANT_ENABLED: "true",
        KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001",
      })
    ).toEqual(
      expect.objectContaining({
        KVISA_ASSISTANT_ENABLED: true,
        KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001",
      })
    );
  });
});
