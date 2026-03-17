import { useEffect } from "react";
import { profile, projects, skills, stats, timeline } from "./data";

const navLinks = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "contact", label: "Contact" }
];

const IconGithub = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.55 2.87 8.4 6.84 9.76.5.1.68-.22.68-.48 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.36-3.37-1.36-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.13-4.56-5.03 0-1.11.39-2.02 1.03-2.73-.1-.26-.45-1.32.1-2.74 0 0 .84-.27 2.75 1.04.8-.23 1.66-.34 2.51-.34.85 0 1.71.12 2.51.34 1.91-1.31 2.75-1.04 2.75-1.04.55 1.42.2 2.48.1 2.74.64.71 1.03 1.62 1.03 2.73 0 3.91-2.34 4.77-4.57 5.02.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .26.18.58.69.48C19.14 20.66 22 16.8 22 12.26 22 6.58 17.52 2 12 2z" />
  </svg>
);

const IconLinkedIn = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M20.45 20.45h-3.55v-5.48c0-1.31-.02-3-1.83-3-1.84 0-2.12 1.43-2.12 2.9v5.58H9.4V9h3.41v1.56h.05c.48-.9 1.64-1.84 3.37-1.84 3.6 0 4.27 2.38 4.27 5.47v6.26zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm1.78 13.02H3.56V9h3.56v11.45z" />
  </svg>
);

const IconMail = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.2l8 5.33 8-5.33V6H4zm16 12V8.47l-7.47 4.98a1 1 0 0 1-1.06 0L4 8.47V18h16z" />
  </svg>
);

