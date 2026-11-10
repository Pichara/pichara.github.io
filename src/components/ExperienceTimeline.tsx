import { timeline } from "../data";

const typeLabels: Record<string, string> = {
  work: "Professional",
  leadership: "Leadership",
  education: "Education",
  certification: "Certification",
  award: "Recognition"
};

export function ExperienceTimeline() {
  return (
    <ol className="divide-y divide-white/10 border-y border-white/10">
      {timeline.map((item, index) => (
        <li key={`${item.title}-${item.org}`} className="group grid gap-5 py-7 sm:py-8 lg:grid-cols-[80px_minmax(0,1fr)_220px] lg:gap-10">
          <span className="pt-1 font-mono text-xs tracking-widest text-emerald-200/65">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="inline-block size-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200/85">{typeLabels[item.type] ?? item.type}</span>
            </div>
            <h3 className="font-display text-xl font-medium tracking-[-0.035em] text-paper sm:text-2xl">{item.title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-300">{item.org} <span className="font-normal text-slate-500">· {item.location}</span></p>
            <p className="mt-4 max-w-2xl text-[13px] leading-7 text-slate-400">{item.description}</p>
          </div>
          <p className="font-mono text-xs tracking-wide text-slate-500 lg:pt-2 lg:text-right">{item.period}</p>
        </li>
      ))}
    </ol>
  );
}
