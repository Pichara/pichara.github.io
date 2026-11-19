/**
 * Edge path geometry — pure helpers for drawing a connection as an SVG
 * path outside React Flow (used by the SVG/PNG export).
 *
 * Anchors match the canvas handles (`nodes/base/BaseShapeNode.tsx`):
 * the source handle sits at the bottom-center of the source node and the
 * target handle at the top-center of the target node. Line types match
 * the domain model (`types/edge.ts`): curved is a cubic bezier, straight
 * a direct line, orthogonal a right-angle step through the vertical
 * midpoint.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import type { EdgeLineType } from "../types/index.ts";

/** A node rectangle in canvas coordinates. */
export interface NodeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** An SVG path plus the point where the edge label is centered. */
export interface EdgePath {
  /** SVG path data (`d` attribute). */
  d: string;
  /** Label anchor — center of the path. */
  labelX: number;
  /** Label anchor — center of the path. */
  labelY: number;
}

/** Bottom-center anchor of a node rect (source handle). */
export function sourceAnchor(rect: NodeRect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
}

/** Top-center anchor of a node rect (target handle). */
export function targetAnchor(rect: NodeRect): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y };
}

/** Point on a cubic bezier at parameter `t` (0 = start, 1 = end). */
function cubicPoint(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const u = 1 - t;
  return (
    u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
  );
}

/**
 * Build the SVG path for an edge between two node rects.
 *
 * Curved edges bow vertically: the control points sit half the vertical
 * gap (at least 40px) beyond each anchor, mirroring React Flow's
 * bezier. Straight edges are a direct line; orthogonal edges step
 * through the vertical midpoint.
 */
export function computeEdgePath(
  source: NodeRect,
  target: NodeRect,
  lineType: EdgeLineType
): EdgePath {
  const start = sourceAnchor(source);
  const end = targetAnchor(target);
  switch (lineType) {
    case "straight":
      return {
        d: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        labelX: (start.x + end.x) / 2,
        labelY: (start.y + end.y) / 2,
      };
    case "orthogonal": {
      const midY = (start.y + end.y) / 2;
      return {
        d: `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`,
        labelX: (start.x + end.x) / 2,
        labelY: midY,
      };
    }
    case "curved": {
      const offset = Math.max(
        40,
        Math.abs(end.y - start.y) / 2
      );
      const c1y = start.y + offset;
      const c2y = end.y - offset;
      return {
        d: `M ${start.x} ${start.y} C ${start.x} ${c1y}, ${end.x} ${c2y}, ${end.x} ${end.y}`,
        labelX: cubicPoint(start.x, start.x, end.x, end.x, 0.5),
        labelY: cubicPoint(start.y, c1y, c2y, end.y, 0.5),
      };
    }
  }
}
