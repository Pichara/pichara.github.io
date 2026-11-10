import { useEffect, useState } from "react";
import { profile } from "./data";
import MatrixRain from "./components/MatrixRain";
import SiteHeader from "./components/SiteHeader";
import Hero from "./components/Hero";
import About from "./components/About";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Contact from "./components/Contact";

export default function App() {
  const [rainEnabled, setRainEnabled] = useState(() =>
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (!("IntersectionObserver" in window) ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px 20px 0px" }
    );

    nodes.forEach((node) => observer.observe(node));
    document.documentElement.classList.add("motion-ready");

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);

  return (
    <div className="site-root">
      <MatrixRain enabled={rainEnabled} />
      <div className="matrix-vignette" aria-hidden="true" />
      <div className="site-content">
        <a href="#main" className="skip-link">Skip to content</a>
        <SiteHeader rainEnabled={rainEnabled} onToggleRain={() => setRainEnabled((enabled) => !enabled)} />
        <main id="main">
          <Hero />
          <div className="content-sections">
            <About />
            <Experience />
            <Projects />
            <Contact />
          </div>
        </main>
        <footer className="site-footer">
          <div className="container-shell footer-inner">
            <span>© {new Date().getFullYear()} {profile.name}</span>
            <span>Designed and built with care. <span className="accent">{"</>"}</span></span>
            <a href="#home">Back to top ↑</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
