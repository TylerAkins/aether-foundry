import type { Metadata } from "next";
import { FlaskConical, Gamepad2, Map } from "lucide-react";

import { SiteShell } from "@/components/layout/site-shell";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Games Roadmap | Aether Foundry",
  description:
    "Aether Foundry game work is currently a roadmap and exploration area, with no fabricated releases or launch claims.",
};

const roadmapItems = [
  {
    title: "Roadmap only",
    description:
      "The games page describes planned exploration rather than released projects.",
    icon: Map,
  },
  {
    title: "Prototype-minded",
    description:
      "Game ideas may begin as small experiments that prove mechanics, tooling, or technical direction.",
    icon: FlaskConical,
  },
  {
    title: "No release claims",
    description:
      "Aether Foundry will only present shipped games after there is a real release to show.",
    icon: Gamepad2,
  },
] as const;

export default function GamesPage() {
  return (
    <SiteShell>
      <section className="border-b border-slate-200 bg-white px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-sm font-bold text-brand-blue-deep uppercase">
            Games
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl leading-tight font-semibold text-slate-950 sm:text-6xl">
            Game work is planned as a roadmap and exploration area.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600">
            Aether Foundry has room for games, prototypes, and technical
            experiments. This page communicates the current roadmap status
            without implying released games or public launch dates.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto w-full max-w-7xl">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-sm font-bold text-brand-blue-deep uppercase">
                Current state
              </p>
              <h2 className="mt-4 text-4xl font-semibold text-slate-950 sm:text-5xl">
                Planned, not launched.
              </h2>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-slate-600 lg:justify-self-end">
              The right first step is honest roadmap language: no invented
              game titles, no fake screenshots, and no fabricated release
              timeline.
            </p>
          </div>

          <ul role="list" className="mt-12 grid gap-5 lg:grid-cols-3">
            {roadmapItems.map(({ title, description, icon: Icon }) => (
              <li key={title}>
                <Card className="h-full gap-0 rounded-lg border-0 bg-white py-0 ring-1 ring-slate-200/80">
                  <CardContent className="p-7 sm:p-8">
                    <span className="flex size-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
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
    </SiteShell>
  );
}
