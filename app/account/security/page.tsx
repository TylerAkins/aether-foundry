import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActionForm } from "@/features/auth/components/action-form";
import {
  beginTotpSetupFormAction,
  confirmTotpSetupAction,
  disableTotpAction,
  regenerateRecoveryCodesAction,
} from "@/features/auth/server/actions";
import { requireEmployeeSession } from "@/lib/auth/current-session";

export const metadata: Metadata = {
  title: "Account Security | Aether Foundry",
  description: "Manage Aether Foundry employee account security.",
};

export default async function AccountSecurityPage() {
  await requireEmployeeSession();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <Link href="/portal" className="text-sm font-semibold text-sky-700">
          Back to portal
        </Link>
        <h1 className="text-3xl font-semibold text-slate-950">
          Account security
        </h1>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Authenticator app</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <ActionForm
              action={beginTotpSetupFormAction}
              submitLabel="Start TOTP setup"
            >
              <p className="text-sm leading-6 text-slate-600">
                Generate a QR code for an authenticator app.
              </p>
            </ActionForm>

            <ActionForm action={confirmTotpSetupAction} submitLabel="Enable TOTP">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Authenticator code
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
            </ActionForm>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Recovery codes</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={regenerateRecoveryCodesAction}
              submitLabel="Regenerate recovery codes"
            >
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Authenticator code
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
            </ActionForm>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Remove TOTP</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={disableTotpAction} submitLabel="Remove TOTP">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Authenticator code
                <input
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Recovery code
                <input
                  name="recoveryCode"
                  autoComplete="one-time-code"
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
