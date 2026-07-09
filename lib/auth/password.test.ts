import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  hashPassword,
  verifyLoginPassword,
  verifyPassword,
} from "@/lib/auth/password";

describe("auth password helpers", () => {
  it("hashes and verifies passwords with Argon2id", async () => {
    const passwordHash = await hashPassword("correct horse battery staple");

    expect(passwordHash).toContain("$argon2id$");
    await expect(
      verifyPassword(passwordHash, "correct horse battery staple")
    ).resolves.toBe(true);
    await expect(verifyPassword(passwordHash, "wrong password")).resolves.toBe(
      false
    );
  });

  it("performs dummy verification for missing accounts", async () => {
    await expect(
      verifyLoginPassword(null, "correct horse battery staple")
    ).resolves.toBe(false);
  });
});
