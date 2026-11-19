# Pichara Diagram Studio

This directory contains the entire Pichara Diagram Studio feature module — a professional, browser-based diagram editor embedded within the Pichara.io website.

## Module Structure

```
PicharaStudio/
├── types/          → Domain model (Diagram, Node, Edge, Viewport, Metadata)
├── constants/      → Default values and static configuration
├── components/     → React UI components (canvas, toolbar, sidebar, panels)
├── nodes/          → Custom React Flow node type components
├── edges/          → Custom React Flow edge type components
├── hooks/          → React hooks for editor interactions and logic
├── stores/         → Zustand state stores (diagram, UI, history)
├── services/       → Stateless logic (export, import, templates)
└── utils/          → Pure utility functions (ID generation, geometry, serialization)
```

## Design Principles

1. **Self-contained module.** This directory is an independent feature boundary. It does not import from portfolio components (`src/components/`) or portfolio data (`src/data.ts`).

2. **React Flow as the rendering engine.** The canvas uses `@xyflow/react`. Custom nodes and edges are React components registered via React Flow's type system.

3. **Zustand for state.** All editor state is managed through Zustand stores. State must be JSON-serializable for persistence and undo/redo.

4. **No backend.** Everything runs in the browser. Persistence uses LocalStorage and file export/import.

5. **Extensibility.** New diagram types, node shapes, and edge styles are added by creating new components and registering them — without modifying core architecture.

## Documentation

- [Architecture Overview](../../docs/architecture/overview.md)
- [Diagram Data Model](../../docs/architecture/diagram-data-model.md)
- [Development Guide](../../docs/architecture/development-guide.md)
- [ADR-001: Rendering Engine](../../docs/decisions/001-diagram-rendering-engine.md)
