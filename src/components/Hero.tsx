import { profile } from "../data";

const coreTools = ["C# / .NET", "Python", "React", "Security"];

export function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden pb-20 pt-24 sm:pb-28 sm:pt-32 lg:min-h-[720px] lg:pb-36 lg:pt-40">
      <div className="hero-halo pointer-events-none absolute -right-28 top-0 -z-10 size-[580px] rounded-full" aria-hidden="true" />
      <div className="grid items-center gap-16 lg:grid-cols-[1.25fr_0.75fr] lg:gap-14">
        <div className="relative">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-emerald-400/20 bg-emerald-950/25 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200/90">
            <span className="status-dot size-1.5 rounded-full bg-emerald-400" />
            Software engineering · Waterloo, Canada
          </div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Hi, I'm Rodrigo Pichara.</p>
          <h1 className="max-w-[780px] font-display text-[clamp(3.2rem,7.2vw,7.3rem)] font-medium leading-[0.99] tracking-[-0.072em] text-paper">
            Building software
            <span className="block text-emerald-300/95">with purpose<span className="text-emerald-600">.</span></span>
          </h1>
          <p className="mt-8 max-w-[600px] text-[15px] leading-8 text-slate-300 sm:text-lg">{profile.tagline}</p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href="#projects" className="group inline-flex items-center justify-center gap-5 rounded-full bg-[#b1ebc8] px-7 py-3.5 text-sm font-semibold text-[#092417] transition-all hover:-translate-y-0.5 hover:bg-[#cef6dc]">Explore projects <span className="transition-transform group-hover:translate-x-1">↗</span></a>
            <a href="#contact" className="inline-flex items-center justify-center gap-3 rounded-full border border-white/20 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-paper transition-colors hover:border-white/40 hover:bg-white/10">Get in touch <span>↗</span></a>
          </div>
          <div className="mt-14 flex flex-wrap items-center gap-x-7 gap-y-4 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            <span>01 / Full-stack</span><span>02 / Security-minded</span><span>03 / Always building</span>
          </div>
        </div>
        <div className="relative hidden lg:block" aria-label="Developer focus preview">
          <div className="absolute -inset-8 rounded-full bg-emerald-800/10 blur-[78px]" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/15 bg-[#0c1512]/85 shadow-[0_30px_100px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-1.5" aria-hidden="true"><span className="size-2 rounded-full bg-emerald-300/40" /><span className="size-2 rounded-full bg-white/20" /><span className="size-2 rounded-full bg-white/10" /></div>
              <span className="font-mono text-[11px] tracking-wider text-slate-500">developer.config.ts</span>
              <span className="font-mono text-[10px] text-emerald-300/75">● ACTIVE</span>
            </div>
            <div className="space-y-1.5 px-6 py-9 font-mono text-[13px] leading-7">
              <p><span className="text-slate-600">01</span> <span className="text-violet-300/80">const</span> <span className="text-paper">engineer</span> = {"{"}</p>
              <p className="pl-6"><span className="text-slate-600">02</span> <span className="text-emerald-300">name</span>: <span className="text-amber-100/85">"Pichara"</span>,</p>
              <p className="pl-6"><span className="text-slate-600">03</span> <span className="text-emerald-300">focus</span>: [</p>
              <p className="pl-12"><span className="text-slate-600">04</span> <span className="text-amber-100/85">"Software engineering"</span>,</p>
              <p className="pl-12"><span className="text-slate-600">05</span> <span className="text-amber-100/85">"Security"</span>,</p>
              <p className="pl-12"><span className="text-slate-600">06</span> <span className="text-amber-100/85">"Automation"</span></p>
              <p className="pl-6"><span className="text-slate-600">07</span> ],</p>
              <p className="pl-6"><span className="text-slate-600">08</span> <span className="text-emerald-300">mindset</span>: <span className="text-amber-100/85">"keep shipping"</span></p>
              <p><span className="text-slate-600">09</span> {"};"}</p>
              <p className="pt-4 text-emerald-300/80"><span className="text-slate-600">10</span> <span>▍</span> ready to build...</p>
            </div>
            <div className="border-t border-white/10 bg-emerald-950/15 px-6 py-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.17em] text-slate-500">Core toolkit</p>
              <div className="flex flex-wrap gap-2">{coreTools.map(tool => <span key={tool} className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1.5 font-mono text-[10px] text-slate-300">{tool}</span>)}</div>
            </div>
          </div>
          <span className="absolute -bottom-5 -left-5 rounded-lg border border-emerald-300/20 bg-[#11271b]/90 px-4 py-2.5 font-mono text-[10px] tracking-[0.12em] text-emerald-200 shadow-xl">BUILD / TEST / IMPROVE</span>
        </div>
      </div>
    </section>
  );
}
