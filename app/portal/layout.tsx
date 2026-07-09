import Link from "next/link";
import {
  FileClock,
  LayoutDashboard,
  LogOut,
  Shield,
  User,
  Users,
} from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/server/actions";
import { requireEmployeeSession } from "@/lib/auth/current-session";

export default async function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await requireEmployeeSession();
  const isAdmin =
    session.employee.globalRole === "owner" ||
    session.employee.globalRole === "system_admin";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <a
        href="#portal-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-950 focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to portal content
      </a>
      <header className="border-b border-slate-200 bg-white px-4 sm:px-6">
        <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-3 py-3">
          <Link
            href="/portal"
            className="rounded-lg text-sm font-semibold text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Aether Foundry Portal
          </Link>

          <nav
            aria-label="Portal navigation"
            className="flex flex-wrap items-center gap-1"
          >
            <PortalLink href="/portal" icon={<LayoutDashboard aria-hidden />}>
              Dashboard
            </PortalLink>
            <PortalLink href="/portal/profile" icon={<User aria-hidden />}>
              My Profile
            </PortalLink>
            <PortalLink href="/account/security" icon={<Shield aria-hidden />}>
              Security
            </PortalLink>
            {isAdmin ? (
              <>
                <PortalLink href="/portal/admin/employees" icon={<Users aria-hidden />}>
                  Employees
                </PortalLink>
                <PortalLink
                  href="/portal/admin/audit-events"
                  icon={<FileClock aria-hidden />}
                >
                  Audit
                </PortalLink>
              </>
            ) : null}
          </nav>

          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              <LogOut aria-hidden />
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <div id="portal-content">{children}</div>
    </div>
  );
}

function PortalLink({
  children,
  href,
  icon,
}: Readonly<{
  children: React.ReactNode;
  href: string;
  icon: React.ReactNode;
}>) {
  return (
    <Link
      href={href}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-slate-600 outline-none transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-ring"
    >
      {icon}
      {children}
    </Link>
  );
}
