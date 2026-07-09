import "server-only";

import { createHash } from "node:crypto";

import { desc } from "drizzle-orm";

import { isEmployeeAdministrator, type EmployeeActor } from "@/features/auth/services/employee-repository";
import { getDb } from "@/lib/db";
import { securityAuditEvents, type EmployeeGlobalRole } from "@/lib/db/schema";

export const AUDIT_RETENTION_YEARS = 3;
export const DEFAULT_AUDIT_PAGE_SIZE = 25;
export const MAX_AUDIT_PAGE_SIZE = 100;

export const privilegedAuditActions = [
  "employee.create",
  "employee.identity.update",
  "employee.role_status.update",
  "employee.product_access.update",
  "employee.totp.admin_reset",
] as const;

export const auditOutcomes = ["success", "denied"] as const;

export type PrivilegedAuditAction = (typeof privilegedAuditActions)[number];
export type AuditOutcome = (typeof auditOutcomes)[number];
export type AuditJson = Record<string, unknown>;
export type AuditRequestContext = {
  clientIp: string;
  userAgentHash: string | null;
};

export type SecurityAuditEvent = {
  id: string;
  actorEmployeeAccountId: string | null;
  actorGlobalRole: EmployeeGlobalRole | null;
  action: PrivilegedAuditAction;
  outcome: AuditOutcome;
  targetEmployeeAccountId: string | null;
  requestContext: AuditJson;
  details: AuditJson;
  previousEventHash: string | null;
  eventHash: string;
  createdAt: Date;
};

export async function recordPrivilegedAuditEvent(input: {
  actor: EmployeeActor | null;
  action: PrivilegedAuditAction;
  outcome: AuditOutcome;
  targetEmployeeAccountId?: string | null;
  requestContext: AuditRequestContext;
  details: AuditJson;
}): Promise<SecurityAuditEvent> {
  const [previousEvent] = await getDb()
    .select({ eventHash: securityAuditEvents.eventHash })
    .from(securityAuditEvents)
    .orderBy(desc(securityAuditEvents.createdAt))
    .limit(1);
  const previousEventHash = previousEvent?.eventHash ?? null;
  const eventHash = hashAuditEvent({
    actorEmployeeAccountId: input.actor?.id ?? null,
    actorGlobalRole: input.actor?.globalRole ?? null,
    action: input.action,
    outcome: input.outcome,
    targetEmployeeAccountId: input.targetEmployeeAccountId ?? null,
    requestContext: input.requestContext,
    details: input.details,
    previousEventHash,
  });

  const [event] = await getDb()
    .insert(securityAuditEvents)
    .values({
      actorEmployeeAccountId: input.actor?.id ?? null,
      actorGlobalRole: input.actor?.globalRole ?? null,
      action: input.action,
      outcome: input.outcome,
      targetEmployeeAccountId: input.targetEmployeeAccountId ?? null,
      requestContext: input.requestContext,
      details: input.details,
      previousEventHash,
      eventHash,
    })
    .returning();

  if (!event) {
    throw new Error("Failed to record privileged audit event.");
  }

  return toSecurityAuditEvent(event);
}

export async function listAuditEventsForActor(
  actor: EmployeeActor,
  options: { page?: number; pageSize?: number }
): Promise<{ events: SecurityAuditEvent[]; page: number; pageSize: number }> {
  if (!isEmployeeAdministrator(actor)) {
    return { events: [], page: 1, pageSize: DEFAULT_AUDIT_PAGE_SIZE };
  }

  const page = normalizePositiveInteger(options.page, 1);
  const pageSize = Math.min(
    normalizePositiveInteger(options.pageSize, DEFAULT_AUDIT_PAGE_SIZE),
    MAX_AUDIT_PAGE_SIZE
  );
  const rows = await getDb()
    .select()
    .from(securityAuditEvents)
    .orderBy(desc(securityAuditEvents.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    events: rows.map(toSecurityAuditEvent),
    page,
    pageSize,
  };
}

export function logDeniedPrivilegedAuditAttempt(input: {
  actor: EmployeeActor;
  action: PrivilegedAuditAction;
  targetEmployeeAccountId?: string | null;
  reason: string;
}): void {
  console.warn("Privileged authorization attempt denied.", {
    action: input.action,
    actorEmployeeAccountId: input.actor.id,
    actorGlobalRole: input.actor.globalRole,
    targetEmployeeAccountId: input.targetEmployeeAccountId ?? null,
    reason: input.reason,
  });
}

function hashAuditEvent(input: {
  actorEmployeeAccountId: string | null;
  actorGlobalRole: EmployeeGlobalRole | null;
  action: PrivilegedAuditAction;
  outcome: AuditOutcome;
  targetEmployeeAccountId: string | null;
  requestContext: AuditJson;
  details: AuditJson;
  previousEventHash: string | null;
}): string {
  return createHash("sha256").update(stableStringify(input)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key] ?? null)}`);

  return `{${entries.join(",")}}`;
}

function normalizePositiveInteger(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : fallback;
}

function toSecurityAuditEvent(
  event: typeof securityAuditEvents.$inferSelect
): SecurityAuditEvent {
  return {
    id: event.id,
    actorEmployeeAccountId: event.actorEmployeeAccountId,
    actorGlobalRole: event.actorGlobalRole,
    action: event.action as PrivilegedAuditAction,
    outcome: event.outcome as AuditOutcome,
    targetEmployeeAccountId: event.targetEmployeeAccountId,
    requestContext: event.requestContext,
    details: event.details,
    previousEventHash: event.previousEventHash,
    eventHash: event.eventHash,
    createdAt: event.createdAt,
  };
}
