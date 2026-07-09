import { describe, expect, it } from "vitest";

import { generateSecureToken, hashToken, safeCompare } from "@/lib/auth/tokens";

describe("auth tokens", () => {
  it("generates unique opaque tokens", () => {
    expect(generateSecureToken()).not.toBe(generateSecureToken());
  });

  it("hashes tokens without preserving plaintext", () => {
    const token = "reset-token";
    const tokenHash = hashToken(token);

    expect(tokenHash).not.toBe(token);
    expect(tokenHash).toHaveLength(64);
  });

  it("compares equal-length values safely", () => {
    expect(safeCompare("abc", "abc")).toBe(true);
    expect(safeCompare("abc", "abd")).toBe(false);
    expect(safeCompare("abc", "abcd")).toBe(false);
  });
});
