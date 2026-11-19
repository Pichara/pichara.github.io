/**
 * DiagramCanvas — the React Flow infinite canvas.
 *
 * Controlled by the diagram store: nodes/edges/viewport come from Zustand,
 * and every canvas interaction flows back through store actions. The canvas
 * itself holds no diagram state.
 */

import { useCallback } from "react";
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
import { GRID_SIZE, MAX_ZOOM, MIN_ZOOM } from "../../constants";

export default function DiagramCanvas() {
  const nodes = useDiagramStore((state) => state.diagram.nodes);
  const edges = useDiagramStore((state) => state.diagram.edges);
  const viewport = useDiagramStore((state) => state.diagram.viewport);
  const onNodesChange = useDiagramStore((state) => state.onNodesChange);
  const onEdgesChange = useDiagramStore((state) => state.onEdgesChange);
  const onConnect = useDiagramStore((state) => state.onConnect);
  const setViewport = useDiagramStore((state) => state.setViewport);

  const handleViewportChange = useCallback(
    (nextViewport: ReactFlowViewport) => {
      setViewport(nextViewport);
    },
    [setViewport]
  );

  return (
    <div className="studio-canvas" aria-label="Diagram canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={GRID_SIZE} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
