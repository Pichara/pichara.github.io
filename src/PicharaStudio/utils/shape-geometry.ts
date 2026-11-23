/**
 * Shape geometry — pure helpers for the base shapes.
 *
 * Polygon shapes are drawn as SVG polygons in a 0–100 coordinate space
 * (see `nodes/base/BaseShapeNode.tsx`); rectangle and ellipse use CSS
 * instead, so they have no polygon points here. Kept free of React and
 * store dependencies so the geometry can be unit-tested in isolation
 * (see `tests/shape-library.test.mjs`).
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import type { ShapeKind } from "../types/index.ts";

/**
 * SVG polygon points for a shape, in a 0–100 viewBox.
 * Returns `null` for shapes rendered with CSS (rectangle, ellipse).
 */
export function shapePolygonPoints(shape: ShapeKind): string | null {
  switch (shape) {
    case "diamond":
      return "50,0 100,50 50,100 0,50";
    case "triangle":
      return "50,0 100,100 0,100";
    case "parallelogram":
      return "25,0 100,0 75,100 0,100";
    case "hexagon":
      return "25,0 75,0 100,50 75,100 25,100 0,50";
    case "pentagon":
      return "50,0 100,38 81,100 19,100 0,38";
    case "rectangle":
    case "ellipse":
      return null;
  }
}

/** True when the shape is drawn as an SVG polygon (not CSS). */
export function isPolygonShape(shape: ShapeKind): boolean {
  return shapePolygonPoints(shape) !== null;
}

// ---------------------------------------------------------------------------
// Resize handles
// ---------------------------------------------------------------------------

/** One corner of a node's bounding box, in the 0–100 node space. */
export type ResizeCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/** Where a resize handle's center sits, 0–100 in node space. */
export interface ResizeHandleAnchor {
  /** Horizontal position of the handle center. */
  x: number;
  /** Vertical position of the handle center. */
  y: number;
}

/** Bounding-box corner for a resize corner, in the 0–100 node space. */
const RESIZE_CORNER_POINTS: Record<ResizeCorner, ResizeHandleAnchor> = {
  "top-left": { x: 0, y: 0 },
  "top-right": { x: 100, y: 0 },
  "bottom-left": { x: 0, y: 100 },
  "bottom-right": { x: 100, y: 100 },
};

/** Center of the node's bounding box — the ray origin for anchors. */
const NODE_CENTER: ResizeHandleAnchor = { x: 50, y: 50 };

/** Tolerance for the ray/segment intersection math below. */
const GEOMETRY_EPSILON = 1e-9;

interface Point {
  x: number;
  y: number;
}

/** Parse a `shapePolygonPoints` string ("x,y x,y ...") into points. */
function parsePolygonPoints(points: string): Point[] {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    });
}

function cross(a: Point, b: Point): number {
  return a.x * b.y - a.y * b.x;
}

