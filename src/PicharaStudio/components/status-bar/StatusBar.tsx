/**
 * StatusBar — bottom bar showing live diagram stats (node/edge counts
 * and zoom level), read from the diagram store with fine-grained selectors.
 */

import { useDiagramStore } from "../../stores/diagramStore";

export default function StatusBar() {
  const nodeCount = useDiagramStore((state) => state.diagram.nodes.length);
  const edgeCount = useDiagramStore((state) => state.diagram.edges.length);
  const zoom = useDiagramStore((state) => state.diagram.viewport.zoom);

  return (
    <footer className="studio-status-bar" aria-label="Diagram status">
      <span>
        {nodeCount} {nodeCount === 1 ? "node" : "nodes"}
      </span>
      <span>
        {edgeCount} {edgeCount === 1 ? "edge" : "edges"}
      </span>
      <span>{Math.round(zoom * 100)}%</span>
      <span className="studio-status-bar__spacer" />
      <span>Autosaves locally</span>
    </footer>
  );
}
