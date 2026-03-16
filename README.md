# Rodrigo Pichara Gomes — Personal Site

<div align="center">
  <h2>
    <a href="https://pichara.github.io/">https://pichara.github.io/</a>
  </h2>
</div>

**Overview**
This is a fully static, performance-focused portfolio built with React + TypeScript and bundled with Vite. Styling is done with Tailwind CSS and a custom dark theme. The content is sourced from a single data file so it stays easy to maintain.

**Tech Stack**
- React 18 + TypeScript
- Vite (fast dev + build)
- Tailwind CSS (utility-first styling)
- Formspree (contact form submissions)
- GitHub Actions (CI + Pages deploy)

**Project Structure**
- `src/App.tsx` — main UI layout and sections
- `src/data.ts` — all content (bio, skills, experience, projects)
- `src/index.css` — global styles + theme
- `src/assets/` — images and SVG assets
- `public/` — favicon, OG image, sitemap, robots
- `.github/workflows/pages.yml` — Pages deploy pipeline

**Local Development**
```bash
npm install
npm run dev
```

**Production Build**
```bash
npm run build
npm run preview
```

**Deployment (GitHub Pages)**
Every push to `main` triggers the workflow in `.github/workflows/pages.yml`.

After the workflow finishes, the site updates at:
https://pichara.github.io/
