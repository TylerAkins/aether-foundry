import Link from "next/link";

import { publicNavigationItems } from "@/components/layout/public-navigation";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 px-6 py-8 text-sm text-slate-600">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p>© {currentYear} Aether Foundry</p>
          <p className="mt-2">
            Software products, internal tools, games, and experiments.
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <ul role="list" className="flex flex-wrap gap-x-4 gap-y-2">
            {publicNavigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-lg font-medium transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
