import "server-only";

import { createPrivateKey, createPublicKey, randomUUID } from "node:crypto";

import { exportJWK, SignJWT, type JWK, type JWTPayload } from "jose";

import { appEnv } from "@/lib/env/app";
import type { ProductKey, ProductRole } from "@/lib/products/definitions";

export const KVISA_LAUNCH_TOKEN_ALGORITHM = "RS256";
export const KVISA_LAUNCH_TOKEN_AUDIENCE = "kvisa_assistant";
export const KVISA_LAUNCH_TOKEN_CONTRACT_VERSION = "kvisa_launch_v1";
export const KVISA_LAUNCH_TOKEN_LIFETIME_SECONDS = 120;
export const KVISA_LAUNCH_TOKEN_CLOCK_SKEW_SECONDS = 30;

export type KVisaLaunchTokenEmployee = {
  id: string;
  companyEmail: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  globalRole: string;
};

export type KVisaLaunchTokenClaims = JWTPayload & {
  contractVersion: typeof KVISA_LAUNCH_TOKEN_CONTRACT_VERSION;
  employee: KVisaLaunchTokenEmployee;
  productKey: ProductKey;
  productRole: ProductRole;
};

export type KVisaLaunchTokenInput = {
  employee: KVisaLaunchTokenEmployee;
  productKey: ProductKey;
  productRole: ProductRole;
};

type LaunchTokenConfig = {
  issuer: string;
  keyId: string;
  privateKeyPem: string;
  previousPublicJwks?: { keys: JWK[] };
};

type LaunchTokenOptions = Partial<LaunchTokenConfig> & {
  issuedAt?: Date;
  jwtId?: string;
};

export async function signKVisaAssistantLaunchToken(
  input: KVisaLaunchTokenInput,
  options: LaunchTokenOptions = {}
): Promise<string> {
  const config = getLaunchTokenConfig(options);
  const issuedAt = options.issuedAt ?? new Date();
  const expiresAt = new Date(
    issuedAt.getTime() + KVISA_LAUNCH_TOKEN_LIFETIME_SECONDS * 1000
  );
  const privateKey = createPrivateKey(normalizePem(config.privateKeyPem));

  return new SignJWT({
    contractVersion: KVISA_LAUNCH_TOKEN_CONTRACT_VERSION,
    employee: input.employee,
    productKey: input.productKey,
    productRole: input.productRole,
  })
    .setProtectedHeader({
      alg: KVISA_LAUNCH_TOKEN_ALGORITHM,
      kid: config.keyId,
      typ: "JWT",
    })
    .setIssuer(config.issuer)
    .setAudience(KVISA_LAUNCH_TOKEN_AUDIENCE)
    .setSubject(input.employee.id)
    .setIssuedAt(issuedAt)
    .setExpirationTime(expiresAt)
    .setJti(options.jwtId ?? randomUUID())
    .sign(privateKey);
}

export async function getKVisaAssistantLaunchTokenJwks(
  options: Partial<LaunchTokenConfig> = {}
): Promise<{ keys: JWK[] }> {
  const config = getLaunchTokenConfig(options);
  const privateKey = createPrivateKey(normalizePem(config.privateKeyPem));
  const activePublicKey = createPublicKey(privateKey);
  const activeJwk = await exportJWK(activePublicKey);
  const previousKeys = config.previousPublicJwks?.keys ?? [];

  return {
    keys: [
      {
        ...activeJwk,
        alg: KVISA_LAUNCH_TOKEN_ALGORITHM,
        kid: config.keyId,
        use: "sig",
      },
      ...previousKeys,
    ],
  };
}

export function appendKVisaLaunchToken(
  launchUrl: string,
  launchToken: string
): string {
  const url = new URL(launchUrl);
  url.searchParams.set("launch_token", launchToken);
  return url.toString();
}

function getLaunchTokenConfig(
  overrides: Partial<LaunchTokenConfig>
): LaunchTokenConfig {
  const issuer = overrides.issuer ?? appEnv.APP_URL;
  const keyId = overrides.keyId ?? appEnv.KVISA_ASSISTANT_LAUNCH_TOKEN_KEY_ID;
  const privateKeyPem =
    overrides.privateKeyPem ?? appEnv.KVISA_ASSISTANT_LAUNCH_TOKEN_PRIVATE_KEY;
  const previousPublicJwks =
    overrides.previousPublicJwks ??
    appEnv.KVISA_ASSISTANT_LAUNCH_TOKEN_PREVIOUS_PUBLIC_JWKS;

  if (!keyId) {
    throw new Error("KVisaAssistant launch token key id is not configured.");
  }

  if (!privateKeyPem) {
    throw new Error("KVisaAssistant launch token private key is not configured.");
  }

  return { issuer, keyId, privateKeyPem, previousPublicJwks };
}

function normalizePem(value: string): string {
  return value.replaceAll("\\n", "\n").trim();
}
