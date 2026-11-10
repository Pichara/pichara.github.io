import { profile } from "../data";
import { SectionHeading } from "./SectionHeading";

const contactLinks = [
  { title: "GitHub", label: "Explore repositories", href: profile.github },
  { title: "LinkedIn", label: "Professional profile", href: profile.linkedin }
];

export function ContactSection() {
  return (
    <section id="contact" className="pb-24 sm:pb-32" data-reveal>
      <SectionHeading index="04" label="CONTACT" title="Let's make something matter." description="Have an interesting problem, an opportunity, or an idea worth building? I'd love to hear about it." />
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
        <div className="flex flex-col justify-between rounded-[20px] border border-emerald-300/15 bg-emerald-950/20 p-7 backdrop-blur-sm sm:p-10">
          <div>
            <span className="section-kicker">START A CONVERSATION</span>
            <a href={`mailto:${profile.email}`} className="mt-7 block break-all font-display text-[clamp(1.5rem,3vw,2.5rem)] font-medium tracking-[-0.05em] text-paper underline decoration-emerald-400/40 underline-offset-8 transition-colors hover:text-emerald-200">{profile.email}</a>
            <p className="mt-5 text-sm leading-7 text-slate-400">Based in {profile.location}. Open to meaningful software collaborations and opportunities.</p>
          </div>
          <div className="mt-12 border-t border-white/10 pt-6">
            {contactLinks.map(link => (
              <a key={link.title} href={link.href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between border-b border-white/10 py-4 text-sm text-slate-200 transition-colors hover:text-emerald-200">
                <span><strong className="font-medium">{link.title}</strong><span className="ml-3 text-xs text-slate-500">{link.label}</span></span>
                <span aria-hidden="true" className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">↗</span>
              </a>
            ))}
          </div>
        </div>
        <form action="https://formspree.io/f/xzdjjglw" method="POST" className="rounded-[20px] border border-white/10 bg-[#0d1512]/90 p-7 backdrop-blur-md sm:p-10">
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.18em] text-emerald-200/80">Send a message</p>
          <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div className="grid gap-6">
            <label className="block text-xs font-medium text-slate-300">Your name
              <input type="text" name="name" required maxLength={100} autoComplete="name" placeholder="Name" className="form-field" />
            </label>
            <label className="block text-xs font-medium text-slate-300">Email address
              <input type="email" name="email" required maxLength={200} autoComplete="email" placeholder="you@example.com" className="form-field" />
            </label>
            <label className="block text-xs font-medium text-slate-300">Your message
              <textarea name="message" required maxLength={5000} rows={5} placeholder="Tell me what you're working on..." className="form-field resize-y" />
            </label>
          </div>
          <button type="submit" className="mt-8 inline-flex w-full items-center justify-between rounded-full bg-[#b1ebc8] px-6 py-3.5 text-sm font-semibold text-[#092417] transition-colors hover:bg-[#cef6dc]">Send message <span aria-hidden="true">↗</span></button>
          <p className="mt-4 text-[11px] leading-5 text-slate-500">Messages are processed by Formspree, the existing contact-form provider.</p>
        </form>
      </div>
    </section>
  );
}
