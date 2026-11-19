# Services

Stateless business logic for Pichara Diagram Studio.

Services handle operations that are **not** React-specific — they work with plain data types and do not depend on React, Zustand, or DOM APIs (with the exception of export services that need canvas/DOM access for image generation).

## Subdirectories

### `export/`

Converts diagram state into downloadable files.

| Service | Output | Method |
|---|---|---|
| `exportJson` | `.json` file | JSON serialization of the `Diagram` type |
| `exportSvg` | `.svg` file | SVG generation from canvas or React Flow internals |
| `exportPng` | `.png` file | Raster capture via `html-to-image` or similar |

**Rules:**
- JSON export must produce valid, re-importable `Diagram` JSON.
- Strip transient fields (`selected`, `dragging`) before export.
- File download uses the browser's native download mechanism (create `<a>` + `Blob`).

### `import/`

Loads diagram data from external sources.

| Service | Input | Method |
|---|---|---|
| `importJson` | `.json` file | Parse, validate schema, and load into store |

**Rules:**
- **Never trust imported data.** Validate structure and types before loading.
- Handle version mismatches gracefully (future: schema migration).
- Report clear errors for invalid files.

### `templates/`

Starter diagram templates for each diagram type.

Templates are pre-built `Diagram` objects with example nodes and edges that give users a starting point. They are loaded when the user creates a new diagram and selects a template.

## Conventions

- Service functions are **pure** when possible (input → output, no side effects).
- Services do not import React or Zustand.
- Services import only from `types/`, `constants/`, and `utils/`.
- Each service function is individually importable (no god-object service classes).
