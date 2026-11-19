import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { projects } from "../data";
import { IconArrowUpRight } from "./Icons";
import SectionHeading from "./SectionHeading";

type ProjectLinkProps = {
  internal?: boolean;
  to: string;
  className: string;
  ariaLabel: string;
  children: ReactNode;
};

/**
 * Internal projects (e.g. the Diagram Studio) navigate inside the app in the
 * same tab; every other project links out to GitHub in a new tab.
 */
function ProjectLink({ internal, to, className, ariaLabel, children }: ProjectLinkProps) {
  if (internal) {
    return (
      <Link className={className} to={to} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <a className={className} href={to} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>
      {children}
    </a>
  );
}

export default function Projects() {
  return (
    <section id="projects" className="section container-shell" aria-labelledby="projects-title">
      <SectionHeading
        id="projects-title"
        index="03"
        eyebrow="SELECTED WORK"
        title="Things I've built."
        description="A selection of my current projects—from developer tools to applied AI and useful systems."
      />
      <div className="projects-grid">
        {projects.map((project, index) => (
          <article className="project-card" key={project.name} data-reveal>
            <ProjectLink
              internal={project.internal}
              to={project.link}
              className="project-image-link"
              ariaLabel={project.internal ? "Open Diagram Studio" : `View ${project.name} on GitHub`}
            >
              <img src={project.image} alt="" loading="lazy" decoding="async" />
              <span className="project-image-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            </ProjectLink>
            <div className="project-content">
              <div className="project-title-row">
                <h3>{project.name}</h3>
                <ProjectLink
                  internal={project.internal}
                  to={project.link}
                  className="project-outbound"
                  ariaLabel={project.internal ? "Open Diagram Studio" : `Open ${project.name} repository`}
                >
                  <IconArrowUpRight className="project-outbound-icon" />
                </ProjectLink>
              </div>
              <p>{project.description}</p>
              <div className="project-stack">
                {project.stack.map((technology) => <span key={technology}>{technology}</span>)}
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="more-work" data-reveal>
        <p>More experiments, tools, and learning projects live on GitHub.</p>
        <a href="https://github.com/Pichara?tab=repositories" target="_blank" rel="noopener noreferrer">
          Explore all repositories <IconArrowUpRight className="button-icon" />
        </a>
      </div>
    </section>
  );
}
