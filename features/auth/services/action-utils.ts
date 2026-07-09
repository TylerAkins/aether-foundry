import type { ZodError } from "zod";

import type { ActionResult } from "@/features/auth/types";

export function formatZodErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issue.path[0];

    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export function rateLimitError(retryAfterSeconds: number): ActionResult {
  return {
    success: false,
    error: `Too many attempts. Try again in ${retryAfterSeconds} seconds.`,
  };
}

export function isHoneypotFilled(input: Record<string, FormDataEntryValue | null>): boolean {
  return typeof input.companyWebsite === "string" && input.companyWebsite.trim() !== "";
}
