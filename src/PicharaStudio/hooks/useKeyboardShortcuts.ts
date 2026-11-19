/**
 * Keyboard shortcuts for the diagram editor.
 *
 * - Ctrl/Cmd+Z: undo
 * - Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y: redo
 *
 * Shortcuts are ignored while typing in an editable element (input,
 * textarea, select, contenteditable) so text editing keeps its native
 * undo behavior, and when Alt is held (to avoid clashing with OS-level
 * shortcuts). Holding Ctrl+Z repeats undo, matching standard editors.
 */

import { useEffect } from "react";
import { useHistoryStore } from "../stores/historyStore";

/** True when the key event target accepts text input. */
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const mod = event.ctrlKey || event.metaKey;
      if (!mod || event.altKey || isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        useHistoryStore.getState().undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        useHistoryStore.getState().redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
