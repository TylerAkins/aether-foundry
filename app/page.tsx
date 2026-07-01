import { ArrowRight, Boxes, Gamepad2, ShieldCheck } from "lucide-react";

import { SiteHeader } from "@/components/layout/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const capabilities = [
  {
    title: "Software products",
    description:
      "Focused digital products built around real workflows, clear interfaces, and lasting value.",
    icon: Boxes,
    accent: "blue",
  },
  {
    title: "Internal platforms",
    description:
      "Secure shared systems that give teams one reliable place to work, launch, and grow.",
    icon: ShieldCheck,
    accent: "orange",
  },
  {
    title: "Games and experiments",
    description:
      "A home for ambitious game projects and thoughtful technical exploration.",
    icon: Gamepad2,
    accent: "blue",
  },
] as const;

const principles = [
  {
    number: "01",
    title: "Clarity first",
    description: "Readable systems and calm experiences beat clever complexity.",
  },
  {
    number: "02",
    title: "Secure by design",
    description: "Trust is built into the foundation, not patched in at the end.",
  },
  {
    number: "03",
    title: "Made to endure",
    description: "We choose maintainable technology and build for the long view.",
  },
] as const;

const focusTags = ["Products", "Platforms", "Experiments"] as const;

const signaturePoints = [
  "Clear product thinking",
  "Secure foundations",
  "Long-term maintainability",
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <SiteHeader />

      <main>
        <section className="px-4 py-5 sm:px-6 sm:py-7">
          <div className="relative mx-auto min-h-[38rem] w-full max-w-7xl overflow-hidden rounded-[2rem] bg-brand-ink text-white shadow-[0_35px_90px_-45px_rgba(15,23,42,0.8)]">
            <div
              className="pointer-events-none absolute -top-48 left-1/4 size-[34rem] rounded-full bg-brand-blue/25 blur-[120px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-56 left-0 size-[30rem] rounded-full bg-brand-orange/20 blur-[120px]"
              aria-hidden
            />

            <div className="relative z-10 flex min-h-[38rem] min-w-0 flex-col justify-center px-7 py-16 sm:px-12 lg:px-20 lg:py-20">
              <div className="mb-8 flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-sky-200 uppercase">
                <span className="h-px w-8 bg-brand-blue" aria-hidden />
                Software forged with purpose
              </div>
              <div className="mb-7 flex flex-wrap gap-2">
                {focusTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[0.68rem] font-semibold tracking-[0.18em] text-slate-200 uppercase"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="max-w-4xl text-5xl leading-[0.98] font-semibold tracking-[-0.045em] text-balance sm:text-6xl lg:text-7xl">
                Building software with craft, clarity, and staying power.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300 sm:text-xl">
                Aether Foundry creates focused products, dependable internal
                platforms, and ambitious digital experiences.
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
              <div className="mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
                {signaturePoints.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-slate-200 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.75)]"
                  >
                    {point}
                  </div>
                ))}
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
                  One foundry. Many possibilities.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">
                We build software that solves concrete problems and remains a
                pleasure to use as the people and businesses around it grow.
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
                  Strong work starts with strong fundamentals.
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
        <p>Aether Foundry. Software built with intent.</p>
      </footer>
    </div>
  );
}
