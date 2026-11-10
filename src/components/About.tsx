import { profile, skills } from "../data";
import SectionHeading from "./SectionHeading";

export default function About() {
  const groups = [
    { title: "Languages", values: skills.languages },
    { title: "Frameworks & libraries", values: skills.frameworks },
    { title: "Tools & platforms", values: skills.tools },
    { title: "Areas of interest", values: skills.interests },
  ];

  return (
    <section id="about" className="section container-shell" aria-labelledby="about-title">
      <SectionHeading
        id="about-title"
        index="01"
        eyebrow="ABOUT ME"
        title="Engineering with curiosity. Building with purpose."
        description="I care about the details you don't always see—and the impact you do."
      />
      <div className="about-grid" data-reveal>
        <div className="about-copy">
          <p className="lead-copy">{profile.summaryShort}</p>
          <p>{profile.summaryLong}</p>
          <div className="about-principles">
            <div><span className="principle-index">01</span><span>Thoughtful architecture</span></div>
            <div><span className="principle-index">02</span><span>Secure by design</span></div>
            <div><span className="principle-index">03</span><span>Continuous learning</span></div>
          </div>
        </div>
        <div className="skills-panel">
          <div className="panel-kicker"><span className="panel-light" /> ENGINEERING TOOLKIT</div>
          {groups.map((group) => (
            <div key={group.title} className="skill-group">
              <h3>{group.title}</h3>
              <div className="skill-tags">
                {group.values.map((value) => <span key={value} className="skill-tag">{value}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
