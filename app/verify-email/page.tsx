import type { Metadata } from "next";

import { ActionForm } from "@/features/auth/components/action-form";
import { AuthCard } from "@/features/auth/components/auth-card";
import {
  requestVerificationEmailAction,
  verifyEmailAction,
} from "@/features/auth/server/actions";

export const metadata: Metadata = {
  title: "Verify Email | Aether Foundry",
  description: "Verify an Aether Foundry employee email address.",
};

export default async function VerifyEmailPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ token?: string }>;
}>) {
  const { token = "" } = await searchParams;

  return (
    <AuthCard title="Verify employee email">
      <div className="grid gap-8">
        <ActionForm action={verifyEmailAction} submitLabel="Verify email">
          <input type="hidden" name="token" value={token} />
        </ActionForm>
        <div className="border-t border-slate-200 pt-6">
          <ActionForm
            action={requestVerificationEmailAction}
            submitLabel="Send verification link"
          >
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
              />
            </label>
          </ActionForm>
        </div>
      </div>
    </AuthCard>
  );
}
