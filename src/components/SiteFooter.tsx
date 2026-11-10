import { profile } from "../data";

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/10 py-8">
      <div className="mx-auto flex max-w-[1320px] flex-col justify-between gap-4 px-5 sm:flex-row sm:items-center sm:px-9 xl:px-12">
        <p className="font-mono text-[11px] tracking-wide text-slate-500">© {new Date().getFullYear()} {profile.name}. Built with intention.</p>
        <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
          <span className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-400" /> All systems go</span>
          <a href="#home" className="text-slate-300 transition-colors hover:text-emerald-200">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
