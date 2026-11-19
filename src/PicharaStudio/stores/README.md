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

Undo/redo stack operating on diagram state snapshots. Implemented — see
`utils/history-stack.ts` for the pure stack transitions (unit-tested in
`tests/history-stack.test.mjs`).

**State shape:**
- `past: Diagram[]` — undo stack (full pre-change snapshots, oldest first)
- `future: Diagram[]` — redo stack
- Actions: `pushHistory`, `undo`, `redo`, `clearHistory`

**Rules:**
- Maximum stack depth defined by `MAX_HISTORY_SIZE` constant (50).
- Each snapshot is the full pre-change `Diagram` (never mutated afterwards).
- Pushing a new entry clears the redo stack.
- Recording happens in the diagram store: add node, connect edge, delete
  node/edge, and one entry per node drag. Selection and viewport changes
  are not recorded. Loading a diagram or starting a new one clears history.
- Keyboard: `useKeyboardShortcuts` maps Ctrl/Cmd+Z to undo and
  Ctrl/Cmd+Shift+Z / Ctrl/Cmd+Y to redo; toolbar buttons mirror them.

## Conventions

- Store files use `camelCase`: `diagramStore.ts`.
- Export a typed hook for each store: `export const useDiagramStore = create<DiagramState>(...)`.
- Use fine-grained selectors to avoid unnecessary re-renders.
- Zustand's `devtools` middleware should be enabled in development builds.
