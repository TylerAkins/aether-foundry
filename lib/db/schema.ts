import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const employeeRoles = ["owner", "system_admin", "employee"] as const;
export const employeeStatuses = ["active", "disabled"] as const;

export type EmployeeRole = (typeof employeeRoles)[number];
export type EmployeeStatus = (typeof employeeStatuses)[number];

export const employeeAccounts = pgTable(
  "employee_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: text("role").notNull().default("employee"),
    status: text("status").notNull().default("active"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("employee_accounts_email_idx").on(table.email)]
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
