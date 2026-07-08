import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { checkDatabaseHealth } from "@/lib/db";

describe("checkDatabaseHealth", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns unavailable instead of throwing when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(checkDatabaseHealth()).resolves.toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      "Database health check failed.",
      expect.objectContaining({ error: expect.any(Error) })
    );
  });
});
