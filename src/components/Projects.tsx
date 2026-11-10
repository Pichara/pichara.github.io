import { projects } from "../data";
import { IconArrowUpRight } from "./Icons";
import SectionHeading from "./SectionHeading";

export default function Projects() {
  return (
    <section id="projects" className="section container-shell" aria-labelledby="projects-title">
      <SectionHeading
        index="03"
        eyebrow="SELECTED WORK"
        title="Things I've built."
        description="A selection of my current projects—from developer tools to applied AI and useful systems."
      />
      <div className="projects-grid">
        {projects.map((project, index) => (
          <article className="project-card" key={project.name} data-reveal>
            <a
              className="project-image-link"
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${project.name} on GitHub`}
            >
              <img src={project.image} alt="" loading="lazy" decoding="async" />
              <span className="project-image-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            </a>
            <div className="project-content">
              <div className="project-title-row">
                <h3>{project.name}</h3>
                <a className="project-outbound" href={project.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${project.name} repository`}>
                  <IconArrowUpRight className="project-outbound-icon" />
                </a>
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
