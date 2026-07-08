/** @vitest-environment happy-dom */

import axe from "axe-core";
import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { SiteShell } from "@/components/layout/site-shell";

const publicNavigation = [
  { label: "Home", href: "/" },
  { label: "Products & Services", href: "/products-services" },
  { label: "Games", href: "/games" },
  { label: "About Us", href: "/about-us" },
] as const;

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement> & { priority?: boolean }) => {
    const imageProps = { ...props };

    delete imageProps.priority;

    return React.createElement("img", imageProps);
  },
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { href, ...props }, children),
}));

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

describe("SiteShell", () => {
  it("renders accessible brand and navigation landmarks", async () => {
    await renderShell();

    expect(
      document.querySelector('a[aria-label="Aether Foundry home"]')
    ).not.toBeNull();
    expect(document.querySelector('a[href="#main-content"]')?.textContent).toBe(
      "Skip to main content"
    );
    expect(
      document.querySelector('nav[aria-label="Primary navigation"]')
    ).not.toBeNull();

    const primaryLinks = Array.from(
      document.querySelectorAll('nav[aria-label="Primary navigation"] a')
    ).map((link) => ({
      label: link.textContent,
      href: link.getAttribute("href"),
    }));

    expect(primaryLinks).toEqual(publicNavigation);

    const footerLinks = Array.from(
      document.querySelectorAll('nav[aria-label="Footer navigation"] a')
    ).map((link) => ({
      label: link.textContent,
      href: link.getAttribute("href"),
    }));

    expect(footerLinks).toEqual(publicNavigation);
  });

  it("exposes an accessible mobile navigation toggle", async () => {
    await renderShell();

    const toggle = document.querySelector<HTMLButtonElement>(
      'button[aria-controls="mobile-primary-navigation"]'
    );

    expect(toggle).not.toBeNull();
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(toggle?.getAttribute("aria-label")).toBe("Open primary navigation");

    await act(async () => {
      toggle?.click();
    });

    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(toggle?.getAttribute("aria-label")).toBe("Close primary navigation");
    expect(
      document.querySelector("#mobile-primary-navigation")?.className
    ).toContain("block");

    const mobileLinks = Array.from(
      document.querySelectorAll("#mobile-primary-navigation a")
    ).map((link) => ({
      label: link.textContent,
      href: link.getAttribute("href"),
    }));

    expect(mobileLinks).toEqual(publicNavigation);
  });

  it("has no critical accessibility violations in the shared shell", async () => {
    await renderShell();

    const results = await axe.run(document.body);
    const criticalViolations = results.violations.filter(
      (violation) => violation.impact === "critical"
    );

    expect(criticalViolations).toEqual([]);
  });
});

async function renderShell() {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(
      <SiteShell>
        <section id="capabilities">
          <h1>Capabilities</h1>
        </section>
        <section id="principles">
          <h2>Principles</h2>
        </section>
      </SiteShell>
    );
  });
}
