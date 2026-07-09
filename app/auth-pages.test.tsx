/** @vitest-environment happy-dom */

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("@/features/auth/server/actions", () => ({
  signInAction: vi.fn(),
  verifyLoginTotpAction: vi.fn(),
  requestPasswordResetAction: vi.fn(),
  resetPasswordAction: vi.fn(),
  requestVerificationEmailAction: vi.fn(),
  verifyEmailAction: vi.fn(),
  beginTotpSetupFormAction: vi.fn(),
  confirmTotpSetupAction: vi.fn(),
  disableTotpAction: vi.fn(),
  regenerateRecoveryCodesAction: vi.fn(),
  signOutAction: vi.fn(),
}));

vi.mock("@/lib/auth/current-session", () => ({
  requireEmployeeSession: vi.fn(async () => ({
    employee: {
      id: "employee-1",
      companyEmail: "employee@example.com",
      globalRole: "employee",
      status: "active",
      emailVerifiedAt: new Date(),
    },
    session: { id: "session-1" },
  })),
}));

import AccountSecurityPage from "@/app/account/security/page";
import ForgotPasswordPage from "@/app/forgot-password/page";
import PortalPage from "@/app/portal/page";
import ResetPasswordPage from "@/app/reset-password/page";
import SignInPage from "@/app/sign-in/page";
import VerifyEmailPage from "@/app/verify-email/page";

let root: Root | undefined;
let container: HTMLDivElement | undefined;

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
});

afterEach(() => {
  if (root) {
    act(() => {
      root?.unmount();
    });
  }

  root = undefined;
  container?.remove();
  container = undefined;
  document.body.innerHTML = "";
});

describe("auth pages", () => {
  it("renders employee sign in with second factor fields", async () => {
    await renderPage(<SignInPage />);

    expect(document.body.textContent).toContain("Employee sign in");
    expect(document.body.textContent).toContain("Second factor");
    expect(document.querySelector('input[name="companyWebsite"]')).not.toBeNull();
  });

  it("renders reset and verification pages with hidden tokens", async () => {
    await renderPage(
      await ResetPasswordPage({
        searchParams: Promise.resolve({ token: "reset-token" }),
      })
    );

    expect(document.querySelector<HTMLInputElement>('input[name="token"]')?.value).toBe(
      "reset-token"
    );

    await renderPage(
      await VerifyEmailPage({
        searchParams: Promise.resolve({ token: "verify-token" }),
      })
    );

    expect(document.querySelector<HTMLInputElement>('input[name="token"]')?.value).toBe(
      "verify-token"
    );
  });

  it("renders password reset request and protected pages", async () => {
    await renderPage(<ForgotPasswordPage />);
    expect(document.body.textContent).toContain("Reset password");

    await renderPage(await PortalPage());
    expect(document.body.textContent).toContain("Employee portal");

    await renderPage(await AccountSecurityPage());
    expect(document.body.textContent).toContain("Account security");
  });
});

async function renderPage(element: React.ReactElement) {
  if (root) {
    act(() => {
      root?.unmount();
    });
  }

  container?.remove();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(element);
  });
}
