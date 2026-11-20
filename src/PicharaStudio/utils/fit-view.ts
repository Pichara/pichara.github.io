/**
 * Zoom-to-fit math — pure helpers for framing the whole diagram.
 *
 * React Flow's own `fitView` is deliberately NOT used here, for two
 * reasons found while debugging the zoom (2026-11-20, design fix run 4):
 *
 * 1. It only frames nodes with measured dimensions — a freshly added
 *    node still measures 0x0, so it is left out of the bounds and the
 *    fit can leave it cut off.
 * 2. It animates through a d3 transition that fights the controlled
 *    viewport, so the camera can stall part-way (observed: 275% -> 248%
 *    with a node still cut off at the bottom).
 *
 * Instead the bounds are computed from the store's nodes at their
 * rendered size (`resolveNodeSize` treats 0 as "no size yet", so fresh
 * nodes count at 180x60), and the viewport is applied instantly with
 * `setViewport` — the same path wheel zoom and panning use.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import type { DiagramNode } from "../types/node.ts";
import { resolveNodeSize } from "./node-size.ts";

/** Bounds of the diagram, in flow coordinates. */
export interface FitBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Viewport (camera) in flow coordinates. */
export interface FitViewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Fraction of the pane kept as margin around the diagram on each side —
 * the same 0.2 padding the old `fitView` call used.
 */
export const FIT_VIEW_PADDING = 0.2;

/**
 * True when a fit should run: not the first render (the store starts at
 * request 0, which is not a user request, and a restored diagram keeps
 * its saved viewport on load), and there is at least one node to frame.
 */
export function shouldFitView(
  isFirstRun: boolean,
  nodeCount: number
): boolean {
  return !isFirstRun && nodeCount > 0;
}

/**
 * Bounding box of the whole diagram, in flow coordinates, or null when
 * there is nothing to frame.
 *
 * Top-level nodes only: a group already covers its children, and
 * children carry positions relative to their parent. When there are no
 * top-level nodes (only grouped children, which cannot happen on its
 * own), the children themselves are used.
 */
export function diagramBounds(
  nodes: readonly DiagramNode[]
): FitBounds | null {
  const topLevel = nodes.filter((node) => node.parentId === undefined);
  const picked = topLevel.length > 0 ? topLevel : nodes;
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
 * Viewport that frames `bounds` inside a pane of `paneWidth` x
 * `paneHeight` screen pixels, with a `padding` margin (fraction of the
 * pane) on each side. Mirrors React Flow's `getViewportForBounds`: the
 * zoom is the largest that still fits, clamped to `[minZoom, maxZoom]`,
 * and the bounds are centered. Returns null when the pane has no size
 * yet or the bounds are empty.
 */
export function viewportForBounds(
  bounds: FitBounds,
  paneWidth: number,
  paneHeight: number,
  minZoom: number,
  maxZoom: number,
  padding: number = FIT_VIEW_PADDING
): FitViewport | null {
  if (paneWidth <= 0 || paneHeight <= 0) return null;
  if (bounds.width <= 0 || bounds.height <= 0) return null;
  const padX = padding * paneWidth;
  const padY = padding * paneHeight;
  const zoom = Math.min(
    Math.max(
      Math.min(
        (paneWidth - 2 * padX) / bounds.width,
        (paneHeight - 2 * padY) / bounds.height
      ),
      minZoom
    ),
    maxZoom
  );
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  return {
    x: paneWidth / 2 - centerX * zoom,
    y: paneHeight / 2 - centerY * zoom,
    zoom,
  };
}
