# Utilities

Pure utility functions for Pichara Diagram Studio.

These functions have **no dependencies** on React, Zustand, React Flow, or the DOM. They operate on plain data and are easily unit-testable.

## Planned Utilities

| Utility | Purpose |
|---|---|
| `generateId()` | Generate unique IDs for nodes, edges, and diagrams (`crypto.randomUUID()`) |
| `clamp(value, min, max)` | Clamp a number within a range |
| `snapToGrid(position, gridSize)` | Snap a position to the nearest grid point |
| `isPointInRect(point, rect)` | Hit-testing for selection rectangles |
| `calculateBoundingBox(nodes)` | Compute the bounding rectangle of a set of nodes |
| `stripTransientFields(diagram)` | Remove `selected`, `dragging` before serialization |
| `validateDiagramSchema(data)` | Runtime validation of imported JSON against the Diagram type |
| `debounce(fn, delay)` | Debounce wrapper for auto-save and resize handlers |

## Conventions

- One function (or a small group of related functions) per file.
- Files use `camelCase` or `kebab-case`: `generateId.ts`, `snap-to-grid.ts`.
- No side effects. No DOM access. No store access.
- Write corresponding tests in `tests/` for every utility.
