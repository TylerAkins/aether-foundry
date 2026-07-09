import "server-only";

import { eq, lt, sql } from "drizzle-orm";

import { PENDING_LOGIN_TTL_MS } from "@/lib/auth/constants";
import { getDb } from "@/lib/db";
import { pendingLogins } from "@/lib/db/schema";

export type PendingLogin = typeof pendingLogins.$inferSelect;

export async function purgeExpiredPendingLogins(): Promise<void> {
  await getDb().delete(pendingLogins).where(lt(pendingLogins.expiresAt, new Date()));
}

export async function createPendingLogin(
  employeeAccountId: string
): Promise<PendingLogin> {
  await purgeExpiredPendingLogins();

  const expiresAt = new Date(Date.now() + PENDING_LOGIN_TTL_MS);
  const [pendingLogin] = await getDb()
    .insert(pendingLogins)
    .values({ employeeAccountId, expiresAt })
    .returning();

  if (!pendingLogin) {
    throw new Error("Failed to create pending login.");
  }

  return pendingLogin;
}

export async function getPendingLogin(
  pendingLoginId: string
): Promise<PendingLogin | null> {
  await purgeExpiredPendingLogins();

  const [pendingLogin] = await getDb()
    .select()
    .from(pendingLogins)
    .where(eq(pendingLogins.id, pendingLoginId))
    .limit(1);

  if (!pendingLogin || pendingLogin.expiresAt <= new Date()) {
    if (pendingLogin) {
      await deletePendingLogin(pendingLoginId);
    }

    return null;
  }

  return pendingLogin;
}

export async function incrementPendingLoginAttempts(
  pendingLoginId: string
): Promise<number> {
  const [pendingLogin] = await getDb()
    .update(pendingLogins)
    .set({ attemptCount: sql`${pendingLogins.attemptCount} + 1` })
    .where(eq(pendingLogins.id, pendingLoginId))
    .returning();

  return pendingLogin?.attemptCount ?? 0;
}

export async function deletePendingLogin(pendingLoginId: string): Promise<void> {
  await getDb().delete(pendingLogins).where(eq(pendingLogins.id, pendingLoginId));
}
