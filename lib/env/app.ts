import "server-only";

import { isProductionEnv, parseAppEnv } from "@/lib/env/app-schema";
import type { AppEnv } from "@/lib/env/app-schema";

export const appEnv = parseAppEnv(process.env);
export { isProductionEnv, type AppEnv };
