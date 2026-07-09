import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionForm } from "@/features/auth/components/action-form";
import {
  updateEmployeeIdentityAdminAction,
  updateEmployeeProductAccessAdminAction,
  updateEmployeeRoleStatusAdminAction,
} from "@/features/auth/server/actions";
import { getEmployeeAdminService } from "@/features/auth/services/admin-employees";
import {
  employeeGlobalRoles,
  employeeStatuses,
} from "@/lib/db/schema";
import { requireEmployeeAdminSession } from "@/lib/auth/current-session";
import { listRegisteredProducts } from "@/lib/products/registry";

type EmployeeDetailPageProps = {
  params: Promise<{ employeeAccountId: string }>;
};

export const metadata: Metadata = {
  title: "Edit Employee | Aether Foundry",
  description: "Edit an Aether Foundry employee account.",
};

export default async function EmployeeDetailPage({
  params,
}: Readonly<EmployeeDetailPageProps>) {
  const { employeeAccountId } = await params;
  const session = await requireEmployeeAdminSession();
  const employee = await getEmployeeAdminService(
    session.employee,
    employeeAccountId
  );

  if (!employee) {
    notFound();
  }

  const canManageAdminRole = session.employee.globalRole === "owner";
  const registeredProducts = listRegisteredProducts();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <Link
          href="/portal/admin/employees"
          className="text-sm font-semibold text-sky-700"
        >
          Back to employees
        </Link>
        <header>
          <h1 className="text-3xl font-semibold text-slate-950">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="mt-2 text-sm text-slate-600">{employee.companyEmail}</p>
        </header>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Identity</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={updateEmployeeIdentityAdminAction}
              submitLabel="Save identity"
            >
              <input
                type="hidden"
                name="employeeAccountId"
                value={employee.id}
              />
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Company email
                <input
                  name="companyEmail"
                  type="email"
                  defaultValue={employee.companyEmail}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Personal email
                <input
                  name="personalEmail"
                  type="email"
                  defaultValue={employee.personalEmail}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  First name
                  <input
                    name="firstName"
                    defaultValue={employee.firstName}
                    className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Middle name
                  <input
                    name="middleName"
                    defaultValue={employee.middleName ?? ""}
                    className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Last name
                  <input
                    name="lastName"
                    defaultValue={employee.lastName}
                    className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Phone
                <input
                  name="phone"
                  defaultValue={employee.phone}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                GitHub URL
                <input
                  name="githubUrl"
                  type="url"
                  defaultValue={employee.githubUrl}
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
            </ActionForm>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Role and status</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={updateEmployeeRoleStatusAdminAction}
              submitLabel="Save role and status"
            >
              <input
                type="hidden"
                name="employeeAccountId"
                value={employee.id}
              />
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Global role
                <select
                  name="globalRole"
                  defaultValue={employee.globalRole}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-950"
                >
                  {employeeGlobalRoles.map((role) => (
                    <option
                      key={role}
                      value={role}
                      disabled={!canManageAdminRole && role !== "employee"}
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
                  defaultValue={employee.status}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-950"
                >
                  {employeeStatuses.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Confirmation
                <input
                  name="confirmation"
                  placeholder="CONFIRM"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
            </ActionForm>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Product access</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            {registeredProducts.map((product) => {
              const productAccess = employee.productAccess.find(
                (access) => access.productKey === product.key
              );

              return (
                <ActionForm
                  key={product.key}
                  action={updateEmployeeProductAccessAdminAction}
                  submitLabel={`Save ${product.displayName} access`}
                >
                  <input
                    type="hidden"
                    name="employeeAccountId"
                    value={employee.id}
                  />
                  <input type="hidden" name="productKey" value={product.key} />
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Product
                    <input
                      value={product.displayName}
                      readOnly
                      className="h-10 rounded-lg border border-slate-300 bg-slate-100 px-3 text-slate-950"
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Product role
                    <select
                      name="productRole"
                      defaultValue={productAccess?.productRole ?? product.roles[0] ?? ""}
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-slate-950"
                    >
                      {product.roles.map((role) => (
                        <option key={role} value={role}>
                          {formatLabel(role)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                    <input
                      name="launchAccessEnabled"
                      type="checkbox"
                      defaultChecked={productAccess?.launchAccessEnabled ?? false}
                      className="size-4 rounded border-slate-300"
                    />
                    Launch access enabled
                  </label>
                  <label className="grid gap-2 text-sm font-medium text-slate-700">
                    Confirmation
                    <input
                      name="confirmation"
                      placeholder="CONFIRM"
                      className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                    />
                  </label>
                </ActionForm>
              );
            })}
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
