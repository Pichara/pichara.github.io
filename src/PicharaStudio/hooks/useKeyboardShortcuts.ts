/**
 * Keyboard shortcuts for the diagram editor.
 *
 * With Ctrl/Cmd held:
 * - Ctrl/Cmd+Z: undo
 * - Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y: redo
 * - Ctrl/Cmd+C: copy the selection
 * - Ctrl/Cmd+V: paste the clipboard
 * - Ctrl/Cmd+D: duplicate the selection
 * - Ctrl/Cmd+G: group the selection (Ctrl/Cmd+Shift+G ungroups)
 * - Ctrl/Cmd+A: select all nodes and edges
 * - Ctrl/Cmd+0: zoom to fit the whole diagram
 *
 * Without a modifier:
 * - Delete / Backspace: delete the selection (one undo step)
 * - Escape: clear the selection
 * - ?: open the keyboard shortcuts dialog
 *
 * Shortcuts are ignored while typing in an editable element (input,
 * textarea, select, contenteditable) so text editing keeps its native
 * behavior, and when Alt is held (to avoid clashing with OS-level
 * shortcuts). Holding Ctrl+Z repeats undo, matching standard editors.
 *
 * The "?" shortcut needs a callback because the dialog lives in
 * `components/DiagramStudio.tsx`, above this hook's owner: pass
 * `onOpenShortcuts` to open it.
 */

import { useEffect } from "react";
import { useDiagramStore } from "../stores/diagramStore";
import { useHistoryStore } from "../stores/historyStore";

/** True when the key event target accepts text input. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useKeyboardShortcuts(
  onOpenShortcuts?: () => void
): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.altKey || isEditableTarget(event.target)) return;

      const store = useDiagramStore.getState();
      const key = event.key.toLowerCase();

      if (event.ctrlKey || event.metaKey) {
        if (key === "z" && !event.shiftKey) {
          event.preventDefault();
          useHistoryStore.getState().undo();
        } else if ((key === "z" && event.shiftKey) || key === "y") {
          event.preventDefault();
          useHistoryStore.getState().redo();
        } else if (key === "c") {
          event.preventDefault();
          store.copySelection();
        } else if (key === "v") {
          event.preventDefault();
          store.pasteClipboard();
        } else if (key === "d") {
          // Ctrl+D would bookmark the page in the browser; the editor
          // claims it for duplicating the selection instead.
          event.preventDefault();
          store.duplicateSelection();
        } else if (key === "g" && !event.shiftKey) {
          event.preventDefault();
          store.groupSelection();
        } else if (key === "g" && event.shiftKey) {
          event.preventDefault();
          store.ungroupSelection();
        } else if (key === "a") {
          // Ctrl+A would select the page text; the editor claims it
          // for selecting every node and edge instead.
          event.preventDefault();
          store.selectAll();
        } else if (key === "0") {
          event.preventDefault();
          store.requestFitView();
        }
        return;
      }

      if (key === "delete" || key === "backspace") {
        event.preventDefault();
        store.deleteSelection();
      } else if (key === "escape") {
        store.clearSelection();
      } else if (key === "?") {
        event.preventDefault();
        onOpenShortcuts?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenShortcuts]);
}
