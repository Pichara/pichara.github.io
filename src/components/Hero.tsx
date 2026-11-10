import { profile } from "../data";
import { IconGithub, IconLinkedIn, IconArrowUpRight } from "./Icons";

export default function Hero() {
  return (
    <section id="home" className="hero container-shell" aria-labelledby="hero-title">
      <div className="hero-content" data-reveal>
        <p className="status-line">
          <span className="status-dot" aria-hidden="true" />
          SOFTWARE ENGINEERING · WATERLOO, CANADA
        </p>
        <p className="hero-intro">Hi, I'm {profile.name.split(" ")[0]}.</p>
        <h1 id="hero-title" className="hero-title">
          I build software<br />
          that <span>makes a difference.</span>
        </h1>
        <p className="hero-description">
          Full-stack developer focused on practical systems, secure engineering,
          and turning complicated problems into software people can rely on.
        </p>
        <div className="hero-cta">
          <a href="#projects" className="button button-primary">
            Explore my work <IconArrowUpRight className="button-icon" />
          </a>
          <a href="#contact" className="button button-ghost">Get in touch <span aria-hidden="true">→</span></a>
        </div>
        <div className="hero-social">
          <span className="social-label">FIND ME ON</span>
          <a href={profile.github} target="_blank" rel="noopener noreferrer"><IconGithub className="social-icon" /> GitHub</a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"><IconLinkedIn className="social-icon" /> LinkedIn</a>
        </div>
      </div>
      <div className="terminal-frame" data-reveal aria-label="Development focus">
        <div className="terminal-top">
          <div className="terminal-lights" aria-hidden="true"><span /><span /><span /></div>
          <span>~/pichara/portfolio</span>
          <span className="terminal-status"><span aria-hidden="true">●</span> online</span>
        </div>
        <div className="terminal-body">
          <p><span className="terminal-prompt">➜</span> <span className="terminal-command">whoami</span></p>
          <p className="terminal-result">{profile.name}</p>
          <p className="terminal-gap"><span className="terminal-prompt">➜</span> <span className="terminal-command">cat focus.json</span></p>
          <div className="terminal-code" aria-hidden="true">
            <div><span className="syntax-bracket">{"{"}</span></div>
            <div>&nbsp;&nbsp;<span className="syntax-key">"role"</span>: <span className="syntax-value">"Software Developer"</span>,</div>
            <div>&nbsp;&nbsp;<span className="syntax-key">"stack"</span>: [<span className="syntax-value">"C#"</span>, <span className="syntax-value">"Python"</span>, <span className="syntax-value">"React"</span>],</div>
            <div>&nbsp;&nbsp;<span className="syntax-key">"interests"</span>: [</div>
            <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="syntax-value">"Security"</span>, <span className="syntax-value">"AI"</span>, <span className="syntax-value">"Systems"</span></div>
            <div>&nbsp;&nbsp;]</div>
            <div><span className="syntax-bracket">{"}"}</span></div>
          </div>
          <p className="terminal-gap"><span className="terminal-prompt">➜</span> <span className="terminal-cursor" aria-hidden="true">▍</span></p>
        </div>
        <div className="terminal-footer">
          <span><span className="terminal-footer-dot" /> BUILD. BREAK. LEARN. REPEAT.</span>
          <span>v2026.11</span>
        </div>
      </div>
      <div className="hero-scroll" aria-hidden="true"><span className="scroll-rule" /> SCROLL TO EXPLORE</div>
    </section>
  );
}
