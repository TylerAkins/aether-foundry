import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import {
  productKeys,
  productRolesByProduct,
  type ProductKey,
  type ProductRole,
} from "@/lib/products/definitions";

export const employeeGlobalRoles = [
  "owner",
  "system_admin",
  "employee",
] as const;
export const employeeStatuses = [
  "pending",
  "active",
  "suspended",
  "terminated",
] as const;
export type EmployeeGlobalRole = (typeof employeeGlobalRoles)[number];
export type EmployeeStatus = (typeof employeeStatuses)[number];
export { productKeys, productRolesByProduct, type ProductKey, type ProductRole };

export const employeeGlobalRoleEnum = pgEnum(
  "employee_global_role",
  employeeGlobalRoles
);
export const employeeStatusEnum = pgEnum("employee_status", employeeStatuses);

export const employeeAccounts = pgTable(
  "employee_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyEmail: text("company_email").notNull(),
    personalEmail: text("personal_email").notNull(),
    firstName: text("first_name").notNull(),
    middleName: text("middle_name"),
    lastName: text("last_name").notNull(),
    phone: text("phone").notNull(),
    githubUrl: text("github_url").notNull(),
    passwordHash: text("password_hash").notNull(),
    globalRole: employeeGlobalRoleEnum("global_role")
      .notNull()
      .default("employee"),
    status: employeeStatusEnum("status").notNull().default("pending"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("employee_accounts_company_email_idx").on(table.companyEmail),
    index("employee_accounts_status_idx").on(table.status),
    index("employee_accounts_global_role_idx").on(table.globalRole),
    check(
      "employee_accounts_company_email_not_blank",
      sql`length(trim(${table.companyEmail})) > 0`
    ),
    check(
      "employee_accounts_personal_email_not_blank",
      sql`length(trim(${table.personalEmail})) > 0`
    ),
    check(
      "employee_accounts_first_name_not_blank",
      sql`length(trim(${table.firstName})) > 0`
    ),
    check(
      "employee_accounts_last_name_not_blank",
      sql`length(trim(${table.lastName})) > 0`
    ),
    check(
      "employee_accounts_phone_not_blank",
      sql`length(trim(${table.phone})) > 0`
    ),
    check(
      "employee_accounts_github_url_not_blank",
      sql`length(trim(${table.githubUrl})) > 0`
    ),
  ]
);

export const employeeProductAccess = pgTable(
  "employee_product_access",
  {
    employeeAccountId: uuid("employee_account_id")
      .notNull()
      .references(() => employeeAccounts.id, { onDelete: "cascade" }),
    productKey: text("product_key").notNull(),
    productRole: text("product_role").notNull(),
    launchAccessEnabled: boolean("launch_access_enabled")
      .notNull()
      .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.employeeAccountId, table.productKey],
      name: "employee_product_access_pk",
    }),
    index("employee_product_access_employee_account_id_idx").on(
      table.employeeAccountId
    ),
    index("employee_product_access_product_key_idx").on(table.productKey),
    check(
      "employee_product_access_product_key_not_blank",
      sql`length(trim(${table.productKey})) > 0`
    ),
    check(
      "employee_product_access_product_role_not_blank",
      sql`length(trim(${table.productRole})) > 0`
    ),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeAccountId: uuid("employee_account_id")
      .notNull()
      .references(() => employeeAccounts.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sessions_employee_account_id_idx").on(table.employeeAccountId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

export const pendingLogins = pgTable(
  "pending_logins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeAccountId: uuid("employee_account_id")
      .notNull()
      .references(() => employeeAccounts.id, { onDelete: "cascade" }),
    attemptCount: integer("attempt_count").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("pending_logins_employee_account_id_idx").on(table.employeeAccountId),
    index("pending_logins_expires_at_idx").on(table.expiresAt),
  ]
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeAccountId: uuid("employee_account_id")
      .notNull()
      .references(() => employeeAccounts.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("email_verification_tokens_employee_account_id_idx").on(
      table.employeeAccountId
    ),
    index("email_verification_tokens_token_hash_idx").on(table.tokenHash),
    index("email_verification_tokens_expires_at_idx").on(table.expiresAt),
  ]
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeAccountId: uuid("employee_account_id")
      .notNull()
      .references(() => employeeAccounts.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("password_reset_tokens_employee_account_id_idx").on(
      table.employeeAccountId
    ),
    index("password_reset_tokens_token_hash_idx").on(table.tokenHash),
    index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
  ]
);

export const totpSettings = pgTable(
  "totp_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeAccountId: uuid("employee_account_id")
      .notNull()
      .references(() => employeeAccounts.id, { onDelete: "cascade" }),
    secretEncrypted: text("secret_encrypted").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("totp_settings_employee_account_id_idx").on(
      table.employeeAccountId
    ),
  ]
);

export const recoveryCodes = pgTable(
  "recovery_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employeeAccountId: uuid("employee_account_id")
      .notNull()
      .references(() => employeeAccounts.id, { onDelete: "cascade" }),
    codeHash: text("code_hash").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("recovery_codes_employee_account_id_idx").on(table.employeeAccountId),
  ]
);
