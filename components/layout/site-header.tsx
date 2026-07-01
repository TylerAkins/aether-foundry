import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="relative z-20 px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] backdrop-blur-xl sm:px-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-xl bg-slate-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-slate-900/10"
          >
            <span className="relative size-4">
              <span className="absolute inset-0 rotate-45 rounded-[0.4rem] bg-gradient-to-br from-sky-400 via-sky-600 to-orange-500" />
              <span className="absolute inset-[0.28rem] rounded-[0.22rem] bg-slate-950" />
            </span>
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-slate-950">
              Aether
              <span className="text-slate-500"> Foundry</span>
            </span>
            <span className="block text-[0.65rem] font-semibold tracking-[0.16em] text-slate-500 uppercase">
              Software studio
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 sm:flex">
          <a
            href="#capabilities"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            What we build
          </a>
          <a
            href="#principles"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Our principles
          </a>
        </nav>
      </div>
    </header>
  );
}
