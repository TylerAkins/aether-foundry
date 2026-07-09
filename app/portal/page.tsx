import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleUserRound, ExternalLink } from "lucide-react";
import { notFound } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOwnEmployeeProfileService } from "@/features/auth/services/profile";
import { requireEmployeeSession } from "@/lib/auth/current-session";
import type { ProductAccess } from "@/features/auth/services/employee-repository";
import {
  getRegisteredProduct,
  listEnabledProducts,
  type RegisteredProduct,
} from "@/lib/products/registry";

export const metadata: Metadata = {
  title: "Employee Portal | Aether Foundry",
  description: "Aether Foundry employee portal.",
};

export default async function PortalPage() {
  const session = await requireEmployeeSession();
  const employee = await getOwnEmployeeProfileService(session.employee.id);

  if (!employee) {
    notFound();
  }

  const enabledProductKeys = new Set(
    listEnabledProducts().map((product) => product.key)
  );
  const launchableProductAccess = employee.productAccess.filter(
    (access) =>
      access.launchAccessEnabled && enabledProductKeys.has(access.productKey)
  );

  return (
    <main className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <header className="grid gap-2">
          <p className="text-sm font-semibold text-sky-700">Dashboard</p>
          <h1 className="text-3xl font-semibold text-slate-950">
            Welcome back, {employee.firstName}.
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            View your Aether Foundry identity and launch the products you are
            authorized to use.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Signed-in identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                  <CircleUserRound aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-950">
                    {employee.firstName} {employee.lastName}
                  </p>
                  <p className="truncate text-sm text-slate-600">
                    {employee.companyEmail}
                  </p>
                </div>
              </div>

              <dl className="grid gap-3 text-sm">
                <IdentityField label="Role" value={formatLabel(employee.globalRole)} />
                <IdentityField label="Status" value={formatLabel(employee.status)} />
                <IdentityField
                  label="Personal email"
                  value={employee.personalEmail}
                />
              </dl>

              <Link
                href="/portal/profile"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700"
              >
                View profile
                <ArrowRight aria-hidden className="size-4" />
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Product launcher</CardTitle>
            </CardHeader>
            <CardContent>
              {launchableProductAccess.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {launchableProductAccess.map((access) => (
                    <ProductLauncherCard
                      key={access.productKey}
                      access={access}
                      product={getRegisteredProduct(access.productKey)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  role="status"
                  className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600"
                >
                  No product launch access is enabled for your account yet.
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

function IdentityField({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-3">
      <dt className="font-medium text-slate-600">{label}</dt>
      <dd className="font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function ProductLauncherCard({
  access,
  product,
}: Readonly<{ access: ProductAccess; product: RegisteredProduct }>) {
  return (
    <article className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-base font-semibold text-slate-950">
          {product.displayName}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Product role: {formatLabel(access.productRole)}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {product.description}
        </p>
      </div>
      <Link
        href={`/portal/products/${access.productKey}/launch`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700"
      >
        Launch product
        <ExternalLink aria-hidden className="size-4" />
      </Link>
    </article>
  );
}

function formatLabel(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
