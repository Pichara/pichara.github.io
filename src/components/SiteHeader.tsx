import { useState } from "react";
import { profile } from "../data";

const links = [
  { href: "#about", label: "About" },
  { href: "#experience", label: "Experience" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

type Props = {
  rainEnabled: boolean;
  onToggleRain: () => void;
};

export default function SiteHeader({ rainEnabled, onToggleRain }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container-shell header-inner">
        <a href="#home" className="wordmark" aria-label={profile.name + " — Home"}>
          <span className="wordmark-icon" aria-hidden="true">&lt;/&gt;</span>
          <span>PICHARA<span className="accent">.</span>DEV</span>
        </a>
        <nav className={`site-nav ${menuOpen ? "is-open" : ""}`} id="primary-navigation" aria-label="Primary">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          <button type="button" className="rain-toggle" aria-pressed={rainEnabled} onClick={onToggleRain} title="Toggle Matrix rain animation">
            <span className={`indicator ${rainEnabled ? "on" : ""}`} aria-hidden="true" />
            Rain {rainEnabled ? "ON" : "OFF"}
          </button>
        </nav>
        <div className="header-actions">
          <a className="button button-small button-primary header-contact" href="#contact">Let's talk <span aria-hidden="true">↗</span></a>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-controls="primary-navigation"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
