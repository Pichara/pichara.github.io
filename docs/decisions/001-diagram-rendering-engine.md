# ADR-001: Diagram Rendering Engine

**Status:** Accepted  
**Date:** 2026-11-18  
**Deciders:** Project architect  

## Context

Pichara Diagram Studio needs a rendering engine capable of drawing interactive node-and-edge diagrams on an infinite canvas within a React application. The engine must support:

- Panning and zooming on an infinite canvas.
- Dragging, selecting, and connecting nodes.
- Custom node and edge rendering via React components.
- Programmatic control of layout and viewport.
- Good performance with hundreds of nodes.
- An API compatible with React 18 and TypeScript.
- Active maintenance and community support.

The existing Pichara.io website uses React 18.3.1, TypeScript 5.5.4, and Vite 5.4.2. The rendering engine must integrate cleanly with this stack.

## Alternatives Considered

### 1. React Flow (`@xyflow/react`)

- **What:** A React library for building interactive node-based editors, flowcharts, and diagrams.
- **License:** MIT (free for open source; pro features require a paid plan).
- **Bundle size:** ~45 KB gzipped (core).
- **React version:** Supports React 18.
- **TypeScript:** First-class TypeScript support with generic type parameters.
- **Community:** 25k+ GitHub stars, active maintenance, extensive documentation.
- **Customization:** Nodes and edges are plain React components. Full control over rendering.
- **Built-in features:** Minimap, controls, background grid, snap-to-grid, keyboard shortcuts, touch support.

### 2. JointJS / Rappid

- **What:** A JavaScript diagramming library with optional premium UI toolkit (Rappid).
- **License:** Open-source core (MPL 2.0), commercial premium features.
- **Trade-offs:** Heavy library (~200 KB). Not React-native — requires wrapper. Premium features (the ones that make it compete with Lucidchart) are commercial.
- **Why not:** Heavier bundle, non-React paradigm, commercial licensing for advanced features.

### 3. GoJS

- **What:** A commercial JavaScript library for interactive diagrams.
- **License:** Commercial (requires paid license for production use).
- **Trade-offs:** Excellent feature set but watermark in free mode. Not React-native.
- **Why not:** Paid license required. Would need React wrapper. Proprietary.

### 4. D3.js (manual implementation)

- **What:** A low-level data visualization library.
- **Trade-offs:** Maximum flexibility but requires building every interaction from scratch — drag, select, connect, zoom, undo/redo, hit testing, etc.
- **Why not:** Enormous implementation effort. D3's DOM manipulation model conflicts with React's virtual DOM. Would take months of work that React Flow provides out of the box.

### 5. Cytoscape.js

- **What:** A graph theory library for analysis and visualization.
- **License:** MIT.
- **Trade-offs:** Optimized for graph analysis (network graphs, biology) rather than editable diagrams. Limited customization of node appearance. No native React integration.
- **Why not:** Designed for graph visualization, not interactive diagram editing. Node customization is CSS-based, not component-based.

### 6. Mermaid.js

- **What:** A text-to-diagram rendering library.
- **Trade-offs:** Renders from text DSL — not an interactive editor. Users describe diagrams in text and Mermaid produces SVG.
- **Why not:** No interactive editing. Useful for documentation (and already used in this project's docs), but not a diagram editor engine.

## Decision

**Use React Flow (`@xyflow/react`) as the diagram rendering engine.**

## Rationale

### Advantages

1. **React-native.** Nodes and edges are React components. This aligns perfectly with the existing React 18 stack and allows using Tailwind CSS, hooks, and the full React ecosystem inside diagram elements.

2. **TypeScript-first.** React Flow's API uses generics (`Node<T>`, `Edge<T>`) that map directly to our domain model. No type gymnastics or `@types` packages needed.

3. **Rich built-in interactions.** Pan, zoom, drag, select, multi-select, connect, snap-to-grid, keyboard shortcuts, and touch — all out of the box. This saves months of implementation.

4. **Small bundle.** ~45 KB gzipped core is acceptable for a tool application. Comparable to adding one medium-sized UI library.

5. **Extensible architecture.** Custom node types are just React components registered in a type map. Adding new diagram categories (UML, ERD, infrastructure) means adding new components, not fighting the framework.

6. **Active community.** 25k+ stars, regular releases, extensive docs, and a Discord community. Low risk of abandonment.

7. **Vite compatible.** Works with Vite's ESM-first build pipeline. No special configuration needed.

8. **Performance.** Uses an internal element rendering system that virtualizes off-screen nodes. Handles hundreds of nodes smoothly.

### Disadvantages

1. **Pro features are paid.** Some advanced features (sub-flows, grouping helpers, certain layout utilities) require a React Flow Pro subscription. For this project, the MIT-licensed core is sufficient. Advanced grouping can be implemented manually using `parentId`.

2. **Learning curve.** React Flow has its own concepts (handles, connection validation, edge routing) that require learning. Mitigated by excellent documentation.

3. **Opinionated internal state.** React Flow manages its own internal node/edge state. Synchronizing with Zustand requires careful controlled/uncontrolled component management. This is documented and solvable but adds complexity.

4. **SVG/PNG export is not built-in.** Exporting the canvas requires `html-to-image` or similar. This is a known gap that the library's docs address.

## Consequences

- **Install `@xyflow/react` when implementation begins.** Do not install during the bootstrap phase.
- **Design the type system to align with React Flow's generics.** `DiagramNode<T>` and `DiagramEdge<T>` mirror React Flow's `Node<T>` and `Edge<T>`.
- **Custom nodes will be React components** in `src/PicharaStudio/nodes/`.
- **State synchronization between React Flow and Zustand** must be carefully implemented to avoid stale state or infinite update loops.
- **Export functionality will require a secondary library** (`html-to-image` or direct SVG serialization) — evaluated when export is implemented.
- **If React Flow Pro features become necessary,** evaluate the subscription. The architecture should not depend on Pro features for core functionality.
