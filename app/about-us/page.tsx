import type { Metadata } from "next";
import { Layers, LockKeyhole, Sparkles, Wrench } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About Us | Aether Foundry",
  description:
    "Learn about Aether Foundry's mission and engineering philosophy: simplicity, security, maintainability, scalability, and user experience.",
};

const philosophy = [
  {
    title: "Simplicity",
    description:
      "Prefer clear decisions and readable systems over clever complexity.",
    icon: Sparkles,
  },
  {
    title: "Security",
    description:
      "Treat security as part of product design, implementation, and operations.",
    icon: LockKeyhole,
  },
  {
    title: "Maintainability",
    description:
      "Build software that can be understood, changed, and operated over time.",
    icon: Wrench,
  },
  {
    title: "Scalability",
    description:
      "Choose foundations that can grow without making the first version heavy.",
    icon: Layers,
  },
] as const;

export default function AboutUsPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-sm font-bold text-brand-blue-deep uppercase">
            About Us
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl leading-tight font-semibold text-slate-950 sm:text-6xl">
            Aether Foundry builds durable software with disciplined engineering.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Aether Foundry is the parent software company for products, internal
            tools, and technical experiments. The company mission is to build
            useful systems that stay clear, secure, maintainable, and pleasant
            to use.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <p className="text-sm font-bold text-brand-blue-deep uppercase">
                Engineering philosophy
              </p>
              <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl">
                Practical foundations before scale.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">
              The work starts with a simple rule: build the smallest useful
              version well, then let real needs guide the next layer.
            </p>
          </div>

          <ul role="list" className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {philosophy.map(({ title, description, icon: Icon }) => (
              <li key={title}>
                <Card className="h-full gap-0 rounded-lg border-0 bg-white py-0 ring-1 ring-slate-200/80">
                  <CardContent className="p-7">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-7 text-xl font-semibold text-slate-950">
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

      <section className="px-4 pb-6 sm:px-6 sm:pb-8">
        <div className="mx-auto w-full max-w-7xl rounded-lg border border-slate-200 bg-white p-7 sm:p-10">
          <p className="text-sm font-bold text-brand-orange uppercase">
            User experience
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold text-slate-950">
            Good software should feel understandable before it feels impressive.
          </h2>
          <p className="mt-4 max-w-3xl leading-7 text-slate-600">
            Aether Foundry values interfaces and systems that help people do
            real work with less confusion, fewer hidden assumptions, and clearer
            paths through important decisions.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
