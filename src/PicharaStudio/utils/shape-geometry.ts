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
