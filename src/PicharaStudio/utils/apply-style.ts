/**
 * Style helpers — pure functions for resolving and applying node/edge styles.
 *
 * Kept free of React and store dependencies so the style rules can be
 * unit-tested in isolation (see `tests/apply-style.test.mjs`). The diagram
 * store (`stores/diagramStore.ts`) is a thin wrapper around these functions.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import {
  MarkerType,
  type EdgeMarker,
} from "@xyflow/react";
import {
  DEFAULT_EDGE_STYLE,
  DEFAULT_NODE_STYLE,
} from "../constants/defaults.ts";
import type {
  DiagramEdge,
  DiagramNode,
  EdgeLineType,
  EdgeStyle,
  NodeStyle,
} from "../types/index.ts";

// ---------------------------------------------------------------------------
// Resolving (style overrides + defaults)
// ---------------------------------------------------------------------------

/** Node style with every field filled in from the defaults. */
export function resolveNodeStyle(style?: NodeStyle): Required<NodeStyle> {
  return { ...DEFAULT_NODE_STYLE, ...style };
}

/** Edge style with every field filled in from the defaults. */
export function resolveEdgeStyle(style?: EdgeStyle): Required<EdgeStyle> {
  return { ...DEFAULT_EDGE_STYLE, ...style };
}

// ---------------------------------------------------------------------------
// Applying (immutable updates)
// ---------------------------------------------------------------------------

/**
 * Return a copy of `node` with `patch` merged into `data.style`.
 * Nodes without an existing style start from an empty override.
 */
export function applyNodeStyle(
  node: DiagramNode,
  patch: Partial<NodeStyle>
): DiagramNode {
  return {
    ...node,
    data: { ...node.data, style: { ...node.data.style, ...patch } },
  };
}

/**
 * Return a copy of `edge` with `patch` merged into `data.style`.
 * Edges without a data payload yet get one created.
 */
export function applyEdgeStyle(
  edge: DiagramEdge,
  patch: Partial<EdgeStyle>
): DiagramEdge {
  const data = edge.data ?? {};
  return {
    ...edge,
    data: { ...data, style: { ...data.style, ...patch } },
  };
}

/** Return a copy of `node` with all style overrides removed (back to defaults). */
export function clearNodeStyle(node: DiagramNode): DiagramNode {
  const data = { ...node.data };
  delete data.style;
  return { ...node, data };
}

/** Return a copy of `edge` with all style overrides removed (back to defaults). */
export function clearEdgeStyle(edge: DiagramEdge): DiagramEdge {
  if (edge.data === undefined) return edge;
  const data = { ...edge.data };
  delete data.style;
  return { ...edge, data };
}

// ---------------------------------------------------------------------------
// React Flow presentation
// ---------------------------------------------------------------------------

/** React Flow edge type key for each domain line type. */
const LINE_TYPE_TO_FLOW_TYPE: Record<EdgeLineType, string> = {
  curved: "default",
  straight: "straight",
  orthogonal: "step",
};

/** React Flow props derived from an edge's style overrides. */
export interface EdgePresentation {
  /** React Flow edge type key (curved → "default", straight, orthogonal → "step"). */
  type: string;
  /** Inline SVG style for the edge path. */
  style: {
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
  /** Whether the edge animates a flow indicator. */
  animated: boolean;
  /** Arrowhead marker at the target end (omitted when arrows are off). */
  markerEnd?: EdgeMarker;
  /** Text rendered along the edge path (omitted when the edge has no label). */
  label?: string;
  /** Whether the label gets a background so it stays readable over the line. */
  labelShowBg: boolean;
  /** Background fill for the label. */
  labelBgStyle: { fill: string };
  /** Text color for the label (the edge stroke color, readable on the dark pill). */
  labelStyle: { fill: string };
  /** Padding around the label text, in pixels. */
  labelBgPadding: [number, number];
}

/**
 * Translate an edge's domain style into the props React Flow renders.
 * An empty dash pattern is omitted so the edge stays solid. The label
 * comes from `data.label`; an empty label renders nothing.
 */
export function edgePresentation(edge: DiagramEdge): EdgePresentation {
  const style = resolveEdgeStyle(edge.data?.style);
  const label = edge.data?.label?.trim() ? edge.data.label : undefined;
  return {
    type: LINE_TYPE_TO_FLOW_TYPE[style.lineType],
    style: {
      stroke: style.strokeColor,
      strokeWidth: style.strokeWidth,
      ...(style.strokeDasharray
        ? { strokeDasharray: style.strokeDasharray }
        : {}),
    },
    animated: style.animated,
    ...(style.arrow
      ? {
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: style.strokeColor,
          },
        }
      : {}),
    ...(label ? { label } : {}),
    labelShowBg: true,
    labelBgStyle: { fill: "#071a0e" },
    labelStyle: { fill: style.strokeColor },
    labelBgPadding: [4, 2],
  };
}

// ---------------------------------------------------------------------------
// Color input helpers
// ---------------------------------------------------------------------------

/** True when `value` is a `#rrggbb` color a native color input accepts. */
export function isHexColor(value: string | undefined): boolean {
  return (
    typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
  );
}

/**
 * Coerce a style color into a `#rrggbb` value for `<input type="color">`.
 * Non-hex values (e.g. a named color from an imported diagram) fall back
 * to `fallback` instead of breaking the input.
 */
export function asHexColor(
  value: string | undefined,
  fallback: string
): string {
  return isHexColor(value) ? (value as string) : fallback;
}

/**
 * Coerce user-typed hex text into a `#rrggbb` color, or `null` when it
 * is not a color. Accepts an optional leading `#` and the 3-digit
 * shorthand (`#f00` → `#ff0000`); anything else is rejected so a
 * half-typed value never reaches the diagram.
 */
export function normalizeHexInput(value: string): string | null {
  const text = value.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(text)) return `#${text.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(text)) {
    const expanded = text
      .split("")
      .map((digit) => `${digit}${digit}`)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }
  return null;
}
