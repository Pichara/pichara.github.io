/**
 * Default values and configuration constants for Pichara Diagram Studio.
 *
 * These values are used as fallbacks when nodes, edges, or diagrams
 * do not specify explicit values. Keep them in sync with the data model.
 */

import type { Viewport, NodeStyle, EdgeStyle, DiagramMetadata } from "../types";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

/** Current diagram data format version (semver). */
export const DIAGRAM_SCHEMA_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Viewport
// ---------------------------------------------------------------------------

/** Initial camera position for new diagrams. */
export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

/** Minimum zoom level (zoomed out). */
export const MIN_ZOOM = 0.1;

/** Maximum zoom level (zoomed in). */
export const MAX_ZOOM = 4;

/** Zoom step per scroll or button press. */
export const ZOOM_STEP = 0.1;

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

/** Default visual style for nodes without explicit styling.
 * Matrix theme (matches the portfolio): dark fill, green border, light
 * text. Nodes never store a style unless the user changes one, so this
 * re-themes every existing diagram too. */
export const DEFAULT_NODE_STYLE: Required<NodeStyle> = {
  backgroundColor: "#071a0e",
  borderColor: "#4bcc7b",
  borderWidth: 1,
  borderRadius: 8,
  textColor: "#eafff0",
  fontSize: 14,
  fontWeight: "500",
  opacity: 1,
};

/** Default width for new nodes (in canvas pixels). */
export const DEFAULT_NODE_WIDTH = 180;

/** Default height for new nodes (in canvas pixels). */
export const DEFAULT_NODE_HEIGHT = 60;

/** Smallest width a node can be resized to (in canvas pixels). */
export const MIN_NODE_WIDTH = 80;

/** Smallest height a node can be resized to (in canvas pixels). */
export const MIN_NODE_HEIGHT = 40;

/** Snap-to-grid increment (in canvas pixels). Set to 0 to disable. */
export const GRID_SIZE = 15;

// ---------------------------------------------------------------------------
// Groups
// ---------------------------------------------------------------------------

/** React Flow node type key for group container nodes. */
export const GROUP_NODE_TYPE = "group";

/** Default label for a newly created group. */
export const DEFAULT_GROUP_LABEL = "Group";

/** Padding (canvas px) between a group's border and its children. */
export const GROUP_PADDING = 24;

// ---------------------------------------------------------------------------
// Edges
// ---------------------------------------------------------------------------

/** Default visual style for edges without explicit styling.
 * Matrix theme: green stroke on the dark canvas. */
export const DEFAULT_EDGE_STYLE: Required<EdgeStyle> = {
  strokeColor: "#4ade80",
  strokeWidth: 1.5,
  strokeDasharray: "",
  animated: false,
  opacity: 1,
  lineType: "curved",
  arrow: true,
};

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

/** Create default metadata for a new diagram. */
export function createDefaultMetadata(): DiagramMetadata {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    updatedAt: now,
    version: DIAGRAM_SCHEMA_VERSION,
  };
}

// ---------------------------------------------------------------------------
// History / Undo-Redo
// ---------------------------------------------------------------------------

/** Maximum number of undo steps retained. */
export const MAX_HISTORY_SIZE = 50;

// ---------------------------------------------------------------------------
// LocalStorage
// ---------------------------------------------------------------------------

/** LocalStorage key prefix for diagram data. */
export const STORAGE_KEY_PREFIX = "pichara-studio";

/** LocalStorage key for the list of saved diagram IDs. */
export const STORAGE_INDEX_KEY = `${STORAGE_KEY_PREFIX}:index`;
