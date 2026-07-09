import "server-only";

import { and, asc, count, eq, isNull, ne } from "drizzle-orm";

import { hashToken } from "@/lib/auth/tokens";
import { getDb } from "@/lib/db";
import {
  emailVerificationTokens,
  employeeAccounts,
  employeeProductAccess,
  passwordResetTokens,
  recoveryCodes,
  type EmployeeGlobalRole,
  type EmployeeStatus,
  type ProductKey,
  type ProductRole,
} from "@/lib/db/schema";

export type EmployeeAccountCredentials = typeof employeeAccounts.$inferSelect;

export type EmployeeIdentity = {
  id: string;
  companyEmail: string;
  personalEmail: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phone: string;
  githubUrl: string;
  globalRole: EmployeeGlobalRole;
  status: EmployeeStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EmployeeActor = Pick<EmployeeIdentity, "id" | "globalRole">;

export type ProductAccess = {
  employeeAccountId: string;
  productKey: ProductKey;
  productRole: ProductRole;
  launchAccessEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type EmployeeWithProductAccess = EmployeeIdentity & {
  productAccess: ProductAccess[];
};

export class DuplicateCompanyEmailError extends Error {
  constructor() {
    super("Company email already belongs to an employee account.");
    this.name = "DuplicateCompanyEmailError";
  }
}

export class LastActiveOwnerError extends Error {
  constructor() {
    super("The last active Owner cannot be demoted, suspended, or terminated.");
    this.name = "LastActiveOwnerError";
  }
}

export class PrivilegeEscalationError extends Error {
  constructor() {
    super("Only Owners can create or change administrator roles.");
    this.name = "PrivilegeEscalationError";
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findEmployeeCredentialsByCompanyEmail(
  email: string
): Promise<EmployeeAccountCredentials | null> {
  const [employee] = await getDb()
    .select()
    .from(employeeAccounts)
    .where(eq(employeeAccounts.companyEmail, normalizeEmail(email)))
    .limit(1);

  return employee ?? null;
}

export async function findEmployeeByEmail(
  email: string
): Promise<EmployeeAccountCredentials | null> {
  return findEmployeeCredentialsByCompanyEmail(email);
}

export async function findEmployeeCredentialsById(
  employeeAccountId: string
): Promise<EmployeeAccountCredentials | null> {
  const [employee] = await getDb()
    .select()
    .from(employeeAccounts)
    .where(eq(employeeAccounts.id, employeeAccountId))
    .limit(1);

  return employee ?? null;
}

async function findEmployeeById(
  employeeAccountId: string
): Promise<EmployeeIdentity | null> {
  const employee = await findEmployeeCredentialsById(employeeAccountId);

  return employee ? toEmployeeIdentity(employee) : null;
}

export async function findOwnEmployeeById(
  employeeAccountId: string
): Promise<EmployeeIdentity | null> {
  return findEmployeeByIdForActor(
    { id: employeeAccountId, globalRole: "employee" },
    employeeAccountId
  );
}

export async function findEmployeeByIdForActor(
  actor: EmployeeActor,
  employeeAccountId: string
): Promise<EmployeeIdentity | null> {
  if (!canReadEmployee(actor, employeeAccountId)) {
    return null;
  }

  return findEmployeeById(employeeAccountId);
}

export function isEmployeeAdministrator(actor: EmployeeActor): boolean {
  return actor.globalRole === "owner" || actor.globalRole === "system_admin";
}

export function canReadEmployee(
  actor: EmployeeActor,
  employeeAccountId: string
): boolean {
  return actor.id === employeeAccountId || isEmployeeAdministrator(actor);
}

export function canManageEmployees(actor: EmployeeActor): boolean {
  return isEmployeeAdministrator(actor);
}

export function canManageAdminRoles(actor: EmployeeActor): boolean {
  return actor.globalRole === "owner";
}

export function canEmployeeSignIn(
  employee: Pick<EmployeeAccountCredentials, "status" | "emailVerifiedAt">
): boolean {
  return employee.status === "active" && Boolean(employee.emailVerifiedAt);
}

export async function createEmployeeAccount(input: {
  companyEmail: string;
  personalEmail: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone: string;
  githubUrl: string;
  passwordHash: string;
  globalRole: EmployeeGlobalRole;
  status: EmployeeStatus;
  verified: boolean;
}): Promise<EmployeeIdentity> {
  try {
    const [employee] = await getDb()
      .insert(employeeAccounts)
      .values({
        companyEmail: normalizeEmail(input.companyEmail),
        personalEmail: normalizeEmail(input.personalEmail),
        firstName: input.firstName.trim(),
        middleName: input.middleName?.trim() || null,
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        githubUrl: input.githubUrl.trim(),
        passwordHash: input.passwordHash,
        globalRole: input.globalRole,
        status: input.status,
        emailVerifiedAt: input.verified ? new Date() : null,
      })
      .returning();

    if (!employee) {
      throw new Error("Failed to create employee account.");
    }

    return toEmployeeIdentity(employee);
  } catch (error) {
    if (isUniqueCompanyEmailError(error)) {
      throw new DuplicateCompanyEmailError();
    }

    throw error;
  }
}

export async function createEmployeeAccountForActor(input: {
  actor: EmployeeActor;
  companyEmail: string;
  personalEmail: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone: string;
  githubUrl: string;
  passwordHash: string;
  globalRole: EmployeeGlobalRole;
  status: EmployeeStatus;
  verified: boolean;
}): Promise<EmployeeIdentity | null> {
  if (!canManageEmployees(input.actor)) {
    return null;
  }

  if (isAdministratorRole(input.globalRole) && !canManageAdminRoles(input.actor)) {
    throw new PrivilegeEscalationError();
  }

  return createEmployeeAccount(input);
}

export async function listEmployeesForActor(
  actor: EmployeeActor
): Promise<EmployeeWithProductAccess[] | null> {
  if (!canManageEmployees(actor)) {
    return null;
  }

  const rows = await getDb()
    .select({
      employee: employeeAccounts,
      access: employeeProductAccess,
    })
    .from(employeeAccounts)
    .leftJoin(
      employeeProductAccess,
      eq(employeeProductAccess.employeeAccountId, employeeAccounts.id)
    )
    .orderBy(asc(employeeAccounts.companyEmail));

  return groupEmployeeProductAccess(rows);
}

export async function findEmployeeDetailForActor(
  actor: EmployeeActor,
  employeeAccountId: string
): Promise<EmployeeWithProductAccess | null> {
  if (!canManageEmployees(actor)) {
    return null;
  }

  const rows = await getDb()
    .select({
      employee: employeeAccounts,
      access: employeeProductAccess,
    })
    .from(employeeAccounts)
    .leftJoin(
      employeeProductAccess,
      eq(employeeProductAccess.employeeAccountId, employeeAccounts.id)
    )
    .where(eq(employeeAccounts.id, employeeAccountId));

  return groupEmployeeProductAccess(rows)[0] ?? null;
}

export async function findOwnEmployeeWithProductAccess(
  employeeAccountId: string
): Promise<EmployeeWithProductAccess | null> {
  const rows = await getDb()
    .select({
      employee: employeeAccounts,
      access: employeeProductAccess,
    })
    .from(employeeAccounts)
    .leftJoin(
      employeeProductAccess,
      eq(employeeProductAccess.employeeAccountId, employeeAccounts.id)
    )
    .where(eq(employeeAccounts.id, employeeAccountId));

  return groupEmployeeProductAccess(rows)[0] ?? null;
}

export async function updateEmployeeIdentityForActor(input: {
  actor: EmployeeActor;
  employeeAccountId: string;
  companyEmail: string;
  personalEmail: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phone: string;
  githubUrl: string;
}): Promise<EmployeeIdentity | null> {
  if (!canManageEmployees(input.actor)) {
    return null;
  }

  try {
    const [employee] = await getDb()
      .update(employeeAccounts)
      .set({
        companyEmail: normalizeEmail(input.companyEmail),
        personalEmail: normalizeEmail(input.personalEmail),
        firstName: input.firstName.trim(),
        middleName: input.middleName?.trim() || null,
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        githubUrl: input.githubUrl.trim(),
        updatedAt: new Date(),
      })
      .where(eq(employeeAccounts.id, input.employeeAccountId))
      .returning();

    return employee ? toEmployeeIdentity(employee) : null;
  } catch (error) {
    if (isUniqueCompanyEmailError(error)) {
      throw new DuplicateCompanyEmailError();
    }

    throw error;
  }
}

export async function updateOwnEmployeeProfile(input: {
  employeeAccountId: string;
  personalEmail: string;
  phone: string;
  githubUrl: string;
}): Promise<EmployeeIdentity | null> {
  const [employee] = await getDb()
    .update(employeeAccounts)
    .set({
      personalEmail: normalizeEmail(input.personalEmail),
      phone: input.phone.trim(),
      githubUrl: input.githubUrl.trim(),
      updatedAt: new Date(),
    })
    .where(eq(employeeAccounts.id, input.employeeAccountId))
    .returning();

  return employee ? toEmployeeIdentity(employee) : null;
}

export async function updateEmployeeRoleStatusForActor(input: {
  actor: EmployeeActor;
  employeeAccountId: string;
  globalRole: EmployeeGlobalRole;
  status: EmployeeStatus;
}): Promise<EmployeeIdentity | null> {
  if (!canManageEmployees(input.actor)) {
    return null;
  }

  const current = await findEmployeeCredentialsById(input.employeeAccountId);

  if (!current) {
    return null;
  }

  if (
    (isAdministratorRole(current.globalRole) ||
      isAdministratorRole(input.globalRole)) &&
    !canManageAdminRoles(input.actor)
  ) {
    throw new PrivilegeEscalationError();
  }

  if (
    current.globalRole === "owner" &&
    current.status === "active" &&
    (input.globalRole !== "owner" || input.status !== "active") &&
    (await countOtherActiveOwners(input.employeeAccountId)) === 0
  ) {
    throw new LastActiveOwnerError();
  }

  const [employee] = await getDb()
    .update(employeeAccounts)
    .set({
      globalRole: input.globalRole,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(employeeAccounts.id, input.employeeAccountId))
    .returning();

  return employee ? toEmployeeIdentity(employee) : null;
}

export async function updateEmployeeStatus(input: {
  actor: EmployeeActor;
  employeeAccountId: string;
  status: EmployeeStatus;
}): Promise<EmployeeIdentity | null> {
  if (!canManageEmployees(input.actor)) {
    return null;
  }

  const current = await findEmployeeCredentialsById(input.employeeAccountId);

  if (!current) {
    return null;
  }

  return updateEmployeeRoleStatusForActor({
    actor: input.actor,
    employeeAccountId: input.employeeAccountId,
    globalRole: current.globalRole,
    status: input.status,
  });
}

export async function assignEmployeeProductAccess(input: {
  actor: EmployeeActor;
  employeeAccountId: string;
  productKey: ProductKey;
  productRole: ProductRole;
  launchAccessEnabled: boolean;
}): Promise<ProductAccess | null> {
  if (!canManageEmployees(input.actor)) {
    return null;
  }

  const [access] = await getDb()
    .insert(employeeProductAccess)
    .values({
      employeeAccountId: input.employeeAccountId,
      productKey: input.productKey,
      productRole: input.productRole,
      launchAccessEnabled: input.launchAccessEnabled,
    })
    .onConflictDoUpdate({
      target: [
        employeeProductAccess.employeeAccountId,
        employeeProductAccess.productKey,
      ],
      set: {
        productRole: input.productRole,
        launchAccessEnabled: input.launchAccessEnabled,
        updatedAt: new Date(),
      },
    })
    .returning();

  return access ? toProductAccess(access) : null;
}

export async function canEmployeeLaunchProduct(input: {
  employeeAccountId: string;
  productKey: ProductKey;
  allowedRoles?: readonly ProductRole[];
}): Promise<boolean> {
  const [row] = await getDb()
    .select({
      status: employeeAccounts.status,
      emailVerifiedAt: employeeAccounts.emailVerifiedAt,
      productRole: employeeProductAccess.productRole,
      launchAccessEnabled: employeeProductAccess.launchAccessEnabled,
    })
    .from(employeeProductAccess)
    .innerJoin(
      employeeAccounts,
      eq(employeeProductAccess.employeeAccountId, employeeAccounts.id)
    )
    .where(
      and(
        eq(employeeProductAccess.employeeAccountId, input.employeeAccountId),
        eq(employeeProductAccess.productKey, input.productKey)
      )
    )
    .limit(1);

  if (!row || !canEmployeeSignIn(row) || !row.launchAccessEnabled) {
    return false;
  }

  return input.allowedRoles
    ? (input.allowedRoles as readonly string[]).includes(row.productRole)
    : true;
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
): Promise<EmployeeAccountCredentials | null> {
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
): Promise<EmployeeAccountCredentials | null> {
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

  return findEmployeeCredentialsById(row.employeeAccountId);
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

function toEmployeeIdentity(employee: EmployeeAccountCredentials): EmployeeIdentity {
  return {
    id: employee.id,
    companyEmail: employee.companyEmail,
    personalEmail: employee.personalEmail,
    firstName: employee.firstName,
    middleName: employee.middleName,
    lastName: employee.lastName,
    phone: employee.phone,
    githubUrl: employee.githubUrl,
    globalRole: employee.globalRole,
    status: employee.status,
    emailVerifiedAt: employee.emailVerifiedAt,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

function toProductAccess(
  access: typeof employeeProductAccess.$inferSelect
): ProductAccess {
  return {
    employeeAccountId: access.employeeAccountId,
    productKey: access.productKey as ProductKey,
    productRole: access.productRole as ProductRole,
    launchAccessEnabled: access.launchAccessEnabled,
    createdAt: access.createdAt,
    updatedAt: access.updatedAt,
  };
}

function groupEmployeeProductAccess(
  rows: {
    employee: EmployeeAccountCredentials;
    access: typeof employeeProductAccess.$inferSelect | null;
  }[]
): EmployeeWithProductAccess[] {
  const employees = new Map<string, EmployeeWithProductAccess>();

  for (const row of rows) {
    const existing =
      employees.get(row.employee.id) ?? {
        ...toEmployeeIdentity(row.employee),
        productAccess: [],
      };

    if (row.access) {
      existing.productAccess.push(toProductAccess(row.access));
    }

    employees.set(row.employee.id, existing);
  }

  return [...employees.values()];
}

async function countOtherActiveOwners(employeeAccountId: string): Promise<number> {
  const [row] = await getDb()
    .select({ value: count() })
    .from(employeeAccounts)
    .where(
      and(
        eq(employeeAccounts.globalRole, "owner"),
        eq(employeeAccounts.status, "active"),
        ne(employeeAccounts.id, employeeAccountId)
      )
    );

  return row?.value ?? 0;
}

function isAdministratorRole(role: EmployeeGlobalRole): boolean {
  return role === "owner" || role === "system_admin";
}

function isUniqueCompanyEmailError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const dbError = error as { code?: string; constraint_name?: string };

  return (
    dbError.code === "23505" &&
    dbError.constraint_name === "employee_accounts_company_email_idx"
  );
}
