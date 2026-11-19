/**
 * Toolbar — top bar of the diagram editor.
 *
 * Shapes live in the left sidebar (`components/sidebar/ShapeLibrary.tsx`);
 * this bar holds navigation, undo/redo, and "New" (starts an empty diagram
 * with a confirm step, since autosave will replace the saved diagram).
 */

import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useDiagramStore } from "../../stores/diagramStore";
import { useHistoryStore } from "../../stores/historyStore";

interface ToolbarProps {
  /** True when the most recent LocalStorage autosave failed. */
  saveFailed: boolean;
}

export default function Toolbar({ saveFailed }: ToolbarProps) {
  const newDiagram = useDiagramStore((state) => state.newDiagram);
  const diagramName = useDiagramStore((state) => state.diagram.name);
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.past.length > 0);
  const canRedo = useHistoryStore((state) => state.future.length > 0);

  const handleNewDiagram = useCallback(() => {
    if (
      window.confirm(
        "Start a new diagram? The current diagram will be replaced."
      )
    ) {
      newDiagram();
    }
  }, [newDiagram]);

  return (
    <header className="studio-toolbar">
      <Link to="/" className="studio-toolbar__back">
        ← Portfolio
      </Link>
      <span className="studio-toolbar__title">Pichara Studio</span>
      <span className="studio-toolbar__diagram-name">{diagramName}</span>
      {saveFailed ? (
        <span className="studio-toolbar__save-warning" role="alert">
          Couldn&apos;t save locally
        </span>
      ) : null}
      <div
        className="studio-toolbar__history"
        role="group"
        aria-label="Undo and redo"
      >
        <button
          type="button"
          className="studio-button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          ↩ Undo
        </button>
        <button
          type="button"
          className="studio-button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          ↪ Redo
        </button>
      </div>
      <button
        type="button"
        className="studio-button"
        onClick={handleNewDiagram}
      >
        New
      </button>
    </header>
  );
}
