import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/server/actions";
import { requireEmployeeSession } from "@/lib/auth/current-session";

export const metadata: Metadata = {
  title: "Employee Portal | Aether Foundry",
  description: "Aether Foundry employee portal.",
};

export default async function PortalPage() {
  const session = await requireEmployeeSession();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-sky-700">Employee portal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">
              Welcome back.
            </h1>
            <p className="mt-2 text-slate-600">
              {session.employee.companyEmail}
            </p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </header>

        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">
            Product launcher
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Company product access will appear here as product integrations are
            added.
          </p>
          <Link
            href="/account/security"
            className="mt-5 inline-flex text-sm font-semibold text-sky-700"
          >
            Manage account security
          </Link>
        </section>
      </div>
    </main>
  );
}
