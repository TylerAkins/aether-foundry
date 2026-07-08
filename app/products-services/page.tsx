import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, ClipboardCheck, ShieldCheck } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Products & Services | Aether Foundry",
  description:
    "Products and services from Aether Foundry, starting with K Visa Assistant as an early build.",
};

const productPrinciples = [
  {
    title: "Focused workflows",
    description:
      "Products are shaped around specific user tasks instead of broad, unfocused feature lists.",
    icon: ClipboardCheck,
  },
  {
    title: "Secure foundations",
    description:
      "Sensitive flows are designed with clear boundaries, validation, and maintainable infrastructure.",
    icon: ShieldCheck,
  },
  {
    title: "Separate products",
    description:
      "Products remain loosely coupled so each one can evolve without pulling unrelated systems along.",
    icon: Boxes,
  },
] as const;

export default function ProductsServicesPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-bold text-brand-blue-deep uppercase">
              Products & Services
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl leading-tight font-semibold text-slate-950 sm:text-6xl">
              Focused products for workflows where clarity matters.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Aether Foundry builds products and internal systems for work that
              needs clear steps, careful handling, and software that stays easy
              to understand.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-bold text-brand-orange uppercase">
              Initial product
            </p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-950">
              K Visa Assistant
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              K Visa Assistant is an early product from Aether Foundry. It is
              still in development, so this page shares the direction while the
              work is still underway.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="rounded-lg bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-800">
                In development
              </span>
              <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                Initial product
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-brand-blue-deep uppercase">
              Product approach
            </p>
            <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl">
              Built around real workflows and maintainable foundations.
            </h2>
          </div>

          <ul role="list" className="mt-12 grid gap-5 lg:grid-cols-3">
            {productPrinciples.map(({ title, description, icon: Icon }) => (
              <li key={title}>
                <Card className="h-full gap-0 rounded-lg border-0 bg-white py-0 ring-1 ring-slate-200/80">
                  <CardContent className="p-7 sm:p-8">
                    <span className="flex size-12 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <h3 className="mt-8 text-xl font-semibold text-slate-950">
                      {title}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-600">{description}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-lg border border-slate-200 bg-white p-7 sm:p-8">
            <h2 className="text-2xl font-semibold text-slate-950">
              Current availability
            </h2>
            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              K Visa Assistant is not open for public use yet. Aether Foundry
              will share availability details when the product is ready to stand
              behind.
            </p>
            <Link
              href="/about-us"
              className="mt-6 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-brand-blue-deep transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Read about the engineering philosophy
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
