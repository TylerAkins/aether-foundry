import { ArrowRight, Boxes, Gamepad2, ShieldCheck } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const capabilities = [
  {
    title: "Software products",
    description:
      "Web applications built around real workflows, with interfaces that make sense to the people using them.",
    icon: Boxes,
    accent: "blue",
  },
  {
    title: "Internal platforms",
    description:
      "Secure systems that replace scattered processes and give teams one dependable place to work.",
    icon: ShieldCheck,
    accent: "orange",
  },
  {
    title: "Games and experiments",
    description:
      "Room for game projects, prototypes, and technical ideas worth exploring.",
    icon: Gamepad2,
    accent: "blue",
  },
] as const;

const principles = [
  {
    number: "01",
    title: "Keep it clear",
    description:
      "We make deliberate choices and avoid complexity that does not earn its place.",
  },
  {
    number: "02",
    title: "Build security in",
    description:
      "Security is part of the design and implementation from the start.",
  },
  {
    number: "03",
    title: "Think past launch",
    description:
      "We choose technology that can be understood, maintained, and improved over time.",
  },
] as const;

export default function HomePage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="min-w-0">
            <p className="flex items-center gap-3 text-xs font-bold text-brand-blue-deep uppercase">
              <span className="h-px w-9 bg-brand-blue" aria-hidden />
              Software built for real work
            </p>
            <h1 className="mt-7 max-w-4xl text-5xl leading-[0.98] font-semibold text-balance text-slate-950 sm:text-6xl lg:text-7xl">
              Durable software for products, teams, and experiments.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Aether Foundry builds focused web products, internal systems, and
              exploratory game work with a bias for clarity and maintainability.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href="#capabilities"
                className={cn(buttonVariants({ size: "lg" }), "h-11 px-5")}
              >
                See what we build
                <ArrowRight data-icon="inline-end" aria-hidden />
              </a>
              <a
                href="#principles"
                className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                How we work
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.5)] lg:p-5">
            <div className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-bold text-brand-blue-deep uppercase">
                    Foundry focus
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Current platform foundation
                  </p>
                </div>
                <span className="rounded-lg bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                  MVP
                </span>
              </div>

              <ul role="list" className="divide-y divide-slate-200">
                {capabilities.map(({ title, description, icon: Icon, accent }) => (
                  <li key={title} className="grid grid-cols-[2.75rem_1fr] gap-4 py-5">
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-lg",
                        accent === "orange"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-sky-100 text-sky-700"
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-slate-950">
                        {title}
                      </span>
                      <span className="mt-1 block text-sm leading-6 text-slate-600">
                        {description}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-3 gap-3 border-t border-slate-200 pt-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-slate-950">3</p>
                  <p className="text-xs text-slate-500">focus areas</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">1</p>
                  <p className="text-xs text-slate-500">shared shell</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-950">0</p>
                  <p className="text-xs text-slate-500">dark flash</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-bold text-brand-blue-deep uppercase">
                What we build
              </p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold text-slate-950 sm:text-5xl">
                Products, tools, and experiments.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">
              From customer-facing products to internal systems, we build
              software that is clear, useful, and maintainable.
            </p>
          </div>

          <ul role="list" className="mt-12 grid gap-5 lg:grid-cols-3">
            {capabilities.map(({ title, description, icon: Icon, accent }) => (
              <li key={title} role="listitem">
                <Card className="h-full gap-0 rounded-lg border-0 bg-white py-0 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.5)] ring-1 ring-slate-200/80 transition-transform duration-300 hover:-translate-y-1">
                  <CardContent className="p-7 sm:p-8">
                    <span
                      className={cn(
                        "flex size-12 items-center justify-center rounded-lg",
                        accent === "orange"
                          ? "bg-orange-100 text-orange-600"
                          : "bg-sky-100 text-sky-700"
                      )}
                    >
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
        </div>
      </section>

      <section id="principles" className="px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_55px_-44px_rgba(15,23,42,0.45)]">
          <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
            <div className="border-b border-slate-200 bg-slate-50 p-8 sm:p-12 lg:border-r lg:border-b-0">
              <p className="text-sm font-bold text-brand-blue-deep uppercase">
                Our principles
              </p>
              <h2 className="mt-5 text-4xl font-semibold text-slate-950">
                How we approach the work.
              </h2>
            </div>
            <ol className="divide-y divide-slate-200 px-7 sm:px-10">
              {principles.map(({ number, title, description }) => (
                <li key={number} className="grid gap-3 py-8 sm:grid-cols-[4rem_1fr]">
                  <span className="font-mono text-sm font-bold text-brand-orange">
                    {number}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                    <p className="mt-2 leading-7 text-slate-600">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
