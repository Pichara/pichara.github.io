# Stores

Zustand state management stores for Pichara Diagram Studio.

## Store Architecture

The editor state is split into three focused stores:

### Diagram Store (`diagramStore.ts`)

The source of truth for all diagram data.

**State shape:**
- `diagram: Diagram` — the current diagram (nodes, edges, viewport, metadata)
- Actions: `addNode`, `updateNode`, `removeNode`, `addEdge`, `updateEdge`, `removeEdge`, `setViewport`, `loadDiagram`, `newDiagram`

**Rules:**
- State must be JSON-serializable at all times.
- All mutations go through store actions (never mutate directly).
- Use immer middleware for complex nested updates if needed.

### UI Store (`uiStore.ts`)

Transient editor interface state.

**State shape:**
- `activeTool: "select" | "pan" | "connect"` — current interaction mode
- `sidebarOpen: boolean` — left panel visibility
- `propertiesPanelOpen: boolean` — right panel visibility
- `selectedNodeIds: string[]` — currently selected node IDs
- `selectedEdgeIds: string[]` — currently selected edge IDs

**Rules:**
- Not persisted. Resets to defaults on page load.
- UI state is independent from diagram data.

### History Store (`historyStore.ts`)

Undo/redo stack operating on diagram state snapshots.

**State shape:**
- `past: DiagramSnapshot[]` — undo stack
- `future: DiagramSnapshot[]` — redo stack
- Actions: `pushHistory`, `undo`, `redo`, `clearHistory`

**Rules:**
- Maximum stack depth defined by `MAX_HISTORY_SIZE` constant.
- Each snapshot is a serialized copy of the diagram store state.
- Pushing a new entry clears the redo stack.

## Conventions

- Store files use `camelCase`: `diagramStore.ts`.
- Export a typed hook for each store: `export const useDiagramStore = create<DiagramState>(...)`.
- Use fine-grained selectors to avoid unnecessary re-renders.
- Zustand's `devtools` middleware should be enabled in development builds.
