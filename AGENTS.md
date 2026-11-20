# AGENTS.md — Pichara.io Project Knowledge

> **Primary instruction document for all AI coding agents working on this repository.**
> Read this file in full before making any changes. Follow every rule.

---

## 1. Project Identity

### Pichara.io

[Pichara.io](https://pichara.github.io/) is Rodrigo Pichara Gomes' personal portfolio website — a React 18 single-page application hosted on GitHub Pages. It features a dark green-on-black theme with a Matrix digital rain animation, sections for About, Experience, Projects, and Contact, and a Formspree-powered contact form.

### Pichara Diagram Studio

Pichara Diagram Studio is a professional, browser-based diagram editor embedded as a feature module within the Pichara.io website. It is inspired by Lucidchart, diagrams.net (draw.io), and similar visual modeling tools.

**Key facts:**

- It is part of the existing static website — not a separate application.
- It runs entirely in the browser — no backend, no API, no database, no authentication.
- Persistence is local: LocalStorage, JSON export/import, SVG/PNG export.
- It must remain compatible with GitHub Pages static hosting.
- All diagram editor source code lives under `src/PicharaStudio/`.

**Supported diagram types (planned):**

- Flowcharts
- Software architecture diagrams
- UML diagrams (class, sequence, etc.)
- Database diagrams (ERD)
- Infrastructure diagrams
- System design diagrams
- General-purpose visual diagrams

---

## 2. Architecture

### Application Structure

```
pichara.github.io/
├── src/
│   ├── App.tsx                    # Portfolio root component
│   ├── main.tsx                   # React entry point
│   ├── data.ts                    # Portfolio data (profile, projects, timeline)
│   ├── index.css                  # Global design system
│   ├── components/                # Portfolio site sections
│   ├── effects/                   # Matrix rain animation engine
│   ├── assets/                    # Portfolio images and SVGs
│   └── PicharaStudio/            # ← Diagram Studio feature module
│       ├── types/                 # Domain model type definitions
│       ├── constants/             # Default values and configuration
│       ├── components/            # UI components (canvas, toolbar, sidebar, panels)
│       ├── nodes/                 # Custom React Flow node types
│       ├── edges/                 # Custom React Flow edge types
│       ├── hooks/                 # React hooks for editor logic
│       ├── stores/                # Zustand state management
│       ├── services/              # Export/import services
│       └── utils/                 # Pure utility functions
├── docs/
│   ├── architecture/              # Architecture documentation
│   ├── decisions/                 # Architecture Decision Records (ADRs)
│   └── MANUAL_QA.md               # Manual QA checklist
├── tests/                         # Unit tests (Node built-in test runner)
└── public/                        # Static assets served at root
```

### Feature Module Boundaries

The diagram editor is a **self-contained feature module** under `src/PicharaStudio/`. It:

- Has its own component tree, state management, types, and services.
- Does **not** import from portfolio components (`src/components/`).
- Does **not** modify portfolio data (`src/data.ts`).
- Is integrated via routing — the portfolio renders at `/` and the editor at `/diagram`.

### Responsibilities by Directory

| Directory | Responsibility |
|---|---|
| `types/` | TypeScript interfaces and type aliases for the domain model (Diagram, Node, Edge, Viewport, Metadata). No runtime code. |
| `constants/` | Default values, enum-like constants, and static configuration. |
| `components/` | React components organized by area: `canvas/`, `toolbar/`, `sidebar/`, `panels/`, `dialogs/`. |
| `nodes/` | Custom React Flow node type components, organized by category (`base/`, `shapes/`, `architecture/`, `uml/`, `database/`). |
| `edges/` | Custom React Flow edge type components. |
| `hooks/` | React hooks encapsulating editor interactions, keyboard shortcuts, undo/redo, and diagram operations. |
| `stores/` | Zustand stores for editor state: diagram data, selection, viewport, UI panels, history (undo/redo). |
| `services/` | Stateless logic for export (JSON, SVG, PNG), import (JSON), and template loading. No React dependencies. |
| `utils/` | Pure utility functions (ID generation, geometry math, serialization helpers). No React or store dependencies. |

### State Management Conventions

- Use **Zustand** for all editor state.
- Keep stores small and focused: separate stores for diagram data, UI state, and history.
- State must be **serializable** — no functions, class instances, or DOM references in diagram state.
- Derive computed values with selectors, not redundant state.
- Never mutate state directly. Use Zustand's `set` with the immer middleware when updates are complex.

### Component Organization

- One component per file. File name matches component name in PascalCase.
- Co-locate component-specific styles, types, and sub-components in the same directory.
- Keep components focused: a component either renders UI **or** manages state, not both.
- Use hooks to extract complex logic from components.

### Domain Model Conventions

- All domain types are defined in `src/PicharaStudio/types/`.
- Types must be compatible with JSON serialization (no `Date` objects, no functions, no circular references).
- Use `string` for timestamps (ISO 8601 format).
- Use `string` for all identifiers (use `crypto.randomUUID()` or a utility for generation).
- Extend React Flow types through the `data` generic parameter, never by modifying React Flow internals.

---

## 3. Technology Stack

### Actual Versions (from `package.json`)

| Technology | Version | Purpose |
|---|---|---|
| React | ^18.3.1 | UI framework |
| React DOM | ^18.3.1 | React browser rendering |
| TypeScript | ^5.5.4 | Type-safe application logic |
| Vite | ^5.4.2 | Build system and dev server |
| Tailwind CSS | ^3.4.7 | Utility-first CSS |
| PostCSS | ^8.4.41 | CSS processing |
| Autoprefixer | ^10.4.20 | CSS vendor prefixing |
| @vitejs/plugin-react | ^4.3.1 | Vite React support |

### Planned Additions for Diagram Studio

| Technology | Purpose | Status |
|---|---|---|
| @xyflow/react (React Flow) | Diagram canvas rendering engine | Installed (Milestone 1) — `^13.0.2` |
| zustand | Lightweight state management for editor | Installed (Milestone 1) — `^5.1.0` |
| react-router-dom | Client-side routing (portfolio `/` + editor `/diagram`) | Installed (Milestone 1) — `^7.18.6` |
| lucide-react | Icon library for toolbar and UI | To be evaluated |
| elkjs | Automatic graph layout algorithms | To be evaluated when needed |
| html-to-image | PNG export from canvas | To be evaluated when needed |

### Build System

- **Vite 5** with the React plugin.
- Build command: `tsc --noEmit && vite build` — TypeScript checks first, then Vite bundles.
- Output directory: `dist/`.
- Base path: `/` (site is hosted at `pichara.github.io` root via custom domain / GitHub Pages).

### Styling

- **Tailwind CSS 3** with custom theme extending `colors`, `fontFamily`, and `boxShadow`.
- Global styles in `src/index.css` using `@tailwind` directives plus hand-written CSS.
- The Diagram Studio should use Tailwind utilities and may define scoped CSS for editor-specific layouts.
- The editor follows the portfolio's Matrix theme (green-on-black, same
  tokens as `src/index.css`) — a user-requested change (2026-11-20,
  design fix run 3) that supersedes the earlier neutral-palette rule.
  New shapes/edges default to dark fills with green borders and light
  text (`PicharaStudio/constants/defaults.ts`); SVG/PNG exports use the
  same dark background so they match the canvas.

