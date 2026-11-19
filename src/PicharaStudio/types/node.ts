/**
 * Node types — Domain model for diagram nodes.
 *
 * These types wrap React Flow's Node model with application-specific data.
 * All types must remain JSON-serializable.
 */

// ---------------------------------------------------------------------------
// Position & Dimensions
// ---------------------------------------------------------------------------

/** Canvas coordinates for the top-left corner of a node. */
export interface NodePosition {
  x: number;
  y: number;
}

/** Explicit dimensions of a node in canvas units (pixels at zoom 1). */
export interface NodeDimensions {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Node Styling
// ---------------------------------------------------------------------------

/**
 * Visual style properties for a node.
 *
 * All fields are optional — when omitted, the renderer uses defaults
 * from `constants/defaults.ts`.
 */
export interface NodeStyle {
  /** Fill color (any CSS color value). */
  backgroundColor?: string;

  /** Border/stroke color. */
  borderColor?: string;

  /** Border width in pixels. */
  borderWidth?: number;

  /** Corner radius in pixels. */
  borderRadius?: number;

  /** Text fill color. */
  textColor?: string;

  /** Text size in pixels. */
  fontSize?: number;

  /** CSS font-weight value. */
  fontWeight?: string;

  /** Opacity: 0.0 (transparent) to 1.0 (opaque). */
  opacity?: number;
}

// ---------------------------------------------------------------------------
// Node Data Payloads
// ---------------------------------------------------------------------------

/**
 * Base data payload every node carries.
 *
 * Custom node types extend this interface to add domain-specific fields.
 * Example: `ServiceNodeData extends BaseNodeData { serviceType: string }`
 */
export interface BaseNodeData {
  /** Primary display text. */
  label: string;

  /** Optional secondary descriptive text. */
  description?: string;

  /** Visual customization (overrides defaults). */
  style?: NodeStyle;
}

// ---------------------------------------------------------------------------
// DiagramNode
// ---------------------------------------------------------------------------

/**
 * A visual element on the canvas.
 *
 * Generic parameter T allows strongly typed data payloads per node category.
 * When T is not specified, it defaults to `BaseNodeData`.
 *
 * This type is designed to map 1:1 to React Flow's `Node<T>` type at runtime.
 */
export interface DiagramNode<T extends BaseNodeData = BaseNodeData> {
  /** Unique node identifier. */
  id: string;

  /**
   * Registered React Flow node type key (e.g. "default", "architecture-service").
   * Must match a key in the `nodeTypes` map passed to `<ReactFlow>`.
   */
  type: string;

  /** Canvas coordinates (top-left corner). */
  position: NodePosition;

  /** Type-specific data payload. */
  data: T;

  /** Measured or explicit width in pixels. */
  width?: number;

  /** Measured or explicit height in pixels. */
  height?: number;

  /**
   * Whether the node is currently selected.
   * Transient UI state — not persisted in export.
   */
  selected?: boolean;

  /**
   * Whether the node is currently being dragged.
   * Transient UI state — not persisted in export.
   */
  dragging?: boolean;

  /**
   * Parent node ID for grouping.
   * When set, this node is visually contained within the parent.
   * Used for compound diagrams (e.g. services inside a VPC).
   */
  parentId?: string;
}
