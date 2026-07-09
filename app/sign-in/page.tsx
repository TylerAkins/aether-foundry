import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/features/auth/components/auth-card";
import { ActionForm } from "@/features/auth/components/action-form";
import { signInAction, verifyLoginTotpAction } from "@/features/auth/server/actions";

export const metadata: Metadata = {
  title: "Employee Sign In | Aether Foundry",
  description: "Sign in to the Aether Foundry employee portal.",
};

export default function SignInPage() {
  return (
    <AuthCard title="Employee sign in">
      <div className="grid gap-8">
        <ActionForm action={signInAction} submitLabel="Sign in">
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
          <label className="grid gap-2 text-sm font-medium text-slate-700">
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-10 rounded-lg border border-slate-300 px-3 text-slate-950"
            />
          </label>
        </ActionForm>

        <div className="border-t border-slate-200 pt-6">
          <p className="mb-4 text-sm font-semibold text-slate-700">
            Second factor
          </p>
          <ActionForm action={verifyLoginTotpAction} submitLabel="Verify code">
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
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/forgot-password" className="font-medium text-sky-700">
            Forgot password
          </Link>
          <Link href="/verify-email" className="font-medium text-sky-700">
            Verify email
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}