### Testing

- **Node built-in test runner** (`node --test`).
- Test files in `tests/` directory with `.test.mjs` extension.
- No test framework dependency (no Jest, no Vitest).
- Run with `npm test` or `npm run check` (typecheck + tests).

---

## 4. Development Rules

### TypeScript Strictness

- `strict: true` is enabled in `tsconfig.json`.
- `noUnusedLocals: true` and `noUnusedParameters: true` are enforced.
- `noFallthroughCasesInSwitch: true` is enforced.
- **Never use `any`** unless absolutely necessary and explicitly justified with a `// eslint-disable` comment explaining why.
- Prefer `unknown` over `any` when the type is genuinely unknown.
- Use discriminated unions over type assertions.

### Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `DiagramCanvas.tsx` |
| Hooks | camelCase with `use` prefix | `useDiagramStore.ts` |
| Types/Interfaces | PascalCase | `DiagramNode` |
| Constants | UPPER_SNAKE_CASE | `DEFAULT_VIEWPORT` |
| Utility functions | camelCase | `generateNodeId()` |
| Files (non-component) | kebab-case or camelCase | `defaults.ts`, `generate-id.ts` |
| Directories | kebab-case | `diagram-studio/`, `base/` |
| CSS classes (Tailwind) | Tailwind utilities | `className="flex items-center"` |

### File Organization

- Keep imports organized: React → third-party → internal (types → stores → hooks → components → utils).
- Use barrel exports (`index.ts`) only at module boundaries, not in every directory.
- Avoid circular imports. If two modules need each other, extract shared types to `types/`.

### Error Handling

- Never silently swallow errors.
- Use `try/catch` around serialization, file operations, and localStorage access.
- Display user-facing errors through the UI, not console-only.
- Validate diagram data on import — never trust external JSON blindly.

### Accessibility

- All interactive elements must be keyboard accessible.
- Use semantic HTML and ARIA attributes.
- Respect `prefers-reduced-motion` for canvas animations.
- Ensure sufficient color contrast for editor UI.
- Provide text alternatives for visual-only indicators.

---

## 5. Diagram Editor Rules

### Nodes and Edges

- Nodes and edges **must** have strongly typed models defined in `src/PicharaStudio/types/`.
- Every custom node type must implement a React component registered with React Flow.
- Node components live in `src/PicharaStudio/nodes/` organized by category.
- Edge components live in `src/PicharaStudio/edges/`.
- Node and edge types must be **modular** — adding a new type should not require modifying existing types.

