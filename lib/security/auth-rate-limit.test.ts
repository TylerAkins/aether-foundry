import { beforeEach, describe, expect, it } from "vitest";

import { checkAuthRateLimits } from "@/lib/security/auth-rate-limit";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";

describe("auth rate limits", () => {
  beforeEach(() => {
    resetRateLimitsForTests();
  });

  it("allows requests below the preset limit", async () => {
    await expect(
      checkAuthRateLimits("login", ["ip:127.0.0.1"], 0)
    ).resolves.toEqual({ allowed: true });
  });

  it("blocks repeated attempts within the window", async () => {
    for (let index = 0; index < 10; index += 1) {
      await checkAuthRateLimits("login", ["ip:127.0.0.1"], 0);
    }

    await expect(
      checkAuthRateLimits("login", ["ip:127.0.0.1"], 0)
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: 900 });
  });

  it("checks every supplied auth bucket", async () => {
    for (let index = 0; index < 10; index += 1) {
      await checkAuthRateLimits("login", ["email:a@example.com"], 0);
    }

    await expect(
      checkAuthRateLimits("login", ["ip:127.0.0.1", "email:a@example.com"], 0)
    ).resolves.toEqual({ allowed: false, retryAfterSeconds: 900 });
  });
});
