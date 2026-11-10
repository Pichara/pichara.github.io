import { useEffect } from "react";
import { projects } from "./data";
import { MatrixRain } from "./components/MatrixRain";
import { SiteHeader } from "./components/SiteHeader";
import { Hero } from "./components/Hero";
import { AboutSection } from "./components/AboutSection";
import { SectionHeading } from "./components/SectionHeading";
import { ExperienceTimeline } from "./components/ExperienceTimeline";
import { ProjectCard } from "./components/ProjectCard";
import { ContactSection } from "./components/ContactSection";
import { SiteFooter } from "./components/SiteFooter";

export default function App() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      elements.forEach(element => element.classList.add("reveal-visible"));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });

    elements.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden">
      <MatrixRain />
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="relative z-10">
        <SiteHeader />
        <main id="main" className="mx-auto max-w-[1320px] px-5 sm:px-9 xl:px-12">
          <Hero />
          <AboutSection />

          <section id="experience" className="pb-28 sm:pb-36" data-reveal>
            <SectionHeading
              index="02"
              label="JOURNEY"
              title="Experience that shapes the work."
              description="From building tools for real users to collaboration, learning, and engineering at scale."
            />
            <ExperienceTimeline />
          </section>

          <section id="projects" className="pb-28 sm:pb-36">
            <div data-reveal>
              <SectionHeading
                index="03"
                label="SELECTED WORK"
                title="Things I've built."
                description="A collection of the projects that taught me the most—applications, experiments, and systems that solve real problems."
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:gap-7">
              {projects.map((project, index) => (
                <div data-reveal key={project.name} style={{ transitionDelay: `${Math.min(index % 2, 1) * 90}ms` }}>
                  <ProjectCard project={project} index={index} />
                </div>
              ))}
            </div>
            <div className="mt-9 flex justify-end" data-reveal>
              <a href="https://github.com/Pichara?tab=repositories" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 border-b border-emerald-300/30 pb-2 text-sm text-emerald-100 hover:text-emerald-300">Explore all repositories <span aria-hidden="true">↗</span></a>
            </div>
          </section>

          <ContactSection />
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
