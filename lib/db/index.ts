import "server-only";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";
import { databaseEnv } from "@/lib/env/database";

type PostgresClient = ReturnType<typeof postgres>;

declare global {
  var aetherFoundryPostgresClient: PostgresClient | undefined;
}

const queryClient =
  globalThis.aetherFoundryPostgresClient ??
  postgres(databaseEnv.DATABASE_URL, {
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.aetherFoundryPostgresClient = queryClient;
}

export const db = drizzle({ client: queryClient, schema });

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute(sql`select 1`);

    return true;
  } catch (error) {
    console.error("Database health check failed.", { error });

    return false;
  }
}
