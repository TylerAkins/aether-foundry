import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkDatabaseHealth } = vi.hoisted(() => ({
  checkDatabaseHealth: vi.fn<() => Promise<boolean>>(),
}));

vi.mock("@/lib/db", () => ({
  checkDatabaseHealth,
}));

describe("GET /api/health/database", () => {
  beforeEach(() => {
    checkDatabaseHealth.mockReset();
  });

  it("returns available when the database check succeeds", async () => {
    checkDatabaseHealth.mockResolvedValue(true);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ status: "available" });
  });

  it("returns a sanitized unavailable response when the database check fails", async () => {
    checkDatabaseHealth.mockResolvedValue(false);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "unavailable" });
  });
});
