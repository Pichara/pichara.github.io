import { projects } from "../data";

type Project = (typeof projects)[number];

export function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <article className="project-card group flex h-full flex-col overflow-hidden rounded-[20px] border border-white/10 bg-[#0d1512]/85 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/35">
      <div className="project-cover relative isolate overflow-hidden border-b border-white/10">
        <img src={project.image} alt="" className="h-52 w-full object-cover opacity-75 saturate-[0.7] transition-transform duration-700 group-hover:scale-[1.04] group-hover:opacity-90 sm:h-60" loading="lazy" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0d1512] via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute left-5 top-5 rounded-lg border border-emerald-200/15 bg-black/55 px-3 py-1.5 font-mono text-[10px] tracking-[0.18em] text-emerald-100 backdrop-blur-lg">{String(index + 1).padStart(2, "0")} / PROJECT</span>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-display text-[22px] font-medium tracking-[-0.035em] text-paper sm:text-[25px]">{project.name}</h3>
          <a href={project.link} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.name} on GitHub`} className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-lg text-emerald-200 transition-colors hover:border-emerald-300/50 hover:bg-emerald-900/25">↗</a>
        </div>
        <p className="mt-3 flex-1 text-[13px] leading-7 text-slate-400">{project.description}</p>
        <div className="mt-7 flex flex-wrap gap-2 border-t border-white/10 pt-5">
          {project.stack.map(technology => <span key={technology} className="rounded-md border border-emerald-200/10 bg-emerald-950/20 px-2.5 py-1.5 font-mono text-[10px] text-emerald-100/80">{technology}</span>)}
        </div>
      </div>
    </article>
  );
}
