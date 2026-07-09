import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getDb: mocks.getDb,
}));

import {
  DEFAULT_AUDIT_PAGE_SIZE,
  MAX_AUDIT_PAGE_SIZE,
  listAuditEventsForActor,
  logDeniedPrivilegedAuditAttempt,
  recordPrivilegedAuditEvent,
} from "@/features/auth/services/audit-events";

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const auditRow = {
  id: "audit-1",
  actorEmployeeAccountId: "owner-1",
  actorGlobalRole: "owner",
  action: "employee.identity.update",
  outcome: "success",
  targetEmployeeAccountId: "employee-1",
  requestContext: { clientIp: "local", userAgentHash: null },
  details: {
    before: { companyEmail: "employee@example.com" },
    after: { companyEmail: "updated@example.com" },
  },
  previousEventHash: "previous-hash",
  eventHash: "event-hash",
  createdAt,
};

describe("audit events", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("records append-only privileged audit events with a hash-chain marker", async () => {
    const latestLimit = vi.fn().mockResolvedValue([{ eventHash: "previous-hash" }]);
    const returning = vi.fn().mockResolvedValue([
      {
        ...auditRow,
        eventHash:
          "8d16da2c3c67b2235022d24c40fcbf7098d3afbf1cce9da54a0e5c72080815b5",
      },
    ]);
    const values = vi.fn(() => ({ returning }));

    mocks.getDb.mockReturnValue({
      select: () => ({
        from: () => ({
          orderBy: () => ({ limit: latestLimit }),
        }),
      }),
      insert: () => ({ values }),
    });

    const event = await recordPrivilegedAuditEvent({
      actor: { id: "owner-1", globalRole: "owner" },
      action: "employee.identity.update",
      outcome: "success",
      targetEmployeeAccountId: "employee-1",
      requestContext: { clientIp: "local", userAgentHash: null },
      details: auditRow.details,
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        actorEmployeeAccountId: "owner-1",
        actorGlobalRole: "owner",
        action: "employee.identity.update",
        outcome: "success",
        targetEmployeeAccountId: "employee-1",
        previousEventHash: "previous-hash",
        eventHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        createdAt: expect.any(Date),
      })
    );
    expect(event.previousEventHash).toBe("previous-hash");
    expect(event.eventHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("restricts audit listing to administrators", async () => {
    const result = await listAuditEventsForActor(
      { id: "employee-1", globalRole: "employee" },
      {}
    );

    expect(result).toEqual({
      events: [],
      page: 1,
      pageSize: DEFAULT_AUDIT_PAGE_SIZE,
    });
    expect(mocks.getDb).not.toHaveBeenCalled();
  });

  it("lists administrator audit events with bounded pagination", async () => {
    const offset = vi.fn().mockResolvedValue([auditRow]);
    const limit = vi.fn(() => ({ offset }));
    const orderBy = vi.fn(() => ({ limit }));

    mocks.getDb.mockReturnValue({
      select: () => ({
        from: () => ({ orderBy }),
      }),
    });

    const result = await listAuditEventsForActor(
      { id: "admin-1", globalRole: "system_admin" },
      { page: 3, pageSize: 500 }
    );

    expect(limit).toHaveBeenCalledWith(MAX_AUDIT_PAGE_SIZE);
    expect(offset).toHaveBeenCalledWith(200);
    expect(result.events).toHaveLength(1);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(MAX_AUDIT_PAGE_SIZE);
  });

  it("logs denied attempts with safe structured context", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    logDeniedPrivilegedAuditAttempt({
      actor: { id: "admin-1", globalRole: "system_admin" },
      action: "employee.create",
      targetEmployeeAccountId: "employee-1",
      reason: "actor_cannot_manage_admin_roles",
    });

    const logged = JSON.stringify(warn.mock.calls);

    expect(logged).toContain("actor_cannot_manage_admin_roles");
    expect(logged).not.toMatch(
      /password|passwordHash|session|reset-token|totp|recovery|signing/i
    );

    warn.mockRestore();
  });
});
