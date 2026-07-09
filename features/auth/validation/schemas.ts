import { z } from "zod";

import {
  employeeGlobalRoles,
  employeeStatuses,
} from "@/lib/db/schema";
import {
  productKeys,
  productRolesByProduct,
  type ProductKey,
} from "@/lib/products/definitions";

const email = z.string().trim().email("Enter a valid company email.").toLowerCase();
const requiredText = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required.`);
const formBoolean = z.preprocess(
  (value) => value === true || value === "true" || value === "on",
  z.boolean()
);
const password = z
  .string()
  .min(12, "Password must be at least 12 characters.")
  .max(256, "Password is too long.");
const githubUrl = z
  .string()
  .trim()
  .url("Enter a valid GitHub URL.")
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.hostname === "github.com" || url.hostname.endsWith(".github.com")
      );
    } catch {
      return false;
    }
  }, "Enter a valid GitHub URL.");

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
  companyEmail: email,
  personalEmail: z.string().trim().email("Enter a valid personal email.").toLowerCase(),
  firstName: requiredText("First name"),
  middleName: z.string().trim().optional(),
  lastName: requiredText("Last name"),
  phone: requiredText("Phone"),
  githubUrl,
  password,
  globalRole: z.enum(employeeGlobalRoles).default("employee"),
  status: z.enum(employeeStatuses).default("pending"),
  verified: z.boolean().default(false),
});

export const updateEmployeeStatusSchema = z.object({
  status: z.enum(employeeStatuses),
});

export const productAccessSchema = z
  .object({
    employeeAccountId: z.string().uuid("Employee account ID is invalid."),
    productKey: z.enum(productKeys),
    productRole: z.string().trim().min(1, "Product role is required."),
    launchAccessEnabled: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    const productRoles = productRolesByProduct[value.productKey as ProductKey];

    if (!(productRoles as readonly string[]).includes(value.productRole)) {
      context.addIssue({
        code: "custom",
        path: ["productRole"],
      message: "Product role is invalid for this product.",
      });
    }
  });

export const adminCreateEmployeeSchema = z.object({
  companyEmail: email,
  personalEmail: z.string().trim().email("Enter a valid personal email.").toLowerCase(),
  firstName: requiredText("First name"),
  middleName: z.string().trim().optional(),
  lastName: requiredText("Last name"),
  phone: requiredText("Phone"),
  githubUrl,
  globalRole: z.enum(employeeGlobalRoles).default("employee"),
  status: z.enum(employeeStatuses).default("pending"),
});

export const adminUpdateEmployeeIdentitySchema = z.object({
  employeeAccountId: z.string().uuid("Employee account ID is invalid."),
  companyEmail: email,
  personalEmail: z.string().trim().email("Enter a valid personal email.").toLowerCase(),
  firstName: requiredText("First name"),
  middleName: z.string().trim().optional(),
  lastName: requiredText("Last name"),
  phone: requiredText("Phone"),
  githubUrl,
});

export const selfUpdateEmployeeProfileSchema = z.object({
  personalEmail: z.string().trim().email("Enter a valid personal email.").toLowerCase(),
  phone: requiredText("Phone"),
  githubUrl,
});

export const adminUpdateEmployeeRoleStatusSchema = z.object({
  employeeAccountId: z.string().uuid("Employee account ID is invalid."),
  globalRole: z.enum(employeeGlobalRoles),
  status: z.enum(employeeStatuses),
  confirmation: z.string().trim().optional(),
});

export const adminUpdateProductAccessSchema = z
  .object({
    employeeAccountId: z.string().uuid("Employee account ID is invalid."),
    productKey: z.enum(productKeys),
    productRole: z.string().trim().min(1, "Product role is required."),
    launchAccessEnabled: formBoolean.default(false),
    confirmation: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    const productRoles = productRolesByProduct[value.productKey as ProductKey];

    if (!(productRoles as readonly string[]).includes(value.productRole)) {
      context.addIssue({
        code: "custom",
        path: ["productRole"],
        message: "Product role is invalid for this product.",
      });
    }
  });
