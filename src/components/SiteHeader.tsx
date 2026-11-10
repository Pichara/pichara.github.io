import { profile } from "../data";

const links = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Work" },
  { href: "#contact", label: "Contact" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#070b0a]/90 backdrop-blur-2xl">
      <nav aria-label="Main navigation" className="mx-auto flex h-[76px] max-w-[1320px] items-center justify-between gap-6 px-5 sm:px-9 xl:px-12">
        <a href="#home" aria-label={`${profile.shortName}, back to top`} className="group inline-flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-950/60 font-mono text-[13px] font-semibold text-emerald-200 transition-colors group-hover:border-emerald-300/60">RP<span className="text-emerald-400">.</span></span>
          <span className="hidden font-mono text-[12px] font-semibold uppercase tracking-[0.15em] text-slate-200 sm:block">Pichara <span className="font-normal text-slate-500">/ dev</span></span>
        </a>
        <div className="hidden items-center gap-9 lg:flex">
          {links.map(link => <a key={link.href} href={link.href} className="text-[13px] font-medium text-slate-400 transition-colors hover:text-emerald-200">{link.label}</a>)}
        </div>
        <div className="ml-auto flex items-center gap-4 lg:ml-0">
          <a href={profile.github} target="_blank" rel="noopener noreferrer" className="hidden text-[13px] font-medium text-slate-400 transition-colors hover:text-paper sm:inline-flex">GitHub ↗</a>
          <a href="#contact" className="hidden items-center gap-3 rounded-full border border-emerald-400/25 bg-emerald-950/60 px-5 py-2.5 text-[12px] font-semibold text-emerald-100 transition-colors hover:border-emerald-400/60 hover:bg-emerald-900/80 sm:inline-flex">Let's talk <span aria-hidden="true">↗</span></a>
          <details className="group relative lg:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-white/15 px-3 py-2.5 text-xs font-semibold text-paper marker:hidden">Menu <span aria-hidden="true">☰</span></summary>
            <div className="absolute right-0 top-12 z-50 flex min-w-48 flex-col gap-1 rounded-xl border border-white/15 bg-[#101a17] p-2 shadow-2xl">
              {links.map(link => <a key={link.href} href={link.href} onClick={event => event.currentTarget.closest("details")?.removeAttribute("open")} className="rounded-lg px-4 py-3 text-sm text-slate-200 hover:bg-emerald-900/30">{link.label}</a>)}
              <a href={profile.github} target="_blank" rel="noopener noreferrer" className="rounded-lg px-4 py-3 text-sm text-emerald-200 hover:bg-emerald-900/30">GitHub ↗</a>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
