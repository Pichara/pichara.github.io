/**
 * Diagram — Root container for all diagram data.
 *
 * One Diagram instance represents one complete, serializable diagram file.
 * This type is the shape of JSON export/import and LocalStorage persistence.
 */

import type { DiagramNode } from "./node";
import type { DiagramEdge } from "./edge";
import type { Viewport } from "./viewport";
import type { DiagramMetadata } from "./metadata";

// ---------------------------------------------------------------------------
// Diagram Type Discriminator
// ---------------------------------------------------------------------------

/**
 * Supported diagram categories.
 *
 * Each type determines which node/edge shapes are available in the sidebar
 * library and which default template is loaded for new diagrams.
 */
export type DiagramType =
  | "flowchart"
  | "architecture"
  | "uml-class"
  | "uml-sequence"
  | "erd"
  | "infrastructure"
  | "system-design"
  | "general";

// ---------------------------------------------------------------------------
// Diagram
// ---------------------------------------------------------------------------

export interface Diagram {
  /** Unique identifier (UUID v4). */
  id: string;

  /** User-facing diagram title. */
  name: string;

  /** Optional description. */
  description: string;

  /** Category of diagram — controls available shapes and templates. */
  diagramType: DiagramType;

  /** All nodes on the canvas. */
  nodes: DiagramNode[];

  /** All edges (connections) on the canvas. */
  edges: DiagramEdge[];

  /** Camera position and zoom level. */
  viewport: Viewport;

  /** File-level metadata (timestamps, version, author). */
  metadata: DiagramMetadata;
}
