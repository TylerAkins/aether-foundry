import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { generateSecret, generateURI, verify } from "otplib";

import { RECOVERY_CODE_COUNT } from "@/lib/auth/constants";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { appEnv } from "@/lib/env/app";

const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function encryptionKey(): Buffer {
  return createHash("sha256").update(appEnv.ENCRYPTION_KEY).digest();
}

export function generateTotpSecret(): string {
  return generateSecret();
}

export function generateTotpUri(email: string, secret: string): string {
  return generateURI({
    issuer: "Aether Foundry",
    label: email,
    secret,
    period: 30,
  });
}

export async function verifyTotpCode(
  secret: string,
  code: string
): Promise<boolean> {
  const result = await verify({ secret, token: code, epochTolerance: 30 });

  return result.valid;
}

export function encryptTotpSecret(secret: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

export function decryptTotpSecret(encryptedSecret: string): string {
  const payload = Buffer.from(encryptedSecret, "base64url");
  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, encryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function generateRecoveryCodes(): string[] {
  return Array.from({ length: RECOVERY_CODE_COUNT }, () =>
    randomBytes(8).toString("hex")
  );
}

export async function hashRecoveryCode(code: string): Promise<string> {
  return hashPassword(code);
}

export async function verifyRecoveryCode(
  codeHash: string,
  code: string
): Promise<boolean> {
  return verifyPassword(codeHash, code);
}
