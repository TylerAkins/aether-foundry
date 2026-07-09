import { generateKeyPairSync } from "node:crypto";

import { createLocalJWKSet, jwtVerify, type JWTPayload } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/env/app", () => ({
  appEnv: {
    APP_URL: "https://aether.example",
    KVISA_ASSISTANT_LAUNCH_TOKEN_PRIVATE_KEY: undefined,
    KVISA_ASSISTANT_LAUNCH_TOKEN_KEY_ID: undefined,
    KVISA_ASSISTANT_LAUNCH_TOKEN_PREVIOUS_PUBLIC_JWKS: undefined,
  },
}));

import {
  appendKVisaLaunchToken,
  getKVisaAssistantLaunchTokenJwks,
  KVISA_LAUNCH_TOKEN_AUDIENCE,
  KVISA_LAUNCH_TOKEN_CLOCK_SKEW_SECONDS,
  KVISA_LAUNCH_TOKEN_CONTRACT_VERSION,
  signKVisaAssistantLaunchToken,
  type KVisaLaunchTokenClaims,
  type KVisaLaunchTokenInput,
} from "@/lib/products/kvisa-launch-token";

const issuer = "https://aether.example";
const keyId = "kvisa-test-key-1";
const privateKeyPem = generatePrivateKeyPem();
const input: KVisaLaunchTokenInput = {
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
};

describe("KVisaAssistant launch tokens", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("signs a versioned token that verifies through the exported JWKS", async () => {
    const issuedAt = new Date("2026-01-01T00:00:00.000Z");
    const token = await signKVisaAssistantLaunchToken(input, {
      issuer,
      keyId,
      privateKeyPem,
      issuedAt,
      jwtId: "launch-token-1",
    });
    const jwks = await getKVisaAssistantLaunchTokenJwks({
      keyId,
      privateKeyPem,
    });
    const result = await jwtVerify<KVisaLaunchTokenClaims>(
      token,
      createLocalJWKSet(jwks),
      {
        algorithms: ["RS256"],
        audience: KVISA_LAUNCH_TOKEN_AUDIENCE,
        issuer,
        currentDate: new Date("2026-01-01T00:01:00.000Z"),
      }
    );

    expect(result.protectedHeader).toEqual(
      expect.objectContaining({ alg: "RS256", kid: keyId, typ: "JWT" })
    );
    expect(result.payload).toEqual(
      expect.objectContaining({
        iss: issuer,
        aud: KVISA_LAUNCH_TOKEN_AUDIENCE,
        sub: "employee-1",
        iat: 1767225600,
        exp: 1767225720,
        jti: "launch-token-1",
        contractVersion: KVISA_LAUNCH_TOKEN_CONTRACT_VERSION,
        employee: input.employee,
        productKey: "kvisa_assistant",
        productRole: "reviewer",
      })
    );
  });

  it("rejects modified, expired, wrong-audience, unknown-key, and replayed tokens", async () => {
    const jwks = await getKVisaAssistantLaunchTokenJwks({
      keyId,
      privateKeyPem,
    });
    const validToken = await signKVisaAssistantLaunchToken(input, {
      issuer,
      keyId,
      privateKeyPem,
      jwtId: "launch-token-2",
    });
    const tamperedToken = tamperTokenSignature(validToken);
    const expiredToken = await signKVisaAssistantLaunchToken(input, {
      issuer,
      keyId,
      privateKeyPem,
      issuedAt: new Date("2026-01-01T00:00:00.000Z"),
      jwtId: "launch-token-expired",
    });
    const unknownKeyToken = await signKVisaAssistantLaunchToken(input, {
      issuer,
      keyId: "unknown-key",
      privateKeyPem,
      jwtId: "launch-token-unknown-key",
    });
    const replayCache = new Set<string>();

    await expect(verifyConsumerLaunchToken(tamperedToken, jwks)).rejects.toThrow();
    await expect(
      verifyConsumerLaunchToken(expiredToken, jwks, {
        currentDate: new Date("2026-01-01T00:03:00.000Z"),
      })
    ).rejects.toThrow();
    await expect(
      verifyConsumerLaunchToken(validToken, jwks, { audience: "wrong_audience" })
    ).rejects.toThrow();
    await expect(verifyConsumerLaunchToken(unknownKeyToken, jwks)).rejects.toThrow();
    await expect(
      verifyConsumerLaunchToken(validToken, jwks, { replayCache })
    ).resolves.toEqual(expect.objectContaining({ jti: "launch-token-2" }));
    await expect(
      verifyConsumerLaunchToken(validToken, jwks, { replayCache })
    ).rejects.toThrow("Launch token has already been used.");
  });

  it("returns only public keys from the JWKS, including previous public keys", async () => {
    const jwks = await getKVisaAssistantLaunchTokenJwks({
      keyId,
      privateKeyPem,
      previousPublicJwks: {
        keys: [{ kty: "RSA", kid: "previous-key", n: "abc", e: "AQAB" }],
      },
    });

    expect(jwks.keys).toHaveLength(2);
    expect(jwks.keys[0]).toEqual(
      expect.objectContaining({ alg: "RS256", kid: keyId, kty: "RSA", use: "sig" })
    );
    expect(jwks.keys[0]).not.toHaveProperty("d");
    expect(jwks.keys[1]).toEqual(
      expect.objectContaining({ kid: "previous-key" })
    );
  });

  it("appends launch tokens without dropping existing product query params", () => {
    expect(
      appendKVisaLaunchToken("http://localhost:3001/start?source=portal", "token-1")
    ).toBe("http://localhost:3001/start?source=portal&launch_token=token-1");
  });
});

async function verifyConsumerLaunchToken(
  token: string,
  jwks: { keys: JsonWebKey[] },
  options: {
    audience?: string;
    currentDate?: Date;
    replayCache?: Set<string>;
  } = {}
): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, createLocalJWKSet(jwks), {
    algorithms: ["RS256"],
    audience: options.audience ?? KVISA_LAUNCH_TOKEN_AUDIENCE,
    issuer,
    clockTolerance: KVISA_LAUNCH_TOKEN_CLOCK_SKEW_SECONDS,
    currentDate: options.currentDate,
  });

  if (payload.contractVersion !== KVISA_LAUNCH_TOKEN_CONTRACT_VERSION) {
    throw new Error("Unsupported launch token contract version.");
  }

  if (!payload.jti) {
    throw new Error("Launch token is missing jti.");
  }

  if (options.replayCache?.has(payload.jti)) {
    throw new Error("Launch token has already been used.");
  }

  options.replayCache?.add(payload.jti);

  return payload;
}

function generatePrivateKeyPem(): string {
  const { privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 0x10001,
  });

  return privateKey.export({ format: "pem", type: "pkcs8" }).toString();
}

function tamperTokenSignature(token: string): string {
  const segments = token.split(".");
  const signature = segments[2] ?? "";
  const replacement = signature.endsWith("a") ? "b" : "a";

  return `${segments[0]}.${segments[1]}.${signature.slice(0, -1)}${replacement}`;
}
