# Pichara — Engineering Portfolio

React 18 + TypeScript + Tailwind CSS + Vite portfolio with a premium green-on-black interface and full-page **Matrix digital rain**.

## Design
- High-intensity animated green code rain, fixed to the viewport so it stays visible throughout the entire page.
- Canvas rendering capped to ~30 fps desktop / ~20 fps on mobile, with reduced-motion support and a Rain ON/OFF toggle.
- Clean, responsive hero, skills, experience timeline, project cards, and contact section.
- All original project selections remain in `src/data.ts`.
- Verified Delta Elevator IS Programmer/full-stack co-op entry in experience. See public LinkedIn profile/post: https://www.linkedin.com/in/rodrigo-pichara-gomes-a6202a27b/

## Development
```bash
npm ci
npm run dev
npm run check   # TypeScript + animation unit tests
npm run build
```

## Structure
- `src/App.tsx` — page composition, reveal lifecycle and rain toggle.
- `src/components/` — reusable site sections and accessible Matrix canvas.
- `src/effects/matrix-core.mjs` — independent, testable rain model.
- `src/data.ts` — profile, experience, project selections, skills.
- `src/index.css` — global design system and responsive styling.
- `tests/` — Node built-in test runner, no new test dependencies.

## Deploy
A PR triggers typechecking, tests, and a Vite build without deploying. Merging into `main` triggers the same checks and GitHub Pages deployment through `.github/workflows/pages.yml`.

The contact form uses the existing Formspree endpoint. For production, verify the endpoint in Formspree and test a real submission.
