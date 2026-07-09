import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionForm } from "@/features/auth/components/action-form";
import { createEmployeeAdminAction } from "@/features/auth/server/actions";
import { employeeGlobalRoles, employeeStatuses } from "@/lib/db/schema";
import { requireEmployeeAdminSession } from "@/lib/auth/current-session";

export const metadata: Metadata = {
  title: "Create Employee | Aether Foundry",
  description: "Create an Aether Foundry employee account.",
};

export default async function NewEmployeePage() {
  const session = await requireEmployeeAdminSession();
  const canCreateAdminRole = session.employee.globalRole === "owner";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <Link
          href="/portal/admin/employees"
          className="text-sm font-semibold text-sky-700"
        >
          Back to employees
        </Link>
        <h1 className="text-3xl font-semibold text-slate-950">
          Create employee
        </h1>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={createEmployeeAdminAction}
              submitLabel="Create employee"
            >
              <EmployeeIdentityFields />
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Global role
                <select
                  name="globalRole"
                  defaultValue="employee"
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-950"
                >
                  {employeeGlobalRoles.map((role) => (
                    <option
                      key={role}
                      value={role}
                      disabled={!canCreateAdminRole && role !== "employee"}
                    >
                      {formatLabel(role)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Status
                <select
                  name="status"
                  defaultValue="pending"
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-950"
                >
                  {employeeStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function EmployeeIdentityFields() {
  return (
    <>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Company email
        <input
          name="companyEmail"
          type="email"
          autoComplete="email"
          className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Personal email
        <input
          name="personalEmail"
          type="email"
          autoComplete="email"
          className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
        />
      </label>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          First name
          <input
            name="firstName"
            autoComplete="given-name"
            className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Middle name
          <input
            name="middleName"
            autoComplete="additional-name"
            className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Last name
          <input
            name="lastName"
            autoComplete="family-name"
            className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
          />
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Phone
        <input
          name="phone"
          autoComplete="tel"
          className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        GitHub URL
        <input
          name="githubUrl"
          type="url"
          className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
        />
      </label>
    </>
  );
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
