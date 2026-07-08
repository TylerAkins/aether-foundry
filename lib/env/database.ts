import "server-only";

import { parseDatabaseEnv } from "@/lib/env/database-schema";

export const databaseEnv = parseDatabaseEnv(process.env);
