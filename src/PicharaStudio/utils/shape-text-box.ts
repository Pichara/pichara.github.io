/**
 * Shape text box — where a shape's label may sit, and how it shrinks
 * to fit.
 *
 * A shape's label used to render in a full-width content layer, so long
 * text (or text on a narrow shape) spilled past the outline: the top
 * and bottom rows of a diamond are only a few pixels wide, the top of
 * a triangle is a point, and the ellipse curves away from the box
 * corners. The fix has two parts:
 *
 * 1. Safe box (`shapeTextBox`): a centered rectangle, in 0–100 node
 *    space, that lies strictly inside the shape's outline. Every
 *    corner of the box — and every sampled point along its edges —
 *    is inside the shape (see `tests/shape-text-box.test.mjs`), so
 *    text laid out inside the box can never cross the outline.
 *    The box is per-shape because the usable interior differs:
 *    a rectangle can use nearly the whole box, while a diamond's
 *    interior is widest at the middle and a triangle's is widest
 *    at the base, so their boxes sit lower and narrower.
 * 2. Shrink-to-fit (`computeFitScale`): when the wrapped label is
 *    taller or wider than the box, the component scales the font
 *    down (never below `MIN_FIT_SCALE`) until it fits, instead of
 *    letting it overflow. `overflow: hidden` on the content layer
 *    (see `DiagramStudio.css`) is the backstop for text that still
 *    does not fit at the minimum size.
 *
 * Kept free of React and store dependencies so the geometry and the
 * fit decision can be unit-tested in isolation.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner
 * can resolve them (see `utils/history-stack.ts` for the same
 * convention).
 */

import type { ShapeKind } from "../types/index.ts";

/**
 * Safe text box for a shape, as percentages of the node's bounding
 * box (0–100 in each axis). `left + width <= 100` and
 * `top + height <= 100` for every shape.
 */
export interface ShapeTextBox {
  /** Left edge of the box, in percent of node width. */
  left: number;
  /** Top edge of the box, in percent of node height. */
  top: number;
  /** Box width, in percent of node width. */
  width: number;
  /** Box height, in percent of node height. */
  height: number;
}

/**
 * The safe text box for a shape.
 *
 * Derivation (all shapes are convex, so a rectangle is inside the
 * shape exactly when its four corners are):
 * - Rectangle: nearly the whole box — 6% horizontal / 8% vertical
 *   insets clear the border and the 8px corner radius.
 * - Ellipse: the inscribed rectangle with margin — the corners sit
 *   at 17% / 83%, where ((17 - 50) / 50)^2 * 2 = 0.87 < 1, so they
 *   are inside the ellipse with room to spare.
 * - Diamond: the outline is |x - 50| / 50 + |y - 50| / 50 = 1, so a
 *   corner at (22, 32) scores 28/50 + 18/50 = 0.92 — inside, with
 *   an 8% margin. The box is wider than tall (56 x 36) because
 *   labels are wider than tall.
 * - Triangle: the outline widens toward the base — at height y the
 *   half-width is y / 2 — so the box sits in the lower half
 *   (top 54%, height 42%): at its top edge the shape spans x 23–77
 *   and the box spans 26–74.
 * - Parallelogram: the sides slant 25% over the full height, so a
 *   centered box spanning the middle 48% of the height can be 58%
 *   wide: at its top edge the shape spans x 18.5–93.5 and the box
 *   spans 21–79.
 * - Hexagon: the top and bottom edges span x 25–75 and the sides
 *   slope out to the midpoints, so a box at top 18% / height 64%
 *   can be 60% wide: at its top edge the shape spans x 16–84 and
 *   the box spans 20–80.
 * - Pentagon: the apex narrows the top, so the box starts at 26%
 *   and is 60% wide: at its top edge the shape spans x 15.8–84.2
 *   and the box spans 20–80; at its bottom edge the shape spans
 *   x 17.2–82.8.
 */
export function shapeTextBox(shape: ShapeKind): ShapeTextBox {
  switch (shape) {
    case "rectangle":
      return { left: 6, top: 8, width: 88, height: 84 };
    case "ellipse":
      return { left: 17, top: 17, width: 66, height: 66 };
    case "diamond":
      return { left: 22, top: 32, width: 56, height: 36 };
    case "triangle":
      return { left: 26, top: 54, width: 48, height: 42 };
    case "parallelogram":
      return { left: 21, top: 26, width: 58, height: 48 };
    case "hexagon":
      return { left: 20, top: 18, width: 60, height: 64 };
    case "pentagon":
      return { left: 20, top: 26, width: 60, height: 68 };
  }
}

// ---------------------------------------------------------------------------
// Shrink-to-fit
// ---------------------------------------------------------------------------

/** Smallest font scale the shrink-to-fit may apply (45% of base size). */
export const MIN_FIT_SCALE = 0.45;

/**
 * Largest shrink step applied in one pass. The component re-measures
 * after each step, so a long label converges in a few passes instead
 * of jumping straight to the minimum.
 */
export const FIT_SCALE_STEP = 0.9;

/** Measured sizes of the content layer, in CSS pixels. */
export interface FitMeasurements {
  /** Full content height, including the part clipped by overflow. */
  scrollHeight: number;
  /** Full content width, including the part clipped by overflow. */
  scrollWidth: number;
  /** Visible height of the content layer. */
  clientHeight: number;
  /** Visible width of the content layer. */
  clientWidth: number;
}

/**
 * Next font scale for a label that may overflow its box.
 *
 * - Fits already (or a zero-size box, e.g. before first layout):
 *   keep the current scale.
 * - Overflows: shrink by the overflow ratio — how much bigger the
 *   content is than the box — capped at one `FIT_SCALE_STEP` per
 *   pass so the size eases down instead of collapsing, and never
 *   below `MIN_FIT_SCALE`. The caller re-measures and calls again
 *   until the label fits or the minimum is reached.
 */
export function computeFitScale(
  measured: FitMeasurements,
  currentScale: number
): number {
  if (measured.clientHeight <= 0 || measured.clientWidth <= 0) {
    return currentScale;
  }
  const heightRatio = measured.clientHeight / measured.scrollHeight;
  const widthRatio = measured.clientWidth / measured.scrollWidth;
  const overflowRatio = Math.min(heightRatio, widthRatio);
  if (overflowRatio >= 1) return currentScale;
  if (currentScale <= MIN_FIT_SCALE) return currentScale;
  return Math.max(
    MIN_FIT_SCALE,
    currentScale * Math.min(overflowRatio, FIT_SCALE_STEP)
  );
}
