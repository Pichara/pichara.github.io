/**
 * Selection toolbar positioning — pure helpers for the floating bar that
 * appears next to the current selection (Group / Ungroup). Copy,
 * Duplicate and Paste are keyboard-only and have no buttons in the bar.
 *
 * The bar lives in canvas pixels: the selection bounds are in flow units
 * and the viewport maps them to the canvas element. Keeping the math
 * here (instead of in the component) makes it unit-testable without
 * rendering React Flow.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import type { DiagramNode } from "../types/node.ts";
import type { DiagramEdge } from "../types/edge.ts";
import { resolveNodeSize } from "./node-size.ts";

/** Bounding box of a set of nodes, in flow coordinates. */
export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A viewport mapping flow coordinates to canvas pixels. */
export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

/** A rectangle size in pixels. */
export interface BoxSize {
  width: number;
  height: number;
}

/** Where the floating bar goes, in canvas pixels. */
export interface SelectionBarPlacement {
  left: number;
  top: number;
  /** True when the bar sits below the selection (no room above it). */
  below: boolean;
}

/** Gap in pixels between the bar and the selection edge. */
export const SELECTION_BAR_GAP_PX = 12;

/** Minimum distance from the bar to the canvas edges. */
export const SELECTION_BAR_MARGIN_PX = 8;

/**
 * Bounding box of the selected nodes, in flow coordinates, or null when
 * nothing is selected.
 *
 * Top-level nodes only: children of a group move with their parent, and
 * a selected group node already covers its children. When only grouped
 * children are selected, their own boxes are used instead.
 */
export function selectionBounds(
  nodes: readonly DiagramNode[]
): SelectionBounds | null {
  const topLevel = nodes.filter(
    (node) => node.selected && node.parentId === undefined
  );
  const picked =
    topLevel.length > 0
      ? topLevel
      : nodes.filter((node) => node.selected);
  if (picked.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of picked) {
    const { width, height } = resolveNodeSize(node.width, node.height);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Bounding box of the endpoint nodes of the selected edges, in flow
 * coordinates, or null when no selected edge has a resolvable endpoint.
 * Used to anchor the format popup when the selection is edges only
 * (there are no selected nodes for `selectionBounds` to cover).
 */
export function edgeEndpointBounds(
  edges: readonly DiagramEdge[],
  nodes: readonly DiagramNode[]
): SelectionBounds | null {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const endpoints: DiagramNode[] = [];
  for (const edge of edges) {
    if (!edge.selected) continue;
    for (const nodeId of [edge.source, edge.target]) {
      const node = byId.get(nodeId);
      if (node !== undefined && !endpoints.includes(node)) {
        endpoints.push(node);
      }
    }
  }
  if (endpoints.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of endpoints) {
    const { width, height } = resolveNodeSize(node.width, node.height);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Place the floating bar above the selection, or below it when there is
 * no room above. The bar is centered on the selection and clamped
 * inside the canvas with a small margin.
 */
export function selectionBarPlacement(
  bounds: SelectionBounds,
  viewport: ViewportState,
  container: BoxSize,
  bar: BoxSize
): SelectionBarPlacement {
  const centerX =
    (bounds.x + bounds.width / 2) * viewport.zoom + viewport.x;
  const topY = bounds.y * viewport.zoom + viewport.y;
  const bottomY = (bounds.y + bounds.height) * viewport.zoom + viewport.y;
  const maxLeft = Math.max(
    SELECTION_BAR_MARGIN_PX,
    container.width - bar.width - SELECTION_BAR_MARGIN_PX
  );
  const left = Math.min(
    Math.max(centerX - bar.width / 2, SELECTION_BAR_MARGIN_PX),
    maxLeft
  );
  const aboveTop = topY - bar.height - SELECTION_BAR_GAP_PX;
  if (aboveTop >= SELECTION_BAR_MARGIN_PX) {
    return { left, top: aboveTop, below: false };
  }
  return { left, top: bottomY + SELECTION_BAR_GAP_PX, below: true };
}
