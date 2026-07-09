import "server-only";

import { hash, verify } from "@node-rs/argon2";

const ARGON2_OPTIONS = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  algorithm: 2 as const,
};

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=1$h1ZlaVQwRXdvaG1SR2NvSQ$VnTymgRaL25CP99YvRD/2bFJtAsJd6zmG+M2IKtMdC4";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(
  passwordHash: string,
  password: string
): Promise<boolean> {
  try {
    return await verify(passwordHash, password, ARGON2_OPTIONS);
  } catch (error) {
    console.error("Password verification failed.", { error });
    return false;
  }
}

export async function verifyLoginPassword(
  account: { passwordHash: string } | null,
  password: string
): Promise<boolean> {
  const passwordHash = account?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const isValid = await verifyPassword(passwordHash, password);

  return Boolean(account && isValid);
}
