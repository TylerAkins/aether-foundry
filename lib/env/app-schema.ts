import { z } from "zod";

const appEnvValues = ["local", "production", "test"] as const;

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));
const envBoolean = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true");

const appEnvSchema = z.object({
  APP_ENV: z.enum(appEnvValues).default("local"),
  APP_URL: z.string().trim().url("APP_URL must be a valid URL."),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters."),
  ENCRYPTION_KEY: z
    .string()
    .min(32, "ENCRYPTION_KEY must be at least 32 characters."),
  RESEND_API_KEY: optionalTrimmedString,
  AUTH_EMAIL_FROM: z
    .string()
    .trim()
    .min(3, "AUTH_EMAIL_FROM is required."),
  REDIS_URL: optionalTrimmedString.refine(
    (value) => !value || value.startsWith("redis://") || value.startsWith("rediss://"),
    "REDIS_URL must use redis:// or rediss://."
  ),
  TRUST_PROXY_HEADERS: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  TRUSTED_PROXY_CIDRS: optionalTrimmedString.transform((value) =>
    value ? value.split(",").map((entry) => entry.trim()).filter(Boolean) : []
  ),
  KVISA_ASSISTANT_ENABLED: envBoolean,
  KVISA_ASSISTANT_LAUNCH_URL: optionalTrimmedString.refine(
    (value) => {
      if (!value) {
        return true;
      }

      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    "KVISA_ASSISTANT_LAUNCH_URL must be a valid HTTP(S) URL."
  ),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export function parseAppEnv(env: Record<string, string | undefined>): AppEnv {
  const parsed = appEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "App env is invalid.");
  }

  if (parsed.data.APP_ENV === "production" && !parsed.data.REDIS_URL) {
    throw new Error("REDIS_URL is required when APP_ENV=production.");
  }

  if (parsed.data.APP_ENV === "production" && !parsed.data.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required when APP_ENV=production.");
  }

  if (
    parsed.data.KVISA_ASSISTANT_ENABLED &&
    !parsed.data.KVISA_ASSISTANT_LAUNCH_URL
  ) {
    throw new Error(
      "KVISA_ASSISTANT_LAUNCH_URL is required when KVISA_ASSISTANT_ENABLED=true."
    );
  }

  return parsed.data;
}

export function isProductionEnv(appEnv: AppEnv["APP_ENV"]): boolean {
  return appEnv === "production";
}
