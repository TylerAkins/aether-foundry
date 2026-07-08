import { describe, expect, it } from "vitest";

import { parseDatabaseEnv } from "@/lib/env/database-schema";

describe("parseDatabaseEnv", () => {
  it("fails clearly when DATABASE_URL is missing", () => {
    expect(() => parseDatabaseEnv({})).toThrow("DATABASE_URL is required.");
  });

  it("fails clearly when DATABASE_URL is empty", () => {
    expect(() => parseDatabaseEnv({ DATABASE_URL: "   " })).toThrow(
      "DATABASE_URL is required."
    );
  });

  it("fails clearly when DATABASE_URL is not a valid URL", () => {
    expect(() => parseDatabaseEnv({ DATABASE_URL: "not-a-url" })).toThrow(
      "DATABASE_URL must be a valid URL."
    );
  });

  it("fails clearly when DATABASE_URL is not PostgreSQL", () => {
    expect(() =>
      parseDatabaseEnv({
        DATABASE_URL: "mysql://user:password@localhost:3306/aether_foundry",
      })
    ).toThrow(
      "DATABASE_URL must use the postgres:// or postgresql:// protocol."
    );
  });

  it("returns a trimmed PostgreSQL connection URL", () => {
    expect(
      parseDatabaseEnv({
        DATABASE_URL:
          "  postgresql://aether_foundry:password@localhost:5432/aether_foundry  ",
      })
    ).toEqual({
      DATABASE_URL:
        "postgresql://aether_foundry:password@localhost:5432/aether_foundry",
    });
  });
});
