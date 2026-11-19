/**
 * PicharaStudio type definitions — barrel re-export.
 *
 * Import all domain types from this module:
 *   import type { Diagram, DiagramNode, DiagramEdge, Viewport } from "../types";
 */

// Diagram root
export type { Diagram, DiagramType } from "./diagram";

// Nodes
export type {
  DiagramNode,
  BaseNodeData,
  BaseShapeNodeData,
  ShapeKind,
  NodePosition,
  NodeDimensions,
  NodeStyle,
} from "./node";

// Edges
export type {
  DiagramEdge,
  BaseEdgeData,
  EdgeStyle,
} from "./edge";

// Viewport
export type { Viewport } from "./viewport";

// Metadata
export type { DiagramMetadata } from "./metadata";
