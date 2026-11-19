# Hooks

Custom React hooks for Pichara Diagram Studio editor interactions.

Hooks encapsulate complex logic and side effects, keeping components clean and focused on rendering.

## Planned Hooks

| Hook | Purpose |
|---|---|
| `useDiagramStore` | Typed selector for the diagram Zustand store |
| `useUIStore` | Typed selector for the UI state Zustand store |
| `useHistoryStore` | Typed selector for the undo/redo history store |
| `useKeyboardShortcuts` | Register and manage keyboard shortcuts (Ctrl+Z, Ctrl+C, Delete, etc.) |
| `useClipboard` | Cut/copy/paste operations for nodes and edges |
| `useDragAndDrop` | Handle drag-from-sidebar-to-canvas for adding new nodes |
| `useAutoSave` | Periodic LocalStorage persistence with debouncing |
| `useContextMenu` | Right-click context menu state and positioning |
| `useZoom` | Zoom controls (zoom in, out, fit, reset) with keyboard support |

## Conventions

- Hook files use `camelCase` with the `use` prefix: `useKeyboardShortcuts.ts`.
- Hooks should be composable — prefer small, focused hooks over monolithic ones.
- Hooks that access Zustand stores should use selectors for performance (avoid subscribing to the entire store).
- Side-effect hooks (keyboard listeners, timers, resize observers) must clean up in their return function.