function subtract(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * First intersection of the ray from the node center toward `corner`
 * with one edge of the polygon, or `null` when the ray misses every
 * edge (cannot happen for a closed polygon around the center, but the
 * caller falls back to the corner itself in that case).
 */
function rayPolygonIntersection(
  vertices: Point[],
  corner: ResizeHandleAnchor
): ResizeHandleAnchor | null {
  const direction = subtract(corner, NODE_CENTER);
  let best: { t: number; point: ResizeHandleAnchor } | null = null;
  for (let i = 0; i < vertices.length; i += 1) {
    const a = vertices[i];
    const b = vertices[(i + 1) % vertices.length];
    const edge = subtract(b, a);
    const denominator = cross(direction, edge);
    if (Math.abs(denominator) < GEOMETRY_EPSILON) continue;
    const toStart = subtract(a, NODE_CENTER);
    const t = cross(toStart, edge) / denominator;
    const u = cross(toStart, direction) / denominator;
    if (
      t > GEOMETRY_EPSILON &&
      t <= 1 + GEOMETRY_EPSILON &&
      u >= -GEOMETRY_EPSILON &&
      u <= 1 + GEOMETRY_EPSILON
    ) {
      if (best === null || t < best.t) {
        best = {
          t,
          point: {
            x: NODE_CENTER.x + direction.x * t,
            y: NODE_CENTER.y + direction.y * t,
          },
        };
      }
    }
  }
  return best === null ? null : best.point;
}

/**
 * Where a corner resize handle's center sits for a shape.
 *
 * React Flow's NodeResizer anchors its four corner handles to the
 * corners of the node's rectangular bounding box — but only the
 * rectangle's outline passes through those corners. Every other
 * shape's outline only meets the box at side midpoints or vertices,
 * so the dots floated in empty space, up to ~60px from the drawn
 * border on a default-size node.
 *
 * The anchor is the point where the ray from the node center to the
 * bounding-box corner first meets the shape's outline, so the handle
 * center sits exactly on the border line for every shape:
 * - Rectangle: the corner itself — its outline runs along the box.
 * - Ellipse: closed form for the ray/ellipse crossing.
 * - Polygons: the ray/segment intersection over the polygon vertices
 *   from `shapePolygonPoints`, so the anchor can never drift from
 *   the drawn outline.
 *
 * The returned point is in the same 0–100 node space as
 * `shapePolygonPoints` and `shapeHandles`; the component renders it
 * as `left`/`top` percentages, so it tracks the shape at any size.
 * The logical resize direction is unchanged — the caller still uses
 * the corner's `NodeResizeControl` position, only its rendered
 * position moves onto the border.
 */
export function resizeHandleAnchor(
  shape: ShapeKind,
  corner: ResizeCorner
): ResizeHandleAnchor {
  const cornerPoint = RESIZE_CORNER_POINTS[corner];
  if (shape === "rectangle") return { ...cornerPoint };
  if (shape === "ellipse") {
    const dx = cornerPoint.x - NODE_CENTER.x;
    const dy = cornerPoint.y - NODE_CENTER.y;
    const scale = 1 / Math.hypot(dx / 50, dy / 50);
    return {
      x: NODE_CENTER.x + dx * scale,
      y: NODE_CENTER.y + dy * scale,
    };
  }
  const points = shapePolygonPoints(shape);
  if (points === null) return { ...cornerPoint };
  return (
    rayPolygonIntersection(parsePolygonPoints(points), cornerPoint) ?? {
      ...cornerPoint,
    }
  );
}

// ---------------------------------------------------------------------------
// Connection handles
// ---------------------------------------------------------------------------

/** Which side of a node a connection handle anchors to. */
export type HandleSide = "top" | "right" | "bottom" | "left";

/**
 * One connection attach point on a shape.
 *
 * `x`/`y` are the point in the node's 0–100 box (the same space as
 * `shapePolygonPoints`); every point sits on the shape's outline.
 * `side` is the cardinal side the React Flow handle anchors to — the
 * edge stub leaves the node in that direction.
 */
export interface ShapeHandle {
  /** Unique within the node; stored on edges as sourceHandle/targetHandle. */
  id: string;
  /** Whether an edge may leave from (source) or arrive at (target) here. */
  type: "source" | "target";
  /** Which node side the handle anchors to. */
  side: HandleSide;
  /** Horizontal position of the point, 0–100. */
  x: number;
  /** Vertical position of the point, 0–100. */
  y: number;
}

/**
 * Connection handles for a shape, in render order.
 *
 * Every attach point carries both a target and a source handle, so an
 * edge can be started from or dropped onto any of them — the dots look
 * identical (the two handles overlap exactly) and the existing handle
 * styling and hover-grow behavior apply unchanged.
 *
 * Order matters for diagrams saved before handles had ids: React Flow
 * attaches an edge with no handle id to the first handle of its type,
 * so the first target handle is always the top one and the first source
 * handle is always the bottom one, keeping those edges rendering
 * exactly where they did.
 *
 * - Ellipse: the 4 side midpoints (N/E/S/W).
 * - Triangle: the 3 vertices plus the 3 side midpoints (6 points) — the
 *   apex is the top point and the base midpoint is the bottom one, so
 *   the legacy top/bottom handles survive; the sloping-side midpoints
 *   sit at (25, 50) and (75, 50), on the outline.
 * - Every other shape: the original target-top / source-bottom pair.
 */
export function shapeHandles(shape: ShapeKind): ShapeHandle[] {
  switch (shape) {
    case "ellipse":
      return [
        { id: "target-top", type: "target", side: "top", x: 50, y: 0 },
        { id: "source-bottom", type: "source", side: "bottom", x: 50, y: 100 },
        { id: "source-top", type: "source", side: "top", x: 50, y: 0 },
        { id: "target-bottom", type: "target", side: "bottom", x: 50, y: 100 },
        { id: "target-right", type: "target", side: "right", x: 100, y: 50 },
        { id: "source-right", type: "source", side: "right", x: 100, y: 50 },
        { id: "target-left", type: "target", side: "left", x: 0, y: 50 },
        { id: "source-left", type: "source", side: "left", x: 0, y: 50 },
      ];
    case "triangle":
      return [
        { id: "target-top", type: "target", side: "top", x: 50, y: 0 },
        { id: "source-bottom", type: "source", side: "bottom", x: 50, y: 100 },
        { id: "source-top", type: "source", side: "top", x: 50, y: 0 },
        { id: "target-bottom", type: "target", side: "bottom", x: 50, y: 100 },
        // Bottom vertices, at the corners of the base.
        { id: "target-bottom-left", type: "target", side: "bottom", x: 0, y: 100 },
        { id: "source-bottom-left", type: "source", side: "bottom", x: 0, y: 100 },
        { id: "target-bottom-right", type: "target", side: "bottom", x: 100, y: 100 },
        { id: "source-bottom-right", type: "source", side: "bottom", x: 100, y: 100 },
        // Midpoints of the sloping sides.
        { id: "target-left", type: "target", side: "left", x: 25, y: 50 },
        { id: "source-left", type: "source", side: "left", x: 25, y: 50 },
        { id: "target-right", type: "target", side: "right", x: 75, y: 50 },
        { id: "source-right", type: "source", side: "right", x: 75, y: 50 },
      ];
    default:
      return [
        { id: "target-top", type: "target", side: "top", x: 50, y: 0 },
        { id: "source-bottom", type: "source", side: "bottom", x: 50, y: 100 },
      ];
  }
}
