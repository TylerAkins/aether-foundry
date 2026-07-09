import type { Metadata } from "next";

import { ActionForm } from "@/features/auth/components/action-form";
import { AuthCard } from "@/features/auth/components/auth-card";
import { requestPasswordResetAction } from "@/features/auth/server/actions";

export const metadata: Metadata = {
  title: "Reset Password | Aether Foundry",
  description: "Request an Aether Foundry employee password reset link.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset password">
      <ActionForm action={requestPasswordResetAction} submitLabel="Send reset link">
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
    </AuthCard>
  );
}
