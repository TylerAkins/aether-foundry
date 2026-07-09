import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listEmployeesAdminService } from "@/features/auth/services/admin-employees";
import { requireEmployeeAdminSession } from "@/lib/auth/current-session";
import { findRegisteredProduct } from "@/lib/products/registry";

export const metadata: Metadata = {
  title: "Employee Administration | Aether Foundry",
  description: "Manage Aether Foundry employee accounts.",
};

export default async function EmployeeAdminPage() {
  const session = await requireEmployeeAdminSession();
  const employees = await listEmployeesAdminService(session.employee);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/portal" className="text-sm font-semibold text-sky-700">
              Back to portal
            </Link>
            <h1 className="mt-3 text-3xl font-semibold text-slate-950">
              Employee administration
            </h1>
          </div>
          <Link
            href="/portal/admin/employees/new"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-sky-700 px-3 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Create employee
          </Link>
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-3 pr-4 font-semibold">Name</th>
                    <th className="py-3 pr-4 font-semibold">Company email</th>
                    <th className="py-3 pr-4 font-semibold">Role</th>
                    <th className="py-3 pr-4 font-semibold">Status</th>
                    <th className="py-3 pr-4 font-semibold">Product access</th>
                    <th className="py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees?.map((employee) => (
                    <tr key={employee.id}>
                      <td className="py-3 pr-4 font-medium text-slate-950">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {employee.companyEmail}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatLabel(employee.globalRole)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {formatLabel(employee.status)}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">
                        {employee.productAccess.length
                          ? employee.productAccess
                              .map((access) =>
                                access.launchAccessEnabled
                                  ? `${formatProductName(access.productKey)}: ${formatLabel(access.productRole)}`
                                  : `${formatProductName(access.productKey)}: disabled`
                              )
                              .join(", ")
                          : "None"}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/portal/admin/employees/${employee.id}`}
                          className="font-semibold text-sky-700"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatProductName(productKey: string): string {
  return findRegisteredProduct(productKey)?.displayName ?? formatLabel(productKey);
}
