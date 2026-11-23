/**
 * DiagramCanvas — the React Flow infinite canvas.
 *
 * Controlled by the diagram store: nodes/edges/viewport come from Zustand,
 * and every canvas interaction flows back through store actions. The canvas
 * itself holds no diagram state.
 */

import { useCallback, useEffect, useMemo, useRef, type DragEvent, type MouseEvent as ReactMouseEvent, type RefObject } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  EdgeChangeset,
  MiniMap,
  NodeChangeset,
  ReactFlow,
  useReactFlow,
  useReactFlowStoreApi,
  type Viewport as ReactFlowViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDiagramStore } from "../../stores/diagramStore";
import SelectionToolbar from "./SelectionToolbar";
import FormatPopup, {
  type FormatPopupAnchor,
} from "../panels/FormatPopup";
import { customNodeTypes } from "../../nodes";
import {
  GRID_SIZE,
  MAX_ZOOM,
  MIN_ZOOM,
  SHAPE_DRAG_MIME_TYPE,
} from "../../constants";
import { edgePresentation } from "../../utils/apply-style";
import {
  diagramBounds,
  shouldFitView,
  viewportForBounds,
} from "../../utils/fit-view";
import { computeDropPosition, snapPosition } from "../../utils/geometry";
import type { DiagramEdge, DiagramNode, ShapeKind } from "../../types";

interface DiagramCanvasProps {
  /** Ref to the `.studio-canvas` wrapper, owned by DiagramStudio and
      shared with the shape library so click-to-add can measure the
      actual canvas pane (see `utils/geometry.ts`). */
  canvasRef: RefObject<HTMLDivElement>;
  /** Where the format popup anchors, or null when it is closed. */
  formatAnchor: FormatPopupAnchor | null;
  /** Opens the format popup at a right-click point (client coords). */
  onOpenFormatAtPoint: (x: number, y: number) => void;
  /** Closes the format popup. */
  onCloseFormat: () => void;
}

/**
 * Watches the store's fit-view requests and pans/zooms the camera so
 * the whole diagram is visible. Lives inside the React Flow tree because
 * only there are `useReactFlow` and the store API available. The toolbar
 * button and the Ctrl+0 shortcut only bump `fitViewRequest` in the store.
 *
 * The fit is computed here, not with React Flow's `fitView`: that call
 * (a) only frames nodes with measured dimensions, so a freshly added
 * shape still measuring 0x0 is left out of the frame, and (b) animates
 * through a d3 transition that fights the controlled viewport, so the
 * camera can stall part-way (observed: 275% -> 248% with a node still
 * cut off at the bottom). The bounds come from the store's nodes at
 * their rendered size (`utils/fit-view.ts`) and the viewport is applied
 * instantly with `setViewport` — the same path wheel zoom and panning
 * use, so there is no animation to interrupt.
 *
 * The effect depends only on the request counter: it must NOT re-run
 * when nodes are added — that was the old bug, where every added shape
 * re-fit the camera and the zoom jumped (up to 373% for one node).
 */
function FitViewController() {
  const fitViewRequest = useDiagramStore((state) => state.fitViewRequest);
  const { setViewport } = useReactFlow();
  const storeApi = useReactFlowStoreApi();
  const firstRun = useRef(true);

  useEffect(() => {
    // The store starts at 0 — that is not a user request — and a
    // restored diagram keeps its saved viewport on load.
    const nodeCount = useDiagramStore.getState().diagram.nodes.length;
    if (!shouldFitView(firstRun.current, nodeCount)) {
      firstRun.current = false;
      return;
    }
    firstRun.current = false;
    const bounds = diagramBounds(useDiagramStore.getState().diagram.nodes);
    if (bounds === null) return;
    // Pane size comes from React Flow's viewport store (read here, not
    // subscribed: a window resize must not re-fit the camera on its own).
    const { width, height } = storeApi.viewportStore.getState();
    const viewport = viewportForBounds(
      bounds,
      width,
      height,
      MIN_ZOOM,
      MAX_ZOOM
    );
    if (viewport === null) return;
    setViewport(viewport);
  }, [fitViewRequest, setViewport, storeApi]);

  return null;
}

export default function DiagramCanvas({
  canvasRef,
  formatAnchor,
  onOpenFormatAtPoint,
  onCloseFormat,
}: DiagramCanvasProps) {
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

  // The canvas wrapper rect: the format popup converts the selection's
  // flow bounds to client coordinates through it (see FormatPopup), and
  // the shape library measures the pane through it for click-to-add.
  // The ref is owned by DiagramStudio and shared, not created here.

  // Right-click on a node/edge opens the format popup above the click
  // point instead of the browser menu. Right-clicking an unselected
  // element selects only it first (standard context-menu behavior);
  // right-clicking inside the current selection keeps the whole
  // selection, so the popup formats every selected element at once.
  // Right-clicking empty canvas keeps the browser menu (no handler).
  const handleNodeContextMenu = useCallback(
    (event: ReactMouseEvent, node: DiagramNode) => {
      event.preventDefault();
      if (!node.selected) {
        const store = useDiagramStore.getState();
        store.clearSelection();
        store.onNodesChange(
          new NodeChangeset([
            { id: node.id, type: "select", selected: true },
          ])
        );
      }
      onOpenFormatAtPoint(event.clientX, event.clientY);
    },
    [onOpenFormatAtPoint]
  );

  const handleEdgeContextMenu = useCallback(
    (event: ReactMouseEvent, edge: DiagramEdge) => {
      event.preventDefault();
      if (!edge.selected) {
        const store = useDiagramStore.getState();
        store.clearSelection();
        store.onEdgesChange(
          new EdgeChangeset([
            { id: edge.id, type: "select", selected: true },
          ])
        );
      }
      onOpenFormatAtPoint(event.clientX, event.clientY);
    },
    [onOpenFormatAtPoint]
  );

  return (
    <div
      ref={canvasRef}
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
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
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
        // on-demand: the toolbar button or Ctrl+0, via the
        // FitViewController below.
      >
        {showGrid ? (
          <Background
            variant={BackgroundVariant.Dots}
            gap={GRID_SIZE}
            color="#1d5c33"
          />
        ) : null}
        <FitViewController />
        <SelectionToolbar />
        {formatAnchor !== null ? (
          <FormatPopup
            anchor={formatAnchor}
            onClose={onCloseFormat}
            canvasRef={canvasRef}
          />
        ) : null}
        {/* No fit button here: the Controls fit calls React Flow's
            animated fitView, which frames unmeasured nodes wrong and
            stalls against the controlled viewport — the same bugs the
            FitViewController above fixes. Zoom to fit lives in the
            toolbar and on Ctrl+0. */}
        <Controls showFitView={false} />
        <MiniMap />
      </ReactFlow>
      {/* MatrixRainCorners was rendered here; removed 2026-11-23 at
          the owner's request. The component file is kept (unused) for
          a future re-enable — re-render it here to bring the corner
          rain back. */}
      {nodes.length === 0 ? (
        <div className="studio-empty-state" aria-hidden="true">
          <p className="studio-empty-state__title">Start your diagram</p>
          <p className="studio-empty-state__hint">
            Drag a shape from the library — or click one to add it here.
          </p>
          <p className="studio-empty-state__hint">
            Double-click a shape to rename it · Tap ? in the toolbar for
            shortcuts
          </p>
        </div>
      ) : null}
    </div>
  );
}
