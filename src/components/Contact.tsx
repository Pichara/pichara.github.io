import { profile } from "../data";
import { IconGithub, IconLinkedIn, IconMail, IconArrowUpRight } from "./Icons";
import SectionHeading from "./SectionHeading";

export default function Contact() {
  return (
    <section id="contact" className="section section-contact container-shell" aria-labelledby="contact-title">
      <SectionHeading index="04" eyebrow="CONNECT" title="Let's build something meaningful."
        description="Have a project, opportunity, or interesting engineering challenge? I'd love to hear about it." />
      <div className="contact-grid" data-reveal>
        <div className="contact-aside">
          <p className="contact-intro">Good software starts with a conversation.</p>
          <a className="contact-email" href={`mailto:${profile.email}`}>
            {profile.email} <IconArrowUpRight className="button-icon" />
          </a>
          <div className="contact-links">
            <a href={profile.github} target="_blank" rel="noopener noreferrer"><IconGithub className="social-icon" /> GitHub ↗</a>
            <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"><IconLinkedIn className="social-icon" /> LinkedIn ↗</a>
          </div>
        </div>
        <form className="contact-form" action="https://formspree.io/f/xzdjjglw" method="POST">
          <div className="form-topline"><IconMail className="form-icon" /><span>SEND A MESSAGE</span></div>
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div className="form-two-col">
            <label>Your name<input name="name" type="text" autoComplete="name" required placeholder="Jane Doe" /></label>
            <label>Your email<input name="email" type="email" autoComplete="email" required placeholder="jane@company.com" /></label>
          </div>
          <label>What are you working on?
            <textarea name="message" required rows={5} placeholder="Tell me about your idea..." />
          </label>
          <button className="button button-primary form-submit" type="submit">
            Send message <IconArrowUpRight className="button-icon" />
          </button>
          <p className="form-note">Messages are submitted securely through Formspree.</p>
        </form>
      </div>
    </section>
  );
}
