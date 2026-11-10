import { profile, skills } from "../data";
import { SectionHeading } from "./SectionHeading";

const strengths = [
  { label: "Languages", content: skills.languages.join(" · ") },
  { label: "Frameworks", content: skills.frameworks.join(" · ") },
  { label: "Platforms & tools", content: skills.tools.join(" · ") }
];

export function AboutSection() {
  return (
    <section id="about" className="relative pb-28 sm:pb-36" data-reveal>
      <SectionHeading index="01" label="ABOUT" title="The person behind the code." description="Curiosity, careful engineering, and a bias toward making useful things." />
      <div className="grid gap-9 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div className="space-y-6">
          <p className="max-w-2xl font-display text-[clamp(1.45rem,2.5vw,2rem)] font-normal leading-[1.5] tracking-[-0.025em] text-slate-200">{profile.summaryLong}</p>
          <p className="max-w-xl text-sm leading-8 text-slate-400">I care about maintainable systems, thoughtful interfaces, and security that is part of the design—not an afterthought. I learn by building, testing, and improving.</p>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 border-b border-emerald-300/50 pb-2 text-sm font-medium text-emerald-200 transition-colors hover:text-white">More about my journey <span aria-hidden="true">↗</span></a>
        </div>
        <div className="overflow-hidden rounded-[20px] border border-white/10 bg-[#0d1512]/85 px-6 py-2 backdrop-blur-md sm:px-8">
          {strengths.map((strength, index) => (
            <div key={strength.label} className={`py-6 ${index ? "border-t border-white/10" : ""}`}>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">{strength.label}</span>
              <p className="mt-3 text-[13px] leading-7 text-slate-300">{strength.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