export default function App() {
  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative z-10 text-sand">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold text-sand shadow-glow">
              RP
            </div>
            <div>
              <p className="font-display text-lg font-semibold leading-tight">
                {profile.shortName}
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-mist/60">
                {profile.role}
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-mist/70 md:flex" aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.id} href={`#${link.id}`} className="transition hover:text-sand">
                {link.label}
              </a>
            ))}
          </nav>
          <a
            href="#contact"
            className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-sand shadow-glow transition hover:-translate-y-0.5"
          >
            Let's Talk
          </a>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl px-6 pb-20">
        <section id="home" className="grid gap-12 pb-16 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8" data-reveal>
            <span className="pill">Building secure, scalable products</span>
            <div className="space-y-5">
              <h1 className="font-display text-[clamp(1.4rem,4.5vw,3.75rem)] font-semibold tracking-tight whitespace-nowrap">
                {profile.name}
              </h1>
              <p className="text-lg text-mist/80 md:text-xl">{profile.tagline}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#projects"
                className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-sand shadow-glow transition hover:-translate-y-0.5"
              >
                View Projects
              </a>
              <a
                href="#contact"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-sand transition hover:-translate-y-0.5"
              >
                Contact Me
              </a>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="card p-5">
                  <p className="text-2xl font-semibold text-sand">{stat.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-mist/60">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6" data-reveal>
            <div className="card p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-mist/60">
                Quick Snapshot
              </p>
              <p className="mt-4 text-lg font-semibold text-sand">{profile.role}</p>
              <p className="mt-3 text-sm text-mist/80">{profile.summaryShort}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {profile.languages.map((language) => (
                  <span key={language} className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-sand">
                    {language}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-mist/60">Location</p>
                <p className="mt-3 text-lg font-semibold text-sand">{profile.location}</p>
                <p className="mt-2 text-sm text-mist/80">Open to global remote collaboration.</p>
              </div>
              <div className="card p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-mist/60">Focus</p>
                <p className="mt-3 text-lg font-semibold text-sand">Backend, AI, Security</p>
                <p className="mt-2 text-sm text-mist/80">
                  Passionate about resilient systems and practical automation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="pb-16" data-reveal>
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl space-y-4">
              <p className="pill">About</p>
              <h2 className="section-title">Intentional engineering with a security mindset.</h2>
              <p className="section-subtitle">{profile.summaryLong}</p>
            </div>
          <div className="card w-full p-8 lg:max-w-md">
              <p className="text-xs uppercase tracking-[0.2em] text-mist/60">Core strengths</p>
              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-sand">Languages</p>
                  <p className="mt-2 text-sm text-mist/80">{skills.languages.join(" · ")}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-sand">Frameworks & Libraries</p>
                  <p className="mt-2 text-sm text-mist/80">{skills.frameworks.join(" · ")}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-sand">Tools & Platforms</p>
                  <p className="mt-2 text-sm text-mist/80">{skills.tools.join(" · ")}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-sand">Areas of Interest</p>
                  <p className="mt-2 text-sm text-mist/80">{skills.interests.join(" · ")}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="pb-16" data-reveal>
          <div className="flex flex-col gap-4">
            <p className="pill">Experience</p>
            <h2 className="section-title">Leadership, engineering, and continuous learning.</h2>
            <p className="section-subtitle">
              A timeline of roles, studies, and certifications that shape Rodrigo's approach to building secure,
              people-first software.
            </p>
          </div>
          <div className="mt-10 space-y-6">
            {timeline.map((item) => (
              <div key={item.title} className="card flex flex-col gap-4 p-6 md:flex-row md:items-start">
                <div className="flex-shrink-0">
                  <span className="rounded-full bg-coral px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-night">
                    {item.type}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-sand">{item.title}</h3>
                    <span className="text-sm font-semibold text-mist/60">{item.period}</span>
                  </div>
                  <p className="text-sm font-semibold text-mist/80">
                    {item.org} · {item.location}
                  </p>
                  <p className="mt-3 text-sm text-mist/80">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="projects" className="pb-16" data-reveal>
          <div className="flex flex-col gap-4">
            <p className="pill">Projects</p>
            <h2 className="section-title">Selected builds and experiments.</h2>
            <p className="section-subtitle">
              Product-focused work spanning offline-ready tools, automation pipelines, and applied AI.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <article key={project.name} className="card overflow-hidden">
                <img src={project.image} alt="" className="h-44 w-full object-cover" loading="lazy" />
                <div className="space-y-4 p-6">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold text-sand">{project.name}</h3>
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold uppercase tracking-[0.2em] text-ocean"
                    >
                      Repository
                    </a>
                  </div>
                  <p className="text-sm text-mist/80">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.stack.map((item) => (
                      <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-sand">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="pb-8" data-reveal>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <p className="pill">Contact</p>
              <h2 className="section-title">Let's build something resilient together.</h2>
              <p className="section-subtitle">
                Reach out for internship, co-op, or full-time opportunities in the Waterloo region or remote roles.
                Messages go straight to Rodrigo's inbox.
              </p>
              <div className="mt-8 space-y-4">
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-3 text-sm font-semibold text-sand"
                >
                  <IconMail className="h-5 w-5" />
                  {profile.email}
                </a>
                <a
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm font-semibold text-sand"
                >
                  <IconGithub className="h-5 w-5" />
                  GitHub
                </a>
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 text-sm font-semibold text-sand"
                >
                  <IconLinkedIn className="h-5 w-5" />
                  LinkedIn
                </a>
              </div>
            </div>
            <form
              className="card space-y-4 p-8"
              action="https://formspree.io/f/xzdjjglw"
              method="POST"
            >
              <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-mist/60" htmlFor="name">
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-sand placeholder:text-mist/60 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-mist/60" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-sand placeholder:text-mist/60 focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-mist/60" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-sand placeholder:text-mist/60 focus:border-gold focus:outline-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full rounded-full bg-gold px-6 py-3 text-sm font-semibold text-sand shadow-glow transition hover:-translate-y-0.5"
              >
                Send Message
              </button>
              <p className="text-xs text-mist/60">
                This form uses Formspree. Replace the endpoint with your live form ID.
              </p>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-white/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-mist/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {profile.name}. All rights reserved.</p>
          <p className="font-mono">Built with React, Vite, and Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}
