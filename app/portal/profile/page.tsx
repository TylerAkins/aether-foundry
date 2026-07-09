import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionForm } from "@/features/auth/components/action-form";
import { updateOwnEmployeeProfileAction } from "@/features/auth/server/actions";
import { getOwnEmployeeProfileService } from "@/features/auth/services/profile";
import { requireEmployeeSession } from "@/lib/auth/current-session";

export const metadata: Metadata = {
  title: "My Profile | Aether Foundry",
  description: "View and update your Aether Foundry employee profile.",
};

export default async function PortalProfilePage() {
  const session = await requireEmployeeSession();
  const employee = await getOwnEmployeeProfileService(session.employee.id);

  if (!employee) {
    notFound();
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <header className="grid gap-2">
          <p className="text-sm font-semibold text-sky-700">My Profile</p>
          <h1 className="text-3xl font-semibold text-slate-950">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            Review your employee identity and update permitted contact fields.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Protected identity</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <ProfileField label="Company email" value={employee.companyEmail} />
                <ProfileField label="First name" value={employee.firstName} />
                <ProfileField
                  label="Middle name"
                  value={employee.middleName ?? "Not provided"}
                />
                <ProfileField label="Last name" value={employee.lastName} />
                <ProfileField label="Role" value={formatLabel(employee.globalRole)} />
                <ProfileField label="Status" value={formatLabel(employee.status)} />
              </dl>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Product access</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.productAccess.length ? (
                <ul className="grid gap-3 text-sm">
                  {employee.productAccess.map((access) => (
                    <li
                      key={access.productKey}
                      className="rounded-lg border border-slate-200 p-3"
                    >
                      <p className="font-semibold text-slate-950">
                        {formatProductName(access.productKey)}
                      </p>
                      <p className="mt-1 text-slate-600">
                        {formatLabel(access.productRole)} ·{" "}
                        {access.launchAccessEnabled
                          ? "Launch enabled"
                          : "Launch disabled"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  role="status"
                  className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-600"
                >
                  No product access is assigned to your account.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Editable contact details</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={updateOwnEmployeeProfileAction}
              submitLabel="Save profile"
            >
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Personal email
                <input
                  name="personalEmail"
                  type="email"
                  defaultValue={employee.personalEmail}
                  autoComplete="email"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Phone
                <input
                  name="phone"
                  defaultValue={employee.phone}
                  autoComplete="tel"
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
      </div>
    </main>
  );
}

function ProfileField({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
      <dt className="font-medium text-slate-600">{label}</dt>
      <dd className="font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function formatProductName(productKey: string): string {
  if (productKey === "kvisa_assistant") {
    return "K Visa Assistant";
  }

  return formatLabel(productKey);
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
