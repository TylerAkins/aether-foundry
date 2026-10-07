import { generateKeyPairSync } from "node:crypto";

import { describe, expect, it } from "vitest";

import { parseAppEnv } from "@/lib/env/app-schema";

const validEnv = {
  APP_ENV: "local",
  APP_URL: "http://localhost:3000",
  SESSION_SECRET: "a".repeat(32),
  ENCRYPTION_KEY: "b".repeat(32),
  AUTH_EMAIL_FROM: "Aether Foundry <security@example.com>",
};
const placeholderLaunchTokenPrivateKey =
  "-----BEGIN PRIVATE KEY-----\\nreplace-with-pkcs8-rsa-private-key\\n-----END PRIVATE KEY-----";
const validLaunchTokenPrivateKey = generatePrivateKeyPem().replaceAll("\n", "\\n");

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

  it("requires KVisaAssistant launch configuration only when the product is enabled", () => {
    expect(
      parseAppEnv({ ...validEnv, KVISA_ASSISTANT_ENABLED: "false" })
        .KVISA_ASSISTANT_LAUNCH_URL
    ).toBeUndefined();

    expect(
      parseAppEnv({
        ...validEnv,
        KVISA_ASSISTANT_ENABLED: "false",
        KVISA_ASSISTANT_LAUNCH_TOKEN_PRIVATE_KEY:
          placeholderLaunchTokenPrivateKey,
      })
    ).toEqual(
      expect.objectContaining({
        KVISA_ASSISTANT_ENABLED: false,
        KVISA_ASSISTANT_LAUNCH_TOKEN_PRIVATE_KEY:
          placeholderLaunchTokenPrivateKey,
      })
    );

    expect(() =>
      parseAppEnv({ ...validEnv, KVISA_ASSISTANT_ENABLED: "true" })
    ).toThrow(
      "KVISA_ASSISTANT_LAUNCH_URL is required when KVISA_ASSISTANT_ENABLED=true."
    );

    expect(() =>
      parseAppEnv({
        ...validEnv,
        KVISA_ASSISTANT_ENABLED: "true",
        KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001",
      })
    ).toThrow(
      "KVISA_ASSISTANT_LAUNCH_TOKEN_PRIVATE_KEY is required when KVISA_ASSISTANT_ENABLED=true."
    );

    expect(() =>
      parseAppEnv({
        ...validEnv,
        KVISA_ASSISTANT_ENABLED: "true",
        KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001",
        KVISA_ASSISTANT_LAUNCH_TOKEN_PRIVATE_KEY: validLaunchTokenPrivateKey,
      })
    ).toThrow(
      "KVISA_ASSISTANT_LAUNCH_TOKEN_KEY_ID is required when KVISA_ASSISTANT_ENABLED=true."
    );

    expect(
      parseAppEnv({
        ...validEnv,
        KVISA_ASSISTANT_ENABLED: "true",
        KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001",
        KVISA_ASSISTANT_LAUNCH_TOKEN_PRIVATE_KEY: validLaunchTokenPrivateKey,
        KVISA_ASSISTANT_LAUNCH_TOKEN_KEY_ID: "kvisa-local-1",
      })
    ).toEqual(
      expect.objectContaining({
        KVISA_ASSISTANT_ENABLED: true,
        KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001",
        KVISA_ASSISTANT_LAUNCH_TOKEN_PRIVATE_KEY: validLaunchTokenPrivateKey,
        KVISA_ASSISTANT_LAUNCH_TOKEN_KEY_ID: "kvisa-local-1",
      })
    );
  });

  it("rejects non-HTTP KVisaAssistant launch URLs", () => {
    expect(() =>
      parseAppEnv({
        ...validEnv,
        KVISA_ASSISTANT_ENABLED: "true",
        KVISA_ASSISTANT_LAUNCH_URL: "javascript:alert(1)",
      })
    ).toThrow("KVISA_ASSISTANT_LAUNCH_URL must be a valid HTTP(S) URL.");
  });

  it("rejects malformed KVisaAssistant launch token key config", () => {
    expect(() =>
      parseAppEnv({
        ...validEnv,
        KVISA_ASSISTANT_ENABLED: "true",
        KVISA_ASSISTANT_LAUNCH_URL: "http://localhost:3001",
        KVISA_ASSISTANT_LAUNCH_TOKEN_PRIVATE_KEY: "not a pem key",
      })
    ).toThrow(
      "KVisaAssistant launch token private key must be a PKCS#8 PEM private key."
    );

    expect(() =>
      parseAppEnv({
        ...validEnv,
        KVISA_ASSISTANT_LAUNCH_TOKEN_PREVIOUS_PUBLIC_JWKS: "not-json",
      })
    ).toThrow("KVisaAssistant previous public JWKS must be valid JSON.");

    expect(() =>
      parseAppEnv({
        ...validEnv,
        KVISA_ASSISTANT_LAUNCH_TOKEN_PREVIOUS_PUBLIC_JWKS: JSON.stringify({
          keys: [{ kid: "private-key", kty: "RSA", p: "private" }],
        }),
      })
    ).toThrow("Previous public JWKS must not include private key material.");
  });
});

function generatePrivateKeyPem(): string {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  });

  return privateKey.export({ format: "pem", type: "pkcs8" }).toString();
}
