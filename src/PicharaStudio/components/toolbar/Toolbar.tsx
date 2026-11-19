/**
 * Toolbar — top bar of the diagram editor.
 *
 * Shape buttons add a base-shape node at the center of the visible
 * viewport; "New" starts an empty diagram (with a confirm step, since
 * autosave will replace the saved diagram).
 */

import { useCallback } from "react";
import { Link } from "react-router-dom";
import { useDiagramStore } from "../../stores/diagramStore";
import { computeSpawnPosition } from "../../utils/geometry";
import type { ShapeKind } from "../../types";

/** Height of the toolbar in pixels — keep in sync with DiagramStudio.css. */
const TOOLBAR_HEIGHT_PX = 48;

const SHAPES: { kind: ShapeKind; label: string }[] = [
  { kind: "rectangle", label: "Rectangle" },
  { kind: "diamond", label: "Diamond" },
  { kind: "ellipse", label: "Ellipse" },
];

interface ToolbarProps {
  /** True when the most recent LocalStorage autosave failed. */
  saveFailed: boolean;
}

export default function Toolbar({ saveFailed }: ToolbarProps) {
  const addNode = useDiagramStore((state) => state.addNode);
  const newDiagram = useDiagramStore((state) => state.newDiagram);
  const viewport = useDiagramStore((state) => state.diagram.viewport);
  const spawnOffset = useDiagramStore((state) => state.spawnOffset);
  const diagramName = useDiagramStore((state) => state.diagram.name);

  const handleAddShape = useCallback(
    (shape: ShapeKind) => {
      const position = computeSpawnPosition(
        viewport,
        spawnOffset,
        window.innerWidth,
        window.innerHeight - TOOLBAR_HEIGHT_PX
      );
      addNode(shape, position);
    },
    [addNode, viewport, spawnOffset]
  );

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
        className="studio-toolbar__shapes"
        role="group"
        aria-label="Add shape"
      >
        {SHAPES.map((shape) => (
          <button
            key={shape.kind}
            type="button"
            className="studio-button"
            onClick={() => handleAddShape(shape.kind)}
          >
            + {shape.label}
          </button>
        ))}
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
