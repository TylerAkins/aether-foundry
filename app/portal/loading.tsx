export default function PortalLoading() {
  return (
    <main className="px-4 py-8 sm:px-6 lg:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6" aria-busy="true">
        <div className="grid gap-2">
          <div className="h-4 w-24 rounded-lg bg-slate-200" />
          <div className="h-9 w-full max-w-sm rounded-lg bg-slate-200" />
          <div className="h-4 w-full max-w-xl rounded-lg bg-slate-200" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
          <div className="h-64 rounded-lg border border-slate-200 bg-white" />
          <div className="h-64 rounded-lg border border-slate-200 bg-white" />
        </div>
      </div>
    </main>
  );
}
