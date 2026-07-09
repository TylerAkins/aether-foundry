import { z } from "zod";

const email = z.string().trim().email("Enter a valid company email.").toLowerCase();
const password = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(256, "Password is too long.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
  companyWebsite: z.string().optional(),
});

export const emailSchema = z.object({
  email,
  companyWebsite: z.string().optional(),
});

export const tokenSchema = z.object({
  token: z.string().trim().min(20, "Token is invalid."),
});

export const resetPasswordSchema = tokenSchema.extend({
  password,
});

export const totpCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const recoveryCodeSchema = z.object({
  code: z.string().trim().min(8, "Recovery code is invalid."),
});

export const disableTotpSchema = z.object({
  password: z.string().min(1, "Password is required."),
  code: z.string().trim().optional(),
  recoveryCode: z.string().trim().optional(),
});

export const createEmployeeSchema = z.object({
  email,
  password,
  role: z.enum(["owner", "system_admin", "employee"]).default("employee"),
  status: z.enum(["active", "disabled"]).default("active"),
  verified: z.boolean().default(false),
});
