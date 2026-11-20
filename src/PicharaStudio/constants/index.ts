/**
 * PicharaStudio constants — barrel re-export.
 */

export {
  DIAGRAM_SCHEMA_VERSION,
  DEFAULT_VIEWPORT,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_STEP,
  DEFAULT_NODE_STYLE,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
  MIN_NODE_WIDTH,
  MIN_NODE_HEIGHT,
  GRID_SIZE,
  GROUP_NODE_TYPE,
  DEFAULT_GROUP_LABEL,
  GROUP_PADDING,
  DEFAULT_EDGE_STYLE,
  createDefaultMetadata,
  MAX_HISTORY_SIZE,
  STORAGE_KEY_PREFIX,
  STORAGE_INDEX_KEY,
} from "./defaults.ts";

export {
  SHAPE_LIBRARY,
  SHAPE_DRAG_MIME_TYPE,
} from "./shapes.ts";
export type {
  ShapeLibraryCategory,
  ShapeLibraryEntry,
} from "./shapes.ts";
