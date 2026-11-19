/**
 * Pure geometry helpers for the diagram canvas.
 */

import type { NodePosition, Viewport } from "../types";
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from "../constants";

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
