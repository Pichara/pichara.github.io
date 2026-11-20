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
