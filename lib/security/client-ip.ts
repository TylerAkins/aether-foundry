import "server-only";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { appEnv } from "@/lib/env/app";

function hashFallback(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 32);
}

function firstForwardedIp(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const numbers = parts.map((part) => Number(part));

  if (
    numbers.some(
      (part) => !Number.isInteger(part) || part < 0 || part > 255
    )
  ) {
    return null;
  }

  return numbers.reduce((accumulator, part) => accumulator * 256 + part, 0);
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, prefixText = "32"] = cidr.split("/");
  const ipNumber = ipv4ToNumber(ip);
  const rangeNumber = range ? ipv4ToNumber(range) : null;
  const prefix = Number(prefixText);

  if (
    ipNumber === null ||
    rangeNumber === null ||
    !Number.isInteger(prefix) ||
    prefix < 0 ||
    prefix > 32
  ) {
    return false;
  }

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

  return (ipNumber & mask) === (rangeNumber & mask);
}

function isTrustedProxy(peerIp: string | null): boolean {
  if (!peerIp) {
    return false;
  }

  return appEnv.TRUSTED_PROXY_CIDRS.some((cidr) => isIpInCidr(peerIp, cidr));
}

export async function getAuthClientIp(): Promise<string> {
  if (appEnv.APP_ENV === "local" || appEnv.APP_ENV === "test") {
    return "local";
  }

  const headerStore = await headers();
  const directPeer = headerStore.get("x-connecting-peer");
  const forwardedIp = firstForwardedIp(headerStore.get("x-forwarded-for"));
  const realIp = headerStore.get("x-real-ip");

  if (appEnv.TRUST_PROXY_HEADERS && isTrustedProxy(directPeer)) {
    return forwardedIp ?? realIp ?? hashFallback(directPeer ?? "unknown");
  }

  return hashFallback(directPeer ?? headerStore.get("user-agent") ?? "unknown");
}
