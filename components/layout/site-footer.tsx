export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 px-6 py-8 text-sm text-slate-600">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© {currentYear} Aether Foundry</p>
        <p>Software products, internal tools, games, and experiments.</p>
      </div>
    </footer>
  );
}
