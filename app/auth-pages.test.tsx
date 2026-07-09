/** @vitest-environment happy-dom */

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getEmployeeProductLaunch: vi.fn(),
  productsEnabled: true,
}));

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
  createEmployeeAdminAction: vi.fn(),
  disableTotpAction: vi.fn(),
  regenerateRecoveryCodesAction: vi.fn(),
  signOutAction: vi.fn(),
  updateEmployeeIdentityAdminAction: vi.fn(),
  updateOwnEmployeeProfileAction: vi.fn(),
  updateEmployeeProductAccessAdminAction: vi.fn(),
  updateEmployeeRoleStatusAdminAction: vi.fn(),
}));

vi.mock("@/features/auth/services/profile", () => ({
  getOwnEmployeeProfileService: vi.fn(async () => ({
    id: "employee-1",
    companyEmail: "employee@example.com",
    personalEmail: "personal@example.com",
    firstName: "Employee",
    middleName: null,
    lastName: "Example",
    phone: "555-0100",
    githubUrl: "https://github.com/employee",
    globalRole: "employee",
    status: "active",
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    productAccess: [
      {
        employeeAccountId: "employee-1",
        productKey: "kvisa_assistant",
        productRole: "reviewer",
        launchAccessEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  })),
}));

vi.mock("@/lib/products/launcher", () => ({
  getEmployeeProductLaunch: mocks.getEmployeeProductLaunch,
}));

vi.mock("@/lib/products/registry", () => {
  const product = {
    key: "kvisa_assistant",
    displayName: "K Visa Assistant",
    description: "Immigration workflow support for K visa matters.",
    enabled: true,
    launchUrl: "http://localhost:3001",
    roles: ["owner", "admin", "reviewer", "support"],
  };

  return {
    findRegisteredProduct: vi.fn((productKey: string) =>
      productKey === product.key
        ? {
            ...product,
            enabled: mocks.productsEnabled,
          }
        : null
    ),
    getRegisteredProduct: vi.fn(() => ({
      ...product,
      enabled: mocks.productsEnabled,
    })),
    listEnabledProducts: vi.fn(() =>
      mocks.productsEnabled ? [{ ...product, enabled: true }] : []
    ),
    listRegisteredProducts: vi.fn(() => [
      { ...product, enabled: mocks.productsEnabled },
    ]),
  };
});

vi.mock("@/features/auth/services/admin-employees", () => ({
  getEmployeeAdminService: vi.fn(async () => ({
    id: "00000000-0000-4000-8000-000000000001",
    companyEmail: "employee@example.com",
    personalEmail: "personal@example.com",
    firstName: "Employee",
    middleName: null,
    lastName: "Example",
    phone: "555-0100",
    githubUrl: "https://github.com/employee",
    globalRole: "employee",
    status: "active",
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    productAccess: [
      {
        employeeAccountId: "00000000-0000-4000-8000-000000000001",
        productKey: "kvisa_assistant",
        productRole: "reviewer",
        launchAccessEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  })),
  listEmployeesAdminService: vi.fn(async () => [
    {
      id: "00000000-0000-4000-8000-000000000001",
      companyEmail: "employee@example.com",
      personalEmail: "personal@example.com",
      firstName: "Employee",
      middleName: null,
      lastName: "Example",
      phone: "555-0100",
      githubUrl: "https://github.com/employee",
      globalRole: "employee",
      status: "active",
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      productAccess: [],
    },
  ]),
}));

vi.mock("@/features/auth/services/audit-events", () => ({
  DEFAULT_AUDIT_PAGE_SIZE: 25,
  listAuditEventsForActor: vi.fn(async () => ({
    events: [
      {
        id: "audit-1",
        actorEmployeeAccountId: "owner-1",
        actorGlobalRole: "owner",
        action: "employee.create",
        outcome: "success",
        targetEmployeeAccountId: "00000000-0000-4000-8000-000000000001",
        requestContext: { clientIp: "local", userAgentHash: null },
        details: {
          before: null,
          after: { companyEmail: "employee@example.com" },
        },
        previousEventHash: null,
        eventHash: "event-hash",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ],
    page: 1,
    pageSize: 25,
  })),
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
  requireEmployeeAdminSession: vi.fn(async () => ({
    employee: {
      id: "owner-1",
      companyEmail: "owner@example.com",
      globalRole: "owner",
      status: "active",
      emailVerifiedAt: new Date(),
    },
    session: { id: "session-1" },
  })),
}));

import AccountSecurityPage from "@/app/account/security/page";
import AuditEventsPage from "@/app/portal/admin/audit-events/page";
import EmployeeDetailPage from "@/app/portal/admin/employees/[employeeAccountId]/page";
import EmployeeAdminPage from "@/app/portal/admin/employees/page";
import NewEmployeePage from "@/app/portal/admin/employees/new/page";
import ForgotPasswordPage from "@/app/forgot-password/page";
import PortalLayout from "@/app/portal/layout";
import PortalPage from "@/app/portal/page";
import ProductLaunchPage from "@/app/portal/products/[productKey]/launch/page";
import PortalProfilePage from "@/app/portal/profile/page";
import ResetPasswordPage from "@/app/reset-password/page";
import SignInPage from "@/app/sign-in/page";
import VerifyEmailPage from "@/app/verify-email/page";
import { getOwnEmployeeProfileService } from "@/features/auth/services/profile";
import { requireEmployeeSession } from "@/lib/auth/current-session";

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
  mocks.productsEnabled = true;
  mocks.getEmployeeProductLaunch.mockReset();
  vi.mocked(getOwnEmployeeProfileService).mockClear();
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
    expect(document.body.textContent).toContain("Dashboard");
    expect(document.body.textContent).toContain("K Visa Assistant");
    expect(document.body.textContent).toContain("Product role: Reviewer");
    expect(
      document.querySelector<HTMLAnchorElement>(
        'a[href="/portal/products/kvisa_assistant/launch"]'
      )
    ).not.toBeNull();

    await renderPage(await AccountSecurityPage());
    expect(document.body.textContent).toContain("Account security");
  });

  it("renders the portal profile with protected and editable fields", async () => {
    await renderPage(await PortalProfilePage());

    expect(document.body.textContent).toContain("Protected identity");
    expect(document.body.textContent).toContain("Product access");
    expect(document.querySelector('input[name="personalEmail"]')).not.toBeNull();
    expect(document.querySelector('input[name="phone"]')).not.toBeNull();
    expect(document.querySelector('input[name="githubUrl"]')).not.toBeNull();
    expect(document.querySelector('input[name="globalRole"]')).toBeNull();
    expect(document.querySelector('input[name="status"]')).toBeNull();
    expect(document.querySelector('input[name="companyEmail"]')).toBeNull();
  });

  it("renders an empty product launcher state when no products are enabled", async () => {
    vi.mocked(getOwnEmployeeProfileService).mockResolvedValueOnce({
      id: "employee-1",
      companyEmail: "employee@example.com",
      personalEmail: "personal@example.com",
      firstName: "Employee",
      middleName: null,
      lastName: "Example",
      phone: "555-0100",
      githubUrl: "https://github.com/employee",
      globalRole: "employee",
      status: "active",
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      productAccess: [],
    });

    await renderPage(await PortalPage());

    expect(document.body.textContent).toContain(
      "No product launch access is enabled"
    );
  });

  it("hides assigned products from the launcher when the product is disabled", async () => {
    mocks.productsEnabled = false;

    await renderPage(await PortalPage());

    expect(document.body.textContent).not.toContain("K Visa Assistant");
    expect(document.body.textContent).toContain(
      "No product launch access is enabled"
    );
  });

  it("renders a clear unavailable state for direct disabled product launches", async () => {
    mocks.getEmployeeProductLaunch.mockResolvedValueOnce({
      status: "disabled",
      product: {
        key: "kvisa_assistant",
        displayName: "K Visa Assistant",
        description: "Immigration workflow support for K visa matters.",
        enabled: false,
        launchUrl: null,
        roles: ["owner", "admin", "reviewer", "support"],
      },
    });

    await renderPage(
      await ProductLaunchPage({
        params: Promise.resolve({ productKey: "kvisa_assistant" }),
      })
    );

    expect(document.body.textContent).toContain("K Visa Assistant unavailable");
    expect(document.body.textContent).toContain(
      "launching is disabled by Aether Foundry"
    );
  });

  it("renders admin navigation only for portal administrators", async () => {
    await renderPage(
      await PortalLayout({
        children: React.createElement("main", null, "Portal child"),
      })
    );

    expect(document.body.textContent).toContain("Dashboard");
    expect(document.body.textContent).toContain("My Profile");
    expect(document.body.textContent).not.toContain("Employees");
    expect(document.body.textContent).not.toContain("Audit");

    vi.mocked(requireEmployeeSession).mockResolvedValueOnce({
      employee: {
        id: "owner-1",
        companyEmail: "owner@example.com",
        globalRole: "owner",
        status: "active",
        emailVerifiedAt: new Date(),
      },
      session: { id: "session-1", employeeAccountId: "owner-1", expiresAt: new Date() },
    });

    await renderPage(
      await PortalLayout({
        children: React.createElement("main", null, "Portal child"),
      })
    );

    expect(document.body.textContent).toContain("Employees");
    expect(document.body.textContent).toContain("Audit");
  });

  it("renders employee administration pages", async () => {
    await renderPage(await EmployeeAdminPage());
    expect(document.body.textContent).toContain("Employee administration");
    expect(document.body.textContent).toContain("Create employee");

    await renderPage(await NewEmployeePage());
    expect(document.body.textContent).toContain("Account details");
    expect(document.querySelector('select[name="globalRole"]')).not.toBeNull();

    await renderPage(
      await EmployeeDetailPage({
        params: Promise.resolve({
          employeeAccountId: "00000000-0000-4000-8000-000000000001",
        }),
      })
    );
    expect(document.body.textContent).toContain("Role and status");
    expect(document.body.textContent).toContain("Product access");
    expect(document.querySelector('input[name="confirmation"]')).not.toBeNull();

    await renderPage(
      await AuditEventsPage({
        searchParams: Promise.resolve({}),
      })
    );
    expect(document.body.textContent).toContain("Security audit events");
    expect(document.body.textContent).toContain("employee.create");
    expect(document.body.textContent).toContain("owner-1");
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
