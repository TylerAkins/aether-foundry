import type { Metadata } from "next";

import { ActionForm } from "@/features/auth/components/action-form";
import { AuthCard } from "@/features/auth/components/auth-card";
import { resetPasswordAction } from "@/features/auth/server/actions";

export const metadata: Metadata = {
  title: "Set New Password | Aether Foundry",
  description: "Set a new Aether Foundry employee password.",
};

export default async function ResetPasswordPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ token?: string }>;
}>) {
  const { token = "" } = await searchParams;

  return (
    <AuthCard title="Set new password">
      <ActionForm action={resetPasswordAction} submitLabel="Reset password">
        <input type="hidden" name="token" value={token} />
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          New password
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
          />
        </label>
      </ActionForm>
    </AuthCard>
  );
}
