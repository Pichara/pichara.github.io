# Components

React UI components for the Pichara Diagram Studio editor interface.

## Subdirectories

| Directory | Responsibility |
|---|---|
| `canvas/` | Main React Flow canvas wrapper — the central infinite canvas. Manages the `<ReactFlow>` component, background, minimap, and controls. |
| `toolbar/` | Top toolbar — tool selection (select, pan, connect), actions (undo, redo, delete), zoom controls, and diagram-level operations (export, import, new). |
| `sidebar/` | Left panel — shape/component library organized by diagram type. Users drag shapes from here onto the canvas. |
| `panels/` | Right panel — contextual properties editor. Shows and edits properties of the selected node or edge (label, style, connections). |
| `dialogs/` | Modal dialogs — export settings, import file picker, new diagram wizard, keyboard shortcuts reference. |
| `status-bar/` | Bottom status bar — current zoom level, node/edge count, grid/snap indicators, cursor coordinates. |

## Conventions

- One component per file. File name matches component name in PascalCase.
- Keep components **presentational** when possible — delegate logic to hooks and stores.
- Use Tailwind CSS utilities for styling. The editor uses a neutral, professional palette independent from the portfolio's dark-green theme.
- Sub-components tightly coupled to a parent live in the same directory.
