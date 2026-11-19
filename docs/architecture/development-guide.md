# Development Guide — Pichara Diagram Studio

## Prerequisites

- **Node.js 22+** (matches CI environment)
- **npm** (ships with Node.js)
- A modern browser (Chrome, Firefox, Edge, or Safari)

## Running the Application

```bash
# Install dependencies
npm ci

# Start development server
npm run dev
```

Vite will start a local server (usually at `http://localhost:5173/`). The portfolio site loads at the root path. Once routing is implemented, the diagram editor will be accessible at `/#/diagram`.

## Running Tests

```bash
# TypeScript type checking
npm run typecheck

# Unit tests (Node built-in test runner)
npm test

# Both typecheck and tests (same as CI)
npm run check
```

## Building for Production

```bash
npm run build
```

Output is written to `dist/`. To preview the production build locally:

```bash
npm run preview
```

## CI / CD Pipeline

The GitHub Actions workflow (`.github/workflows/pages.yml`) runs on every push to `main` and on pull requests:

1. **Checkout** → **Install** (`npm ci`) → **Check** (`npm run check`) → **Build** (`npm run build`)
2. On PRs: uploads `dist/` as a downloadable artifact for review.
3. On `main`: deploys `dist/` to GitHub Pages.

**Never push code that fails `npm run check` or `npm run build`.**

---

## Project Structure

```
src/PicharaStudio/
├── types/              # Domain model type definitions
│   ├── diagram.ts      # Diagram, DiagramType
│   ├── node.ts         # DiagramNode, BaseNodeData, NodePosition, NodeStyle
│   ├── edge.ts         # DiagramEdge, BaseEdgeData, EdgeStyle
│   ├── viewport.ts     # Viewport
│   ├── metadata.ts     # DiagramMetadata
│   └── index.ts        # Barrel re-export
├── constants/          # Default values and configuration
│   ├── defaults.ts     # DEFAULT_VIEWPORT, DEFAULT_NODE_STYLE, etc.
│   └── index.ts        # Barrel re-export
├── components/         # React UI components
│   ├── canvas/         # Main React Flow canvas wrapper
│   ├── toolbar/        # Top toolbar (tools, actions, zoom)
│   ├── sidebar/        # Left shape library panel
│   ├── panels/         # Right-side contextual properties panel
│   ├── dialogs/        # Modal dialogs (export, import, settings)
│   └── status-bar/     # Bottom status bar (zoom %, node count, etc.)
├── nodes/              # Custom React Flow node components
│   ├── base/           # Generic shapes (rectangle, rounded, diamond, etc.)
│   ├── shapes/         # Basic geometric shapes
│   ├── architecture/   # Architecture diagram nodes (service, database, queue, etc.)
│   ├── uml/            # UML diagram nodes (class, interface, actor, etc.)
│   └── database/       # ERD nodes (table, column group, etc.)
├── edges/              # Custom React Flow edge components
├── hooks/              # React hooks for editor logic
├── stores/             # Zustand state stores
├── services/           # Stateless business logic
│   ├── export/         # JSON, SVG, PNG export
│   ├── import/         # JSON import and validation
│   └── templates/      # Starter diagram templates
└── utils/              # Pure utility functions
```

---

## How to Add a New Custom Node Type

Follow these steps when creating a new visual node for the diagram editor:

### 1. Define the Data Type

Add a new interface to `src/PicharaStudio/types/node.ts` extending `BaseNodeData`:

```typescript
/** Data payload for an Architecture Service node */
export interface ServiceNodeData extends BaseNodeData {
  serviceType: "api" | "worker" | "gateway" | "scheduler";
  port?: number;
}
```

Export it from `types/index.ts`.

### 2. Create the Component

Create a new file in the appropriate category directory:

```
src/PicharaStudio/nodes/architecture/ServiceNode.tsx
```

```typescript
import { type NodeProps } from "@xyflow/react";
import type { ServiceNodeData } from "../../types";

export default function ServiceNode({ data }: NodeProps<ServiceNodeData>) {
  return (
    <div className="...">
      <span>{data.label}</span>
      {data.description && <p>{data.description}</p>}
    </div>
  );
}
```

### 3. Register the Node Type

In the central node type registry (to be created in `nodes/index.ts`):

```typescript
import ServiceNode from "./architecture/ServiceNode";

export const customNodeTypes = {
  "architecture-service": ServiceNode,
  // ... other node types
} as const;
```

Pass `customNodeTypes` to React Flow's `nodeTypes` prop.

### 4. Add to Sidebar Library

Add an entry in the sidebar's shape library so users can drag the new node onto the canvas.

---

## How to Add a New Custom Edge Type

### 1. Define Data Type (if needed)

If the edge carries custom data beyond `BaseEdgeData`, define it in `types/edge.ts`:

```typescript
export interface DependencyEdgeData extends BaseEdgeData {
  dependencyType: "runtime" | "build" | "optional";
}
```

### 2. Create the Component

```
src/PicharaStudio/edges/DependencyEdge.tsx
```

```typescript
import { type EdgeProps, BaseEdge, getSmoothStepPath } from "@xyflow/react";
import type { DependencyEdgeData } from "../types";

export default function DependencyEdge(props: EdgeProps<DependencyEdgeData>) {
  const [edgePath] = getSmoothStepPath(props);
  return <BaseEdge path={edgePath} {...props} />;
}
```

### 3. Register the Edge Type

```typescript
import DependencyEdge from "./DependencyEdge";

export const customEdgeTypes = {
  dependency: DependencyEdge,
} as const;
```

---

## Code Conventions

### Imports

Organize imports in this order, separated by blank lines:

```typescript
// 1. React
import { useState, useCallback } from "react";

// 2. Third-party libraries
import { useReactFlow } from "@xyflow/react";

// 3. Internal types
import type { DiagramNode, BaseNodeData } from "../types";

// 4. Internal stores / hooks
import { useDiagramStore } from "../stores/diagramStore";

// 5. Internal components
import NodeLabel from "./NodeLabel";

// 6. Internal utilities
import { generateId } from "../utils/id";
```

### Component Files

- One component per file.
- File name matches export name: `DiagramCanvas.tsx` → `export default function DiagramCanvas`.
- Co-locate tightly coupled sub-components in the same directory.
- Use TypeScript `type` or `interface` for props — define them in the same file unless shared.

### State Updates

```typescript
// ✅ Good — immutable update via Zustand set
set((state) => ({
  nodes: [...state.nodes, newNode],
}));

// ❌ Bad — direct mutation
state.nodes.push(newNode);
```

---

## Debugging Tips

- **React Flow DevTools:** React Flow has built-in debug features accessible via the `<ReactFlow>` component's `proOptions` prop.
- **Zustand DevTools:** Use the `devtools` middleware in development to inspect state in browser DevTools.
- **React DevTools:** The browser extension works with React 18 and shows the component tree, props, and state.
- **Vite HMR:** Vite's hot module replacement preserves React state during development. If state gets corrupted, do a full page reload.
