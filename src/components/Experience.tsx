import { timeline } from "../data";
import SectionHeading from "./SectionHeading";

export default function Experience() {
  return (
    <section id="experience" className="section container-shell" aria-labelledby="experience-title">
      <SectionHeading
        index="02"
        eyebrow="THE JOURNEY"
        title="Real work. Real learning."
        description="From production software to community leadership and hands-on projects."
      />
      <div className="experience-list" data-reveal>
        {timeline.map((item) => (
          <article className="experience-item" key={`${item.org}-${item.title}`}>
            <div className="experience-date">{item.period}</div>
            <div className="experience-rail" aria-hidden="true"><span /></div>
            <div className="experience-content">
              <span className="experience-type">{item.type}</span>
              <h3>{item.title}</h3>
              <p className="experience-org">{item.org} <span aria-hidden="true">·</span> {item.location}</p>
              <p className="experience-desc">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
      <a className="section-outbound" href="https://www.linkedin.com/in/rodrigo-pichara-gomes-a6202a27b/" target="_blank" rel="noopener noreferrer">
        See more on LinkedIn <span aria-hidden="true">↗</span>
      </a>
    </section>
  );
}
