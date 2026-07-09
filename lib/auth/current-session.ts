import "server-only";

import { redirect } from "next/navigation";

import {
  clearSessionCookie,
  getSessionIdFromCookies,
} from "@/lib/auth/cookies";
import { getSession, type SessionResult } from "@/lib/auth/session";

export async function getCurrentSession(): Promise<SessionResult | null> {
  const sessionId = await getSessionIdFromCookies();

  if (!sessionId) {
    return null;
  }

  const session = await getSession(sessionId);

  if (!session) {
    await clearSessionCookie();
    return null;
  }

  return session;
}

export async function requireEmployeeSession(): Promise<SessionResult> {
  const session = await getCurrentSession();

  if (
    !session ||
    session.employee.status !== "active" ||
    !session.employee.emailVerifiedAt
  ) {
    redirect("/sign-in");
  }

  return session;
}

export async function requireEmployeeAdminSession(): Promise<SessionResult> {
  const session = await requireEmployeeSession();

  if (
    session.employee.globalRole !== "owner" &&
    session.employee.globalRole !== "system_admin"
  ) {
    redirect("/portal");
  }

  return session;
}

export async function requireOwnerSession(): Promise<SessionResult> {
  const session = await requireEmployeeSession();

  if (session.employee.globalRole !== "owner") {
    redirect("/portal");
  }

  return session;
}