### Rendering vs. Domain Logic

- **Rendering logic** (React components, SVG drawing) must be **separate** from **domain logic** (data transformations, validation, layout algorithms).
- Domain logic belongs in `services/`, `utils/`, or `hooks/`.
- Components should receive data through props or store selectors, not compute it inline.

### Serialization

- Diagram state **must** be fully serializable to JSON at all times.
- No runtime-only state (functions, event handlers, DOM refs) in the diagram model.
- The serialized format must include a `version` field for future migration support.
- Export/import services in `src/PicharaStudio/services/` handle serialization.

### Persistence Independence

- Diagram components must **not** be coupled to any specific persistence mechanism.
- Persistence (LocalStorage, file download, etc.) is handled through services, never inside components or stores.
- The editor must work correctly even if persistence is completely unavailable.

### No Backend

- All editor operations **must** work without a backend.
- Never introduce API calls, server-side rendering, or database dependencies.
- Never assume network connectivity for core editing functionality.

---

## 6. Performance

- **Avoid unnecessary React re-renders.** Use `React.memo`, `useMemo`, and `useCallback` where React Flow interactions cause excessive rendering.
- **Design state for large diagrams.** Hundreds of nodes and edges should not cause lag. Use fine-grained Zustand selectors.
- **Avoid excessive dependencies.** Evaluate bundle size impact before adding any library.
- **Lazy-load the diagram editor.** The portfolio site should not load diagram editor code until the user navigates to `/diagram`. Use `React.lazy()` and `Suspense`.
- **Avoid expensive computations in render paths.** Layout algorithms, export operations, and validation should run outside the render cycle.

---

## 7. GitHub Pages Compatibility

- **Base path:** Vite is configured with `base: "/"`. The site is served at `https://pichara.github.io/`.
- **Static hosting:** GitHub Pages serves static files only. No server-side routing, no redirects, no rewrites.
- **SPA routing:** The app uses `BrowserRouter` (see `docs/architecture/overview.md`
  for why `HashRouter` was rejected — the portfolio uses hash anchors). Direct
  navigation to `/diagram` works through the `public/404.html` redirect
  strategy: `404.html` encodes the path as `/?/diagram` and the decode script
  in `index.html` restores it before the app boots.
- **Asset paths:** Always use relative paths or Vite's asset resolution. Never hardcode absolute paths that assume a specific base URL.
- **Build output:** Vite outputs to `dist/`. The GitHub Actions workflow uploads `dist/` as the Pages artifact.
- **Workflow:** `.github/workflows/pages.yml` runs `npm run check` (typecheck + tests) and `npm run build`. **Never modify this workflow without explicit justification.**

---

## 8. Testing

### Running Tests

```bash
npm test          # Run unit tests (Node built-in test runner)
npm run typecheck # TypeScript type checking only
npm run check     # Typecheck + tests (used by CI)
npm run build     # Full production build
```

### Conventions for Future Tests

- Test files go in `tests/` with `.test.mjs` extension (matching existing convention).
- For TypeScript tests, consider `.test.ts` with a Vitest migration if the project grows — but do not add Vitest without discussion.
- **Test domain logic independently from React.** Services, utilities, and store logic should be testable without rendering components.
- Test file export/import with known fixture data.
- Test serialization round-trips: serialize → deserialize → compare.

---

## 9. AI Agent Behavior

Every AI agent working on this repository **must**:

1. **Read `AGENTS.md` first.** This file is the source of truth for project conventions.
2. **Inspect relevant files before modifying them.** Never assume file contents.
3. **Follow the existing architecture.** New code goes in the right directory per the structure above.
4. **Avoid unnecessary rewrites.** Do not refactor working code without explicit justification.
5. **Avoid introducing dependencies without justification.** Evaluate bundle size, maintenance status, and whether existing tools suffice.
6. **Keep changes focused.** One feature or fix per change. Do not sneak in unrelated modifications.
7. **Run `npm run check` and `npm run build` before finishing.** Code must typecheck, pass tests, and build.
8. **Update documentation when architecture changes.** If you add a new directory, type, or convention, update this file and relevant docs.
9. **Never silently modify deployment configuration.** Changes to `vite.config.ts`, `tsconfig.json`, `pages.yml`, or `package.json` scripts require explicit justification.
10. **Never introduce backend requirements.** The application must remain a static site.
11. **Never compromise the existing Pichara.io website.** The portfolio must continue to work exactly as before.
12. **Preserve the existing test suite.** Never delete or weaken existing tests.
13. **Use the established data model.** New node and edge types must extend the types in `src/PicharaStudio/types/`.
14. **Respect the PicharaStudio module boundary.** Diagram code stays in `src/PicharaStudio/`. Portfolio code stays in `src/components/`.
