import "server-only";

import { eq, lt } from "drizzle-orm";

import { SESSION_TTL_MS } from "@/lib/auth/constants";
import { getDb } from "@/lib/db";
import { employeeAccounts, sessions } from "@/lib/db/schema";

export type SessionEmployee = {
  id: string;
  email: string;
  role: string;
  status: string;
  emailVerifiedAt: Date | null;
};

export type AuthSession = {
  id: string;
  employeeAccountId: string;
  expiresAt: Date;
};

export type SessionResult = {
  employee: SessionEmployee;
  session: AuthSession;
};

export async function purgeExpiredSessions(): Promise<void> {
  await getDb().delete(sessions).where(lt(sessions.expiresAt, new Date()));
}

export async function createSession(employeeAccountId: string): Promise<AuthSession> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const [session] = await getDb()
    .insert(sessions)
    .values({ employeeAccountId, expiresAt })
    .returning();

  if (!session) {
    throw new Error("Failed to create session.");
  }

  return session;
}

export async function getSession(sessionId: string): Promise<SessionResult | null> {
  await purgeExpiredSessions();

  const [row] = await getDb()
    .select({
      sessionId: sessions.id,
      employeeAccountId: sessions.employeeAccountId,
      expiresAt: sessions.expiresAt,
      email: employeeAccounts.email,
      role: employeeAccounts.role,
      status: employeeAccounts.status,
      emailVerifiedAt: employeeAccounts.emailVerifiedAt,
    })
    .from(sessions)
    .innerJoin(
      employeeAccounts,
      eq(sessions.employeeAccountId, employeeAccounts.id)
    )
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!row || row.expiresAt <= new Date()) {
    if (row) {
      await deleteSession(sessionId);
    }

    return null;
  }

  return {
    employee: {
      id: row.employeeAccountId,
      email: row.email,
      role: row.role,
      status: row.status,
      emailVerifiedAt: row.emailVerifiedAt,
    },
    session: {
      id: row.sessionId,
      employeeAccountId: row.employeeAccountId,
      expiresAt: row.expiresAt,
    },
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await getDb().delete(sessions).where(eq(sessions.id, sessionId));
}

export async function deleteEmployeeSessions(employeeAccountId: string): Promise<void> {
  await getDb()
    .delete(sessions)
    .where(eq(sessions.employeeAccountId, employeeAccountId));
}

export async function rotateSession(
  oldSessionId: string | null,
  employeeAccountId: string
): Promise<AuthSession> {
  if (oldSessionId) {
    await deleteSession(oldSessionId);
  }

  return createSession(employeeAccountId);
}

export async function reissueEmployeeSession(
  employeeAccountId: string
): Promise<AuthSession> {
  await deleteEmployeeSessions(employeeAccountId);
  return createSession(employeeAccountId);
}
