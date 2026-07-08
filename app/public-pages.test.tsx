/** @vitest-environment happy-dom */

import * as React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import AboutUsPage, { metadata as aboutMetadata } from "@/app/about-us/page";
import GamesPage, { metadata as gamesMetadata } from "@/app/games/page";
import HomePage, { metadata as homeMetadata } from "@/app/page";
import ProductsServicesPage, {
  metadata as productsMetadata,
} from "@/app/products-services/page";

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

const pages = [
  {
    name: "Home",
    Component: HomePage,
    metadata: homeMetadata,
    expectedHeading: "Durable software for products, teams, and experiments.",
  },
  {
    name: "Products & Services",
    Component: ProductsServicesPage,
    metadata: productsMetadata,
    expectedHeading: "Focused software products built from practical service work.",
  },
  {
    name: "Games",
    Component: GamesPage,
    metadata: gamesMetadata,
    expectedHeading: "Game work is planned as a roadmap and exploration area.",
  },
  {
    name: "About Us",
    Component: AboutUsPage,
    metadata: aboutMetadata,
    expectedHeading:
      "Aether Foundry builds durable software with disciplined engineering.",
  },
] as const;

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

describe("public pages", () => {
  it("defines unique title and description metadata for each page", () => {
    const titles = pages.map((page) => page.metadata.title);
    const descriptions = pages.map((page) => page.metadata.description);

    expect(new Set(titles).size).toBe(pages.length);
    expect(new Set(descriptions).size).toBe(pages.length);
    expect(titles.every(Boolean)).toBe(true);
    expect(descriptions.every(Boolean)).toBe(true);
  });

  it.each(pages)("renders one unique h1 on $name", async ({ Component, expectedHeading }) => {
    await renderPage(<Component />);

    const headings = Array.from(document.querySelectorAll("h1")).map((heading) =>
      heading.textContent?.trim()
    );

    expect(headings).toEqual([expectedHeading]);
  });

  it("presents KVisaAssistant as unfinished and in development", async () => {
    await renderPage(<ProductsServicesPage />);

    const pageText = document.body.textContent ?? "";

    expect(pageText).toContain("KVisaAssistant");
    expect(pageText).toMatch(/unfinished/i);
    expect(pageText).toMatch(/in development/i);
    expect(pageText).not.toMatch(/sign up|buy now|purchase|available now/i);
  });

  it("presents games as roadmap work without fabricated release language", async () => {
    await renderPage(<GamesPage />);

    const pageText = document.body.textContent ?? "";

    expect(pageText).toMatch(/roadmap/i);
    expect(pageText).toMatch(/planned/i);
    expect(pageText).not.toMatch(/play now|download|available now|released on/i);
  });

  it.each(pages)("does not include recruiting content on $name", async ({ Component }) => {
    await renderPage(<Component />);

    const pageText = document.body.textContent ?? "";

    expect(pageText).not.toMatch(/career|job listing|recruit|application form/i);
  });
});

async function renderPage(element: React.ReactElement) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);

  await act(async () => {
    root?.render(element);
  });
}
