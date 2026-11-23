/**
 * Pure geometry helpers for the diagram canvas.
 */

import type { NodePosition, Viewport } from "../types";
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
} from "../constants/defaults.ts";

/**
 * Compute where a newly added node should be placed: the center of the
 * visible viewport, shifted by `spawnOffset` so consecutive nodes cascade
 * instead of stacking exactly on top of each other.
 *
 * `containerWidth` / `containerHeight` are the canvas size in screen pixels.
 */
export function computeSpawnPosition(
  viewport: Viewport,
  spawnOffset: number,
  containerWidth: number,
  containerHeight: number
): NodePosition {
  const centerX =
    (containerWidth / 2 - viewport.x) / viewport.zoom -
    DEFAULT_NODE_WIDTH / 2;
  const centerY =
    (containerHeight / 2 - viewport.y) / viewport.zoom -
    DEFAULT_NODE_HEIGHT / 2;
  return { x: centerX + spawnOffset, y: centerY + spawnOffset };
}

/**
 * Spawn position from the canvas pane's bounding rect (the
 * `.studio-canvas` wrapper, which the React Flow pane fills exactly).
 *
 * This is the click-to-add path: the pane — not the window — is the
 * visible canvas, so its width/height are the container size. No fixed
 * panel widths are subtracted: on desktop the sidebar narrows the pane
 * and on mobile the library is an overlay drawer that leaves the pane
 * full-width, and the rect already reflects whichever layout is live.
 * Only the rect's size matters here — React Flow's viewport offset is
 * relative to the pane's own origin, so `left`/`top` never enter the
 * formula (mirrors `computeDropPosition`, which subtracts them from
 * client coordinates for the same reason).
 */
export function computeSpawnPositionFromPane(
  paneRect: { width: number; height: number },
  viewport: Viewport,
  spawnOffset: number
): NodePosition {
  return computeSpawnPosition(
    viewport,
    spawnOffset,
    paneRect.width,
    paneRect.height
  );
}

/**
 * Convert a drop point (client/screen pixels) into canvas coordinates,
 * centering the new node under the cursor.
 *
 * `containerRect` is the canvas element's bounding rect; `viewport` is
 * the current camera (x/y offset and zoom). This mirrors React Flow's
 * `screenToFlowPosition` for a point inside the container.
 */
export function computeDropPosition(
  clientX: number,
  clientY: number,
  containerRect: { left: number; top: number },
  viewport: Viewport
): NodePosition {
  return {
    x:
      (clientX - containerRect.left - viewport.x) / viewport.zoom -
      DEFAULT_NODE_WIDTH / 2,
    y:
      (clientY - containerRect.top - viewport.y) / viewport.zoom -
      DEFAULT_NODE_HEIGHT / 2,
  };
}

/**
 * Round a canvas position to the nearest grid intersection, so a dropped
 * or spawned node lands exactly on the grid when snap is enabled.
 * `gridSize` must be positive; exact multiples are unchanged.
 */
export function snapPosition(
  position: NodePosition,
  gridSize: number
): NodePosition {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/** Bounding box of canvas rects, as min/max edges. */
export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Bounding box covering every given rect (canvas coordinates).
 * Callers must pass at least one rect; an empty list yields
 * infinities, matching the manual loop this replaces.
 */
export function boundingBox(
  rects: { x: number; y: number; width: number; height: number }[]
): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  return { minX, minY, maxX, maxY };
}
