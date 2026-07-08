import { z } from "zod";

const databaseEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .trim()
    .min(1, "DATABASE_URL is required.")
    .url("DATABASE_URL must be a valid URL.")
    .refine(
      (value) => {
        let protocol: string;

        try {
          protocol = new URL(value).protocol;
        } catch {
          return false;
        }

        return protocol === "postgres:" || protocol === "postgresql:";
      },
      {
        message:
          "DATABASE_URL must use the postgres:// or postgresql:// protocol.",
      }
    ),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function parseDatabaseEnv(
  env: Record<string, string | undefined>
): DatabaseEnv {
  if (!env.DATABASE_URL?.trim()) {
    throw new Error("DATABASE_URL is required.");
  }

  const parsed = databaseEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "DATABASE_URL is invalid.");
  }

  return parsed.data;
}
