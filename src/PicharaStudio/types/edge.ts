/**
 * Edge types — Domain model for diagram edges (connections).
 *
 * These types wrap React Flow's Edge model with application-specific data.
 * All types must remain JSON-serializable.
 */

// ---------------------------------------------------------------------------
// Edge Styling
// ---------------------------------------------------------------------------

/**
 * Visual style properties for an edge.
 *
 * All fields are optional — when omitted, the renderer uses defaults
 * from `constants/defaults.ts`.
 */
export interface EdgeStyle {
  /** Line color (any CSS color value). */
  strokeColor?: string;

  /** Line width in pixels. */
  strokeWidth?: number;

  /** SVG dash pattern (e.g. "5,5" for dashed, "10,5,2,5" for dash-dot). */
  strokeDasharray?: string;

  /** Whether to show an animated flow indicator along the edge. */
  animated?: boolean;

  /** Opacity: 0.0 (transparent) to 1.0 (opaque). */
  opacity?: number;
}

// ---------------------------------------------------------------------------
// Edge Data Payloads
// ---------------------------------------------------------------------------

/**
 * Base data payload for edges.
 *
 * Custom edge types extend this type to add domain-specific fields.
 * Example: `DependencyEdgeData extends BaseEdgeData { dependencyType: string }`
 *
 * Defined as a `type` (not an `interface`) so it stays assignable to
 * React Flow's `Record<string, unknown>` data constraint — TypeScript
 * interfaces do not get an implicit index signature.
 */
export type BaseEdgeData = {
  /** Text displayed along the edge path. */
  label?: string;

  /** Visual customization (overrides defaults). */
  style?: EdgeStyle;
};

// ---------------------------------------------------------------------------
// DiagramEdge
// ---------------------------------------------------------------------------

/**
 * A connection between two nodes on the canvas.
 *
 * Generic parameter T allows strongly typed data payloads per edge category.
 * When T is not specified, it defaults to `BaseEdgeData`.
 *
 * This type is designed to map 1:1 to React Flow's `Edge<T>` type at runtime.
 */
export interface DiagramEdge<T extends BaseEdgeData = BaseEdgeData> {
  /** Unique edge identifier. */
  id: string;

  /**
   * Registered React Flow edge type key (e.g. "default", "dependency").
   * Must match a key in the `edgeTypes` map passed to `<ReactFlow>`.
   */
  type: string;

  /** Source node ID — where the edge originates. */
  source: string;

  /** Target node ID — where the edge terminates. */
  target: string;

  /**
   * Specific handle on the source node.
   * When omitted, React Flow uses the default source handle.
   */
  sourceHandle?: string;

  /**
   * Specific handle on the target node.
   * When omitted, React Flow uses the default target handle.
   */
  targetHandle?: string;

  /** Type-specific data payload. */
  data?: T;

  /**
   * Whether the edge is currently selected.
   * Transient UI state — not persisted in export.
   */
  selected?: boolean;
}
