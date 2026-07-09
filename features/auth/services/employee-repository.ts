import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { hashToken } from "@/lib/auth/tokens";
import { getDb } from "@/lib/db";
import {
  emailVerificationTokens,
  employeeAccounts,
  passwordResetTokens,
  recoveryCodes,
} from "@/lib/db/schema";

export type EmployeeAccount = typeof employeeAccounts.$inferSelect;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findEmployeeByEmail(
  email: string
): Promise<EmployeeAccount | null> {
  const [employee] = await getDb()
    .select()
    .from(employeeAccounts)
    .where(eq(employeeAccounts.email, normalizeEmail(email)))
    .limit(1);

  return employee ?? null;
}

export async function findEmployeeById(
  employeeAccountId: string
): Promise<EmployeeAccount | null> {
  const [employee] = await getDb()
    .select()
    .from(employeeAccounts)
    .where(eq(employeeAccounts.id, employeeAccountId))
    .limit(1);

  return employee ?? null;
}

export function canEmployeeSignIn(employee: EmployeeAccount): boolean {
  return employee.status === "active" && Boolean(employee.emailVerifiedAt);
}

export async function createEmployeeAccount(input: {
  email: string;
  passwordHash: string;
  role: string;
  status: string;
  verified: boolean;
}): Promise<EmployeeAccount> {
  const [employee] = await getDb()
    .insert(employeeAccounts)
    .values({
      email: normalizeEmail(input.email),
      passwordHash: input.passwordHash,
      role: input.role,
      status: input.status,
      emailVerifiedAt: input.verified ? new Date() : null,
    })
    .returning();

  if (!employee) {
    throw new Error("Failed to create employee account.");
  }

  return employee;
}

export async function createEmailVerificationToken(input: {
  employeeAccountId: string;
  token: string;
  expiresAt: Date;
}): Promise<void> {
  await getDb()
    .delete(emailVerificationTokens)
    .where(
      eq(emailVerificationTokens.employeeAccountId, input.employeeAccountId)
    );
  await getDb().insert(emailVerificationTokens).values({
    employeeAccountId: input.employeeAccountId,
    tokenHash: hashToken(input.token),
    expiresAt: input.expiresAt,
  });
}

export async function consumeEmailVerificationToken(
  token: string
): Promise<EmployeeAccount | null> {
  const tokenHash = hashToken(token);
  const [row] = await getDb()
    .select({
      id: emailVerificationTokens.id,
      expiresAt: emailVerificationTokens.expiresAt,
      employeeAccountId: emailVerificationTokens.employeeAccountId,
    })
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.expiresAt <= new Date()) {
    if (row) {
      await getDb()
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.id, row.id));
    }

    return null;
  }

  await getDb()
    .delete(emailVerificationTokens)
    .where(eq(emailVerificationTokens.id, row.id));

  const [employee] = await getDb()
    .update(employeeAccounts)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(employeeAccounts.id, row.employeeAccountId))
    .returning();

  return employee ?? null;
}

export async function createPasswordResetToken(input: {
  employeeAccountId: string;
  token: string;
  expiresAt: Date;
}): Promise<void> {
  await getDb()
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.employeeAccountId, input.employeeAccountId));
  await getDb().insert(passwordResetTokens).values({
    employeeAccountId: input.employeeAccountId,
    tokenHash: hashToken(input.token),
    expiresAt: input.expiresAt,
  });
}

export async function consumePasswordResetToken(
  token: string
): Promise<EmployeeAccount | null> {
  const tokenHash = hashToken(token);
  const [row] = await getDb()
    .select({
      id: passwordResetTokens.id,
      expiresAt: passwordResetTokens.expiresAt,
      employeeAccountId: passwordResetTokens.employeeAccountId,
    })
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenHash, tokenHash))
    .limit(1);

  if (!row || row.expiresAt <= new Date()) {
    if (row) {
      await getDb()
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.id, row.id));
    }

    return null;
  }

  await getDb()
    .delete(passwordResetTokens)
    .where(eq(passwordResetTokens.id, row.id));

  return findEmployeeById(row.employeeAccountId);
}

export async function updateEmployeePassword(input: {
  employeeAccountId: string;
  passwordHash: string;
}): Promise<void> {
  await getDb()
    .update(employeeAccounts)
    .set({ passwordHash: input.passwordHash, updatedAt: new Date() })
    .where(eq(employeeAccounts.id, input.employeeAccountId));
}

export async function markRecoveryCodeUsed(id: string): Promise<boolean> {
  const [row] = await getDb()
    .update(recoveryCodes)
    .set({ usedAt: new Date() })
    .where(and(eq(recoveryCodes.id, id), isNull(recoveryCodes.usedAt)))
    .returning();

  return Boolean(row);
}
