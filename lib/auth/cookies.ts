import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import {
  PENDING_LOGIN_COOKIE_NAME,
  PRODUCTION_PENDING_LOGIN_COOKIE_NAME,
  PRODUCTION_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
} from "@/lib/auth/constants";
import { appEnv, isProductionEnv } from "@/lib/env/app";

type CookieKind = "session" | "pending";

function sign(value: string): string {
  return createHmac("sha256", appEnv.SESSION_SECRET).update(value).digest("base64url");
}

function signedValue(value: string): string {
  return `${value}.${sign(value)}`;
}

function verifySignedValue(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex === -1) {
    return null;
  }

  const unsigned = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);
  const expected = sign(unsigned);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  return timingSafeEqual(signatureBuffer, expectedBuffer) ? unsigned : null;
}

function cookieNames(kind: CookieKind): { current: string; alternate: string } {
  const production = isProductionEnv(appEnv.APP_ENV);

  if (kind === "session") {
    return production
      ? { current: PRODUCTION_SESSION_COOKIE_NAME, alternate: SESSION_COOKIE_NAME }
      : { current: SESSION_COOKIE_NAME, alternate: PRODUCTION_SESSION_COOKIE_NAME };
  }

  return production
    ? {
        current: PRODUCTION_PENDING_LOGIN_COOKIE_NAME,
        alternate: PENDING_LOGIN_COOKIE_NAME,
      }
    : {
        current: PENDING_LOGIN_COOKIE_NAME,
        alternate: PRODUCTION_PENDING_LOGIN_COOKIE_NAME,
      };
}

async function getSignedCookie(kind: CookieKind): Promise<string | null> {
  const cookieStore = await cookies();
  const names = cookieNames(kind);

  return (
    verifySignedValue(cookieStore.get(names.current)?.value) ??
    verifySignedValue(cookieStore.get(names.alternate)?.value)
  );
}

async function setSignedCookie(kind: CookieKind, value: string): Promise<void> {
  const cookieStore = await cookies();
  const names = cookieNames(kind);
  const production = isProductionEnv(appEnv.APP_ENV);

  cookieStore.set(names.current, signedValue(value), {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  cookieStore.delete(names.alternate);
}

async function clearSignedCookie(kind: CookieKind): Promise<void> {
  const cookieStore = await cookies();
  const names = cookieNames(kind);

  cookieStore.delete(names.current);
  cookieStore.delete(names.alternate);
}

export function verifyCookieValueForTests(value: string): string | null {
  return verifySignedValue(value);
}

export async function getSessionIdFromCookies(): Promise<string | null> {
  return getSignedCookie("session");
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  await setSignedCookie("session", sessionId);
}

export async function clearSessionCookie(): Promise<void> {
  await clearSignedCookie("session");
}

export async function getPendingLoginIdFromCookies(): Promise<string | null> {
  return getSignedCookie("pending");
}

export async function setPendingLoginCookie(pendingLoginId: string): Promise<void> {
  await setSignedCookie("pending", pendingLoginId);
}

export async function clearPendingLoginCookie(): Promise<void> {
  await clearSignedCookie("pending");
}
