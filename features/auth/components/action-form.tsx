"use client";

import { useActionState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/features/auth/types";

type ActionFormProps = {
  action: (formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  children: React.ReactNode;
};

const initialState: ActionResult = { success: false };

export function ActionForm({
  action,
  submitLabel,
  children,
}: Readonly<ActionFormProps>) {
  const [state, formAction, pending] = useActionState(
    async (_previousState: ActionResult, formData: FormData) => action(formData),
    initialState
  );

  return (
    <form action={formAction} className="grid gap-4">
      <input
        type="text"
        name="companyWebsite"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      {children}
      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-700">
          {state.message}
        </p>
      ) : null}
      {state.qrCodeDataUrl ? (
        <Image
          src={state.qrCodeDataUrl}
          alt="TOTP QR code"
          width={192}
          height={192}
          unoptimized
          className="size-48 rounded-lg border border-slate-200 bg-white p-2"
        />
      ) : null}
      {state.recoveryCodes ? (
        <ul className="grid gap-2 rounded-lg bg-slate-100 p-3 font-mono text-sm">
          {state.recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Working..." : submitLabel}
      </Button>
    </form>
  );
}
