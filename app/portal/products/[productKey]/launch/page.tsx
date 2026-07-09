import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireEmployeeSession } from "@/lib/auth/current-session";
import { getEmployeeProductLaunch } from "@/lib/products/launcher";

type ProductLaunchPageProps = {
  params: Promise<{ productKey: string }>;
};

export const metadata: Metadata = {
  title: "Product Launch | Aether Foundry",
  description: "Launch an authorized Aether Foundry product.",
};

export default async function ProductLaunchPage({
  params,
}: Readonly<ProductLaunchPageProps>) {
  const { productKey } = await params;
  const session = await requireEmployeeSession();
  const launch = await getEmployeeProductLaunch({
    employeeAccountId: session.employee.id,
    productKey,
  });

  if (launch.status === "launchable") {
    redirect(launch.launchUrl);
  }

  if (launch.status === "unknown" || launch.status === "unauthorized") {
    notFound();
  }

  return (
    <main className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto grid w-full max-w-2xl gap-6">
        <Link href="/portal" className="text-sm font-semibold text-sky-700">
          Back to portal
        </Link>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>{launch.product.displayName} unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p role="status" className="text-sm leading-6 text-slate-600">
              This product is currently unavailable. Your account may still have
              product access assigned, but launching is disabled by Aether
              Foundry.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
