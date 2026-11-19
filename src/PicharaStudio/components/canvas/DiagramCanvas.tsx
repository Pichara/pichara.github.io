/**
 * DiagramCanvas — the React Flow infinite canvas.
 *
 * Controlled by the diagram store: nodes/edges/viewport come from Zustand,
 * and every canvas interaction flows back through store actions. The canvas
 * itself holds no diagram state.
 */

import { useCallback, useMemo, type DragEvent } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Viewport as ReactFlowViewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useDiagramStore } from "../../stores/diagramStore";
import { customNodeTypes } from "../../nodes";
import {
  GRID_SIZE,
  MAX_ZOOM,
  MIN_ZOOM,
  SHAPE_DRAG_MIME_TYPE,
} from "../../constants";
import { edgePresentation } from "../../utils/apply-style";
import { computeDropPosition } from "../../utils/geometry";
import type { ShapeKind } from "../../types";

export default function DiagramCanvas() {
  const nodes = useDiagramStore((state) => state.diagram.nodes);
  const edges = useDiagramStore((state) => state.diagram.edges);
  const viewport = useDiagramStore((state) => state.diagram.viewport);
  const onNodesChange = useDiagramStore((state) => state.onNodesChange);
  const onEdgesChange = useDiagramStore((state) => state.onEdgesChange);
  const onConnect = useDiagramStore((state) => state.onConnect);
  const setViewport = useDiagramStore((state) => state.setViewport);
  const addNode = useDiagramStore((state) => state.addNode);

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
      const position = computeDropPosition(
        event.clientX,
        event.clientY,
        event.currentTarget.getBoundingClientRect(),
        viewport
      );
      addNode(shape, position);
    },
    [addNode, viewport]
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
        snapToGrid
        // No `fitView`: in React Flow v13 the prop queues a fit until the
        // nodes finish initializing, so the first node added to an empty
        // canvas would re-center and zoom the camera (up to 400% for a
        // single node). The viewport is controlled and persisted instead,
        // so adding a shape never moves the camera. An on-demand
        // "zoom to fit" belongs on a toolbar button (improvements list).
      >
        <Background variant={BackgroundVariant.Dots} gap={GRID_SIZE} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
