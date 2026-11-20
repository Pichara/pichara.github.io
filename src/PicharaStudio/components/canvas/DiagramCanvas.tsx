/**
 * DiagramCanvas — the React Flow infinite canvas.
 *
 * Controlled by the diagram store: nodes/edges/viewport come from Zustand,
 * and every canvas interaction flows back through store actions. The canvas
 * itself holds no diagram state.
 */

import { useCallback, useEffect, useMemo, useRef, type DragEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Viewport as ReactFlowViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDiagramStore } from "../../stores/diagramStore";
import SelectionToolbar from "./SelectionToolbar";
import { customNodeTypes } from "../../nodes";
import {
  GRID_SIZE,
  MAX_ZOOM,
  MIN_ZOOM,
  SHAPE_DRAG_MIME_TYPE,
} from "../../constants";
import { edgePresentation } from "../../utils/apply-style";
import { computeDropPosition, snapPosition } from "../../utils/geometry";
import type { ShapeKind } from "../../types";

/**
 * Watches the store's fit-view requests and pans/zooms the camera so
 * the whole diagram is visible. Lives inside the React Flow tree because
 * only there is `useReactFlow` available. The toolbar button and the
 * Ctrl+0 shortcut only bump `fitViewRequest` in the store.
 */
function FitViewController() {
  const fitViewRequest = useDiagramStore((state) => state.fitViewRequest);
  const nodeCount = useDiagramStore((state) => state.diagram.nodes.length);
  const { fitView } = useReactFlow();
  const firstRun = useRef(true);

  useEffect(() => {
    // The store starts at 0 — that is not a user request.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (nodeCount === 0) return;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    fitView({ padding: 0.2, duration: reduceMotion ? 0 : 200 });
  }, [fitViewRequest, fitView, nodeCount]);

  return null;
}

export default function DiagramCanvas() {
  const nodes = useDiagramStore((state) => state.diagram.nodes);
  const edges = useDiagramStore((state) => state.diagram.edges);
  const viewport = useDiagramStore((state) => state.diagram.viewport);
  const onNodesChange = useDiagramStore((state) => state.onNodesChange);
  const onEdgesChange = useDiagramStore((state) => state.onEdgesChange);
  const onConnect = useDiagramStore((state) => state.onConnect);
  const setViewport = useDiagramStore((state) => state.setViewport);
  const addNode = useDiagramStore((state) => state.addNode);
  const showGrid = useDiagramStore((state) => state.showGrid);
  const snapToGrid = useDiagramStore((state) => state.snapToGrid);

  // Translate each edge's domain style into the props React Flow renders
  // (stroke color/width/dash, animation). The stored edge keeps only the
  // serializable `data.style` overrides.
  const flowEdges = useMemo(
    () => edges.map((edge) => ({ ...edge, ...edgePresentation(edge) })),
    [edges]
  );

  const handleViewportChange = useCallback(
    (nextViewport: ReactFlowViewport) => {
      setViewport(nextViewport);
    },
    [setViewport]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const shape = event.dataTransfer.getData(
        SHAPE_DRAG_MIME_TYPE
      ) as ShapeKind;
      if (!shape) return;
      const rawPosition = computeDropPosition(
        event.clientX,
        event.clientY,
        event.currentTarget.getBoundingClientRect(),
        viewport
      );
      // Dropped nodes land on a grid intersection when snap is on,
      // matching where a dragged node would snap to.
      const position = snapToGrid
        ? snapPosition(rawPosition, GRID_SIZE)
        : rawPosition;
      addNode(shape, position);
    },
    [addNode, viewport, snapToGrid]
  );

  return (
    <div
      className="studio-canvas"
      aria-label="Diagram canvas"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        viewport={viewport}
        onViewportChange={handleViewportChange}
        nodeTypes={customNodeTypes}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        snapGrid={[GRID_SIZE, GRID_SIZE]}
        snapToGrid={snapToGrid}
        // No built-in delete key: the editor's own Delete/Backspace
        // shortcut (hooks/useKeyboardShortcuts.ts) deletes the selection
        // through the store, so a deleted node comes back with its edges
        // on undo. Leaving React Flow's default on would double-record
        // the deletion in history.
        deleteKeyCode={null}
        // Marquee multi-select: dragging on empty canvas draws a
        // selection box (Lucidchart-style) instead of panning. Panning
        // moves to the middle/right mouse button (`panOnDrag`) and to
        // Space+drag (React Flow's default pan key); `selectionOnDrag`
        // has no effect while the left button pans, so the two props
        // must change together.
        selectionOnDrag
        panOnDrag={[1, 2]}
        // No `fitView` prop: in React Flow v13 the prop queues a fit until the
        // nodes finish initializing, so the first node added to an empty
        // canvas would re-center and zoom the camera (up to 400% for a
        // single node). The viewport is controlled and persisted instead,
        // so adding a shape never moves the camera. Zoom to fit is
        // on-demand: the toolbar button, Ctrl+0, or the Controls fit
        // button, via the FitViewController below.
      >
        {showGrid ? (
          <Background variant={BackgroundVariant.Dots} gap={GRID_SIZE} />
        ) : null}
        <FitViewController />
        <SelectionToolbar />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
