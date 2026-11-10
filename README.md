# Rodrigo Pichara Gomes — Portfolio

React + TypeScript + Vite + Tailwind CSS personal developer portfolio, deployed as a static GitHub Pages site.

## Design
Premium dark forest-green design, clean editorial typography, and subtle Matrix digital rain through every section. The animation uses a **single fixed canvas**, bounded column count, reduced frame rate on mobile, capped pixel ratio, hidden-tab pause, and `prefers-reduced-motion` support. No animation libraries or background network calls.

Existing project descriptions, imagery, and GitHub links are stored in `src/data.ts` and intentionally preserved.

## Run locally
Requires Node.js 22+.

```bash
npm ci
npm run dev
```

## Validation
```bash
npm run typecheck
npm test
npm run build
```

The unit tests validate animation geometry, timing limits, featured project preservation, and PR deployment safeguards.

## Project structure
- `src/App.tsx` — page composition and scroll-reveal orchestration
- `src/components/` — independently maintained UI sections, including `MatrixRain.tsx`
- `src/lib/rain.mjs` — deterministic animation math; `rain.d.mts` — TypeScript signatures
- `src/data.ts` — profile, skills, experience, and projects
- `src/index.css` / `tailwind.config.cjs` — theme and global styles
- `tests/` — Node.js unit and integrity tests
- `.github/workflows/pages.yml` — CI and static site deployment

## Deploy
Pull requests run typechecking, tests, and the production Vite build, but **do not deploy**. Merging to `main` triggers the GitHub Pages deployment at https://pichara.github.io/.

## Manual visual QA
Before merging, verify the hero, all six project cards, the contact form, keyboard navigation, and mobile menu on both desktop and mobile. Scroll to the footer to verify that the subtle green rain stays visible behind the page. Enable reduced motion in OS/browser settings and confirm the rain stops moving.
