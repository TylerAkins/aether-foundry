import "server-only";

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/lib/db/schema";
import { parseDatabaseEnv } from "@/lib/env/database-schema";

type PostgresClient = ReturnType<typeof postgres>;
type Database = ReturnType<typeof createDatabase>;

declare global {
  var aetherFoundryPostgresClient: PostgresClient | undefined;
  var aetherFoundryDatabase: Database | undefined;
}

function createQueryClient(): PostgresClient {
  const databaseEnv = parseDatabaseEnv(process.env);

  return postgres(databaseEnv.DATABASE_URL, {
    max: 10,
  });
}

function getQueryClient(): PostgresClient {
  const queryClient =
    globalThis.aetherFoundryPostgresClient ?? createQueryClient();

  if (process.env.NODE_ENV !== "production") {
    globalThis.aetherFoundryPostgresClient = queryClient;
  }

  return queryClient;
}

function createDatabase() {
  return drizzle({ client: getQueryClient(), schema });
}

export function getDb(): Database {
  const database = globalThis.aetherFoundryDatabase ?? createDatabase();

  if (process.env.NODE_ENV !== "production") {
    globalThis.aetherFoundryDatabase = database;
  }

  return database;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await getDb().execute(sql`select 1`);

    return true;
  } catch (error) {
    console.error("Database health check failed.", { error });

    return false;
  }
}
