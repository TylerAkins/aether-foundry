import { ArrowRight, Boxes, Gamepad2, ShieldCheck } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
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
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen overflow-hidden">
      <SiteHeader />

      <main>
        <section className="px-4 py-5 sm:px-6 sm:py-7">
          <div className="relative mx-auto min-h-[32rem] w-full max-w-7xl overflow-hidden rounded-[2rem] bg-brand-ink text-white shadow-[0_35px_90px_-45px_rgba(15,23,42,0.8)]">
            <div
              className="pointer-events-none absolute -top-48 left-1/4 size-[34rem] rounded-full bg-brand-blue/25 blur-[120px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-56 left-0 size-[30rem] rounded-full bg-brand-orange/20 blur-[120px]"
              aria-hidden
            />

            <div className="relative z-10 flex min-h-[32rem] min-w-0 flex-col justify-center px-7 py-14 sm:px-12 lg:px-20 lg:py-16">
              <div className="mb-7 flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-sky-200 uppercase">
                <span className="h-px w-8 bg-brand-blue" aria-hidden />
                Software built for real work
              </div>
              <h1 className="max-w-4xl text-5xl leading-[0.98] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
                Software that works well and holds up over time.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Aether Foundry is where we build software products, internal
                tools, games, and technical experiments.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href="#capabilities"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-11 bg-white px-5 text-slate-950 shadow-lg shadow-black/20 hover:bg-sky-50"
                  )}
                >
                  See what we build
                  <ArrowRight data-icon="inline-end" aria-hidden />
                </a>
                <a
                  href="#principles"
                  className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-slate-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  How we work
                </a>
              </div>
            </div>

          </div>
        </section>

        <section id="capabilities" className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto w-full max-w-7xl">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-sm font-bold tracking-[0.18em] text-brand-blue-deep uppercase">
                  What we build
                </p>
                <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
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
                  <Card className="h-full gap-0 border-0 bg-white py-0 shadow-[0_22px_70px_-38px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80 transition-transform duration-300 hover:-translate-y-1">
                    <CardContent className="p-7 sm:p-8">
                      <span
                        className={cn(
                          "flex size-12 items-center justify-center rounded-2xl",
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
          <div className="mx-auto w-full max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
            <div className="grid lg:grid-cols-[0.72fr_1.28fr]">
              <div className="relative overflow-hidden bg-slate-950 p-8 text-white sm:p-12">
                <div
                  className="absolute -right-20 -bottom-24 size-64 rounded-full bg-brand-orange/25 blur-3xl"
                  aria-hidden
                />
                <p className="relative text-sm font-bold tracking-[0.18em] text-orange-300 uppercase">
                  Our principles
                </p>
                <h2 className="relative mt-5 text-4xl font-semibold tracking-tight">
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
      </main>

      <footer className="px-6 py-10 text-center text-sm text-slate-500">
        <p>© {currentYear} Aether Foundry</p>
      </footer>
    </div>
  );
}
