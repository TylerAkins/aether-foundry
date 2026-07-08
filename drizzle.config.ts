import { defineConfig } from "drizzle-kit";

import { parseDatabaseEnv } from "@/lib/env/database-schema";

const databaseEnv = parseDatabaseEnv(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseEnv.DATABASE_URL,
  },
});
