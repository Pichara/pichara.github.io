/**
 * Canonical keyboard shortcuts and mouse tips for the diagram editor.
 *
 * This list is the single source of truth shown in the Shortcuts dialog
 * (`components/dialogs/ShortcutsDialog.tsx`). Every entry here must be
 * handled by `hooks/useKeyboardShortcuts.ts` (or be a mouse interaction
 * described in the canvas components) — `tests/shortcuts.test.mjs`
 * guards the list against drift.
 *
 * Keys are written with Ctrl; on macOS the same shortcuts use Cmd.
 */

export interface ShortcutEntry {
  /** Keys shown as pressed, e.g. "Ctrl+Z" or "Delete / Backspace". */
  keys: string;
  /** What the shortcut does. */
  action: string;
}

export const SHORTCUTS: ShortcutEntry[] = [
  { keys: "Ctrl+Z", action: "Undo" },
  { keys: "Ctrl+Shift+Z / Ctrl+Y", action: "Redo" },
  { keys: "Ctrl+C", action: "Copy selection" },
  { keys: "Ctrl+V", action: "Paste" },
  { keys: "Ctrl+D", action: "Duplicate selection" },
  { keys: "Ctrl+G", action: "Group selection" },
  { keys: "Ctrl+Shift+G", action: "Ungroup selection" },
  { keys: "Ctrl+A", action: "Select all" },
  { keys: "Ctrl+0", action: "Zoom to fit" },
  { keys: "Delete / Backspace", action: "Delete selection" },
  { keys: "Esc", action: "Clear selection" },
  { keys: "F", action: "Format selection" },
  { keys: "?", action: "Show this list" },
];

export const MOUSE_TIPS: ShortcutEntry[] = [
  {
    keys: "Drag a shape",
    action: "Add it to the canvas, or click to add it at the center",
  },
  { keys: "Double-click a shape", action: "Rename it" },
  { keys: "Right-click a shape or connection", action: "Format it" },
  { keys: "Drag on empty canvas", action: "Select several shapes at once" },
  { keys: "Space + drag / middle mouse", action: "Pan the canvas" },
  { keys: "Drag a handle", action: "Connect two shapes" },
];
