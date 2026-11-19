/**
 * Node sizing — pure helpers for the rendered size of a shape node.
 *
 * React Flow v13 passes the node's *measured* dimensions as the `width` /
 * `height` props of a custom node — and a freshly added node measures 0x0
 * before its first paint, so the props arrive as 0, not `undefined`. A
 * plain `width ?? DEFAULT_NODE_WIDTH` would keep the 0 and the node would
 * render invisible (and then keep measuring 0x0, so it never recovers).
 * Treat 0 like "no size yet" and fall back to the defaults; once the node
 * is resized, the props carry the real size (> 0) and are used as-is.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
} from "../constants/defaults.ts";

/** Render size for a shape node, defaulting when no real size is known. */
export function resolveNodeSize(
  width: number | undefined,
  height: number | undefined
): { width: number; height: number } {
  return {
    width: width !== undefined && width > 0 ? width : DEFAULT_NODE_WIDTH,
    height: height !== undefined && height > 0 ? height : DEFAULT_NODE_HEIGHT,
  };
}
