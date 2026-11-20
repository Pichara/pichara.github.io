/**
 * Selection operations — pure helpers for copy/paste/duplicate, align
 * and distribute.
 *
 * These functions never touch the store or React Flow: they take plain
 * node/edge arrays and return new ones, so they can be unit-tested
 * without rendering. The store (`stores/diagramStore.ts`) wires them to
 * history, selection state and id generation.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import type { DiagramEdge, DiagramNode, NodePosition } from "../types";
import { resolveNodeSize } from "./node-size.ts";

/** How to line selected nodes up with each other. */
export type AlignKind =
  | "left"
  | "center-x"
  | "right"
  | "top"
  | "center-y"
  | "bottom";

/** Axis along which to space selected nodes evenly. */
export type DistributeAxis = "horizontal" | "vertical";

/** A deep-copied selection, ready to be pasted or duplicated. */
export interface SelectionSnapshot {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

/** One node's new position, keyed by node id. */
export interface NodeMove {
  id: string;
  position: NodePosition;
}

/** Deep-copy a node's data payload (label, shape, nested style). */
function cloneNodeData(node: DiagramNode): DiagramNode["data"] {
  return {
    ...node.data,
    style:
      node.data.style === undefined ? undefined : { ...node.data.style },
  };
}

/** Deep-copy an edge's data payload (label, nested style). */
function cloneEdgeData(edge: DiagramEdge): DiagramEdge["data"] {
  if (edge.data === undefined) return undefined;
  return {
    ...edge.data,
    style:
      edge.data.style === undefined ? undefined : { ...edge.data.style },
  };
}

/**
 * Snapshot the current selection for the clipboard: deep copies of the
 * selected nodes and of the edges whose *both* ends are selected
 * (dangling edges are dropped — a paste must never reference a node
 * that was not copied). Selection flags are cleared in the snapshot;
 * pasting re-selects the clones.
 */
export function snapshotSelection(
  nodes: DiagramNode[],
  edges: DiagramEdge[]
): SelectionSnapshot {
  const selectedNodes = nodes.filter((node) => node.selected);
  const selectedIds = new Set(selectedNodes.map((node) => node.id));
  return {
    nodes: selectedNodes.map((node) => ({
      ...node,
      data: cloneNodeData(node),
      selected: false,
      dragging: undefined,
    })),
    edges: edges
      .filter(
        (edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target)
      )
      .map((edge) => ({
        ...edge,
        data: cloneEdgeData(edge),
        selected: false,
      })),
  };
}

/**
 * Clone a snapshot into fresh elements: new ids (via `newId`), positions
 * shifted by `offset` on both axes, and edges re-pointed at the cloned
 * node ids. The clones come back selected. The snapshot itself is not
 * mutated, so the same clipboard can be pasted again.
 */
export function cloneSelection(
  snapshot: SelectionSnapshot,
  offset: number,
  newId: (oldId: string) => string
): SelectionSnapshot {
  const idMap = new Map(
    snapshot.nodes.map((node) => [node.id, newId(node.id)])
  );
  return {
    nodes: snapshot.nodes.map((node) => ({
      ...node,
      id: idMap.get(node.id) ?? node.id,
      position: {
        x: node.position.x + offset,
        y: node.position.y + offset,
      },
      data: cloneNodeData(node),
      selected: true,
      dragging: undefined,
    })),
    edges: snapshot.edges.map((edge) => ({
      ...edge,
      id: newId(edge.id),
      source: idMap.get(edge.source) ?? edge.source,
      target: idMap.get(edge.target) ?? edge.target,
      data: cloneEdgeData(edge),
      selected: true,
    })),
  };
}

interface NodeBox {
  id: string;
  left: number;
  right: number;
  centerX: number;
  top: number;
  bottom: number;
  centerY: number;
  width: number;
  height: number;
}

/** Bounding box of a node, using its rendered size (0 falls back to defaults). */
function nodeBox(node: DiagramNode): NodeBox {
  const { width, height } = resolveNodeSize(node.width, node.height);
  return {
    id: node.id,
    left: node.position.x,
    right: node.position.x + width,
    centerX: node.position.x + width / 2,
    top: node.position.y,
    bottom: node.position.y + height,
    centerY: node.position.y + height / 2,
    width,
    height,
  };
}

/**
 * Remove the current selection: selected nodes go away, and so do
 * selected edges plus any edge attached to a removed node (an edge must
 * never dangle). Unselected, unattached elements are kept as-is.
 * Returns new arrays; the inputs are not mutated.
 */
export function removeSelection(
  nodes: DiagramNode[],
  edges: DiagramEdge[]
): { nodes: DiagramNode[]; edges: DiagramEdge[] } {
  const removedIds = new Set(
    nodes.filter((node) => node.selected).map((node) => node.id)
  );
  return {
    nodes: nodes.filter((node) => !node.selected),
    edges: edges.filter(
      (edge) =>
        !edge.selected &&
        !removedIds.has(edge.source) &&
        !removedIds.has(edge.target)
    ),
  };
}

/**
 * New positions that line the given nodes up with each other.
 * Returns an empty array when fewer than two nodes are given.
 *
 * - left / right: edges flush with the leftmost / rightmost edge.
 * - center-x: horizontal centers on the selection's midline.
 * - top / bottom / center-y: the vertical equivalents.
 */
export function alignNodes(
  nodes: DiagramNode[],
  kind: AlignKind
): NodeMove[] {
  if (nodes.length < 2) return [];
  const boxes = nodes.map(nodeBox);
  const minLeft = Math.min(...boxes.map((box) => box.left));
  const maxRight = Math.max(...boxes.map((box) => box.right));
  const midX = (minLeft + maxRight) / 2;
  const minTop = Math.min(...boxes.map((box) => box.top));
  const maxBottom = Math.max(...boxes.map((box) => box.bottom));
  const midY = (minTop + maxBottom) / 2;
  return boxes.map((box) => {
    switch (kind) {
      case "left":
        return { id: box.id, position: { x: minLeft, y: box.top } };
      case "center-x":
        return {
          id: box.id,
          position: { x: midX - box.width / 2, y: box.top },
        };
      case "right":
        return {
          id: box.id,
          position: { x: maxRight - box.width, y: box.top },
        };
      case "top":
        return { id: box.id, position: { x: box.left, y: minTop } };
      case "center-y":
        return {
          id: box.id,
          position: { x: box.left, y: midY - box.height / 2 },
        };
      case "bottom":
        return {
          id: box.id,
          position: { x: box.left, y: maxBottom - box.height },
        };
    }
  });
}

/**
 * New positions that space the given nodes evenly along an axis.
 * The first and last nodes (by center on that axis) stay put; the
 * ones between get evenly spaced centers. Returns an empty array when
 * fewer than three nodes are given — with two nodes there is nothing
 * to space.
 */
export function distributeNodes(
  nodes: DiagramNode[],
  axis: DistributeAxis
): NodeMove[] {
  if (nodes.length < 3) return [];
  const boxes = nodes.map(nodeBox);
  const centerOf = (box: NodeBox): number =>
    axis === "horizontal" ? box.centerX : box.centerY;
  const sorted = [...boxes].sort((a, b) => centerOf(a) - centerOf(b));
  const first = centerOf(sorted[0]);
  const last = centerOf(sorted[sorted.length - 1]);
  const step = (last - first) / (sorted.length - 1);
  return sorted.map((box, index) => {
    const center = first + step * index;
    if (axis === "horizontal") {
      return {
        id: box.id,
        position: { x: center - box.width / 2, y: box.top },
      };
    }
    return {
      id: box.id,
      position: { x: box.left, y: center - box.height / 2 },
    };
  });
}
