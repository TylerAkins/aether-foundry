import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_AUDIT_PAGE_SIZE,
  listAuditEventsForActor,
} from "@/features/auth/services/audit-events";
import { requireEmployeeAdminSession } from "@/lib/auth/current-session";

type AuditEventsPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export const metadata: Metadata = {
  title: "Security Audit Events | Aether Foundry",
  description: "Review privileged employee identity and access audit events.",
};

export default async function AuditEventsPage({
  searchParams,
}: Readonly<AuditEventsPageProps>) {
  const session = await requireEmployeeAdminSession();
  const params = await searchParams;
  const page = parsePositiveInteger(params.page);
  const pageSize = parsePositiveInteger(params.pageSize);
  const auditEvents = await listAuditEventsForActor(session.employee, {
    page,
    pageSize,
  });
  const hasNextPage = auditEvents.events.length === auditEvents.pageSize;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/portal" className="text-sm font-semibold text-sky-700">
              Back to portal
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              Security audit events
            </h1>
          </div>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Privileged activity</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-3 pr-4 font-semibold">Time</th>
                    <th className="py-3 pr-4 font-semibold">Action</th>
                    <th className="py-3 pr-4 font-semibold">Outcome</th>
                    <th className="py-3 pr-4 font-semibold">Actor</th>
                    <th className="py-3 pr-4 font-semibold">Target</th>
                    <th className="py-3 pr-4 font-semibold">Request</th>
                    <th className="py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditEvents.events.map((event) => (
                    <tr key={event.id} className="align-top">
                      <td className="py-3 pr-4 text-slate-600">
                        {formatDate(event.createdAt)}
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-950">
                        {event.action}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatLabel(event.outcome)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {event.actorEmployeeAccountId ?? "System"}
                        {event.actorGlobalRole ? (
                          <span className="block text-xs text-slate-500">
                            {formatLabel(event.actorGlobalRole)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {event.targetEmployeeAccountId ?? "None"}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        <pre className="max-w-64 whitespace-pre-wrap rounded-lg bg-slate-100 p-2 text-xs">
                          {formatJson(event.requestContext)}
                        </pre>
                      </td>
                      <td className="py-3 text-slate-600">
                        <pre className="max-w-md whitespace-pre-wrap rounded-lg bg-slate-100 p-2 text-xs">
                          {formatJson(event.details)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!auditEvents.events.length ? (
              <div
                role="status"
                className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600"
              >
                No privileged audit events have been recorded yet.
              </div>
            ) : null}

            <nav
              aria-label="Audit event pagination"
              className="flex flex-wrap justify-between gap-3"
            >
              {auditEvents.page > 1 ? (
                <Link
                  href={auditPageHref(auditEvents.page - 1, auditEvents.pageSize)}
                  className="font-semibold text-sky-700"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              {hasNextPage ? (
                <Link
                  href={auditPageHref(auditEvents.page + 1, auditEvents.pageSize)}
                  className="font-semibold text-sky-700"
                >
                  Next
                </Link>
              ) : null}
            </nav>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function auditPageHref(page: number, pageSize: number): string {
  const params = new URLSearchParams({ page: String(page) });

  if (pageSize !== DEFAULT_AUDIT_PAGE_SIZE) {
    params.set("pageSize", String(pageSize));
  }

  return `/portal/admin/audit-events?${params.toString()}`;
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatJson(value: Record<string, unknown>): string {
  return JSON.stringify(value, null, 2);
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
