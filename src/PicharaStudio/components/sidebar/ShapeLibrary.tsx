/**
 * ShapeLibrary — left sidebar with the categorized shape library.
 *
 * Drag a shape onto the canvas to drop it there, or click it to add it at
 * the center of the visible viewport. Drag uses HTML5 drag-and-drop; the
 * canvas handles the drop (see `components/canvas/DiagramCanvas.tsx`).
 */

import { useCallback, type DragEvent } from "react";
import { useDiagramStore } from "../../stores/diagramStore";
import {
  GRID_SIZE,
  SHAPE_LIBRARY,
  SHAPE_DRAG_MIME_TYPE,
} from "../../constants";
import { computeSpawnPosition, snapPosition } from "../../utils/geometry";
import { shapePolygonPoints } from "../../utils/shape-geometry";
import type { ShapeKind } from "../../types";

/** Height of the toolbar in pixels — keep in sync with DiagramStudio.css. */
const TOOLBAR_HEIGHT_PX = 48;

/** Small shape preview drawn in the library item. */
function ShapePreview({ shape }: { shape: ShapeKind }) {
  const polygonPoints = shapePolygonPoints(shape);
  return (
    <svg
      className="shape-library__preview"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {polygonPoints !== null ? (
        <polygon
          points={polygonPoints}
          fill="#ffffff"
          stroke="#4b5563"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      ) : shape === "ellipse" ? (
        <ellipse
          cx="50"
          cy="50"
          rx="48"
          ry="48"
          fill="#ffffff"
          stroke="#4b5563"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      ) : (
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="8"
          fill="#ffffff"
          stroke="#4b5563"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

interface ShapeLibraryProps {
  /** True when the library is open as an overlay drawer (narrow screens). */
  isMobileOpen?: boolean;
  /** Closes the overlay drawer (narrow screens). */
  onClose?: () => void;
}

export default function ShapeLibrary({
  isMobileOpen = false,
  onClose,
}: ShapeLibraryProps) {
  const addNode = useDiagramStore((state) => state.addNode);
  const viewport = useDiagramStore((state) => state.diagram.viewport);
  const spawnOffset = useDiagramStore((state) => state.spawnOffset);
  const snapToGrid = useDiagramStore((state) => state.snapToGrid);

  const handleAddShape = useCallback(
    (shape: ShapeKind) => {
      const rawPosition = computeSpawnPosition(
        viewport,
        spawnOffset,
        window.innerWidth,
        window.innerHeight - TOOLBAR_HEIGHT_PX
      );
      const position = snapToGrid
        ? snapPosition(rawPosition, GRID_SIZE)
        : rawPosition;
      addNode(shape, position);
      // On a phone the library is an overlay drawer: close it so the
      // new shape on the canvas is visible right away.
      onClose?.();
    },
    [addNode, viewport, spawnOffset, snapToGrid, onClose]
  );

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLButtonElement>, shape: ShapeKind) => {
      event.dataTransfer.setData(SHAPE_DRAG_MIME_TYPE, shape);
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  return (
    <aside
      className={`shape-library${isMobileOpen ? " is-mobile-open" : ""}`}
      aria-label="Shape library"
    >
      <button
        type="button"
        className="studio-button studio-panel__close"
        onClick={onClose}
        aria-label="Close shape library"
      >
        ✕ Close
      </button>
      {SHAPE_LIBRARY.map((category) => (
        <section key={category.title}>
          <h2 className="shape-library__section-title">{category.title}</h2>
          <div className="shape-library__items">
            {category.shapes.map((entry) => (
              <button
                key={entry.kind}
                type="button"
                className="shape-library__item"
                draggable
                onDragStart={(event) => handleDragStart(event, entry.kind)}
                onClick={() => handleAddShape(entry.kind)}
                title={`Add ${entry.label} (or drag onto the canvas)`}
                aria-label={`Add ${entry.label}`}
              >
                <ShapePreview shape={entry.kind} />
                <span className="shape-library__item-label">
                  {entry.label}
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
      <p className="shape-library__hint">
        Drag a shape onto the canvas, or click to add it at the center.
      </p>
    </aside>
  );
}
