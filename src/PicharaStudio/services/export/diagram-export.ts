/**
 * Diagram export service — turns the current diagram into downloadable
 * files (JSON, SVG, PNG).
 *
 * The SVG is generated from the diagram data itself (not a screenshot of
 * the canvas), so it stays sharp at any size and needs no extra
 * dependency: node shapes reuse the polygon geometry from
 * `utils/shape-geometry.ts` and edge paths come from
 * `utils/edge-path.ts`. PNG rasterizes that same SVG through a canvas
 * at 2x scale. JSON export reuses the persistence serializer, so an
 * exported file is byte-identical in shape to a LocalStorage save and
 * re-imports through `services/import/diagram-import.ts`.
 *
 * Pure functions (`buildDiagramSvg`, `diagramFileName`) are unit-tested
 * in isolation (see `tests/diagram-export.test.mjs`); only the
 * `download*` / `exportDiagramAs*` functions touch the DOM.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import {
  DEFAULT_EDGE_STYLE,
  GROUP_NODE_TYPE,
} from "../../constants/defaults.ts";
import { serializeDiagram } from "../persistence.ts";
import { resolveEdgeStyle, resolveNodeStyle } from "../../utils/apply-style.ts";
import { computeEdgePath, type NodeRect } from "../../utils/edge-path.ts";
import { boundingBox } from "../../utils/geometry.ts";
import { absoluteNodePosition } from "../../utils/grouping.ts";
import { resolveNodeSize } from "../../utils/node-size.ts";
import { shapePolygonPoints } from "../../utils/shape-geometry.ts";
import type {
  BaseNodeData,
  BaseShapeNodeData,
  Diagram,
  DiagramEdge,
  DiagramNode,
} from "../../types/index.ts";

/** Padding (canvas px) around the exported content. */
export const EXPORT_PADDING = 40;

/** Pixel scale for the PNG rasterization of the SVG. */
export const PNG_SCALE = 2;

// ---------------------------------------------------------------------------
// Bounds
// ---------------------------------------------------------------------------

/** Padded bounding box of the diagram content, in canvas coordinates. */
export interface ExportBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Bounding box covering every node (edges run between nodes, so they are
 * inside it), padded by `EXPORT_PADDING`. An empty diagram exports as a
 * blank 400x300 canvas.
 */
export function diagramExportBounds(diagram: Diagram): ExportBounds {
  if (diagram.nodes.length === 0) {
    return { x: 0, y: 0, width: 400, height: 300 };
  }
  const byId = new Map(diagram.nodes.map((node) => [node.id, node]));
  const { minX, minY, maxX, maxY } = boundingBox(
    diagram.nodes.map((node) => nodeRect(node, byId))
  );
  return {
    x: minX - EXPORT_PADDING,
    y: minY - EXPORT_PADDING,
    width: maxX - minX + EXPORT_PADDING * 2,
    height: maxY - minY + EXPORT_PADDING * 2,
  };
}

/** Canvas rect of a node, resolving fresh (0-sized) nodes to the defaults. */
function nodeRect(
  node: DiagramNode,
  byId: Map<string, DiagramNode>
): NodeRect {
  const { width, height } = resolveNodeSize(node.width, node.height);
  // Children of a group store positions relative to the group.
  const position = absoluteNodePosition(node, byId);
  return { x: position.x, y: position.y, width, height };
}

// ---------------------------------------------------------------------------
// SVG generation (pure)
// ---------------------------------------------------------------------------

/** Escape text for safe inclusion in SVG/XML markup. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Rescale 0–100 polygon points (see `utils/shape-geometry.ts`) to a
 * node's pixel size.
 */
export function scalePolygonPoints(
  points: string,
  width: number,
  height: number
): string {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [px, py] = pair.split(",").map(Number);
      return `${((px / 100) * width).toFixed(1)},${((py / 100) * height).toFixed(1)}`;
    })
    .join(" ");
}

/**
 * Multi-line centered label as SVG text markup. Lines are split on `\n`;
 * the block is vertically centered on (`cx`, `cy`). `anchor` is the
 * horizontal anchor for the text (default "middle").
 */
function labelTextSvg(
  label: string,
  cx: number,
  cy: number,
  fontSize: number,
  fill: string,
  fontWeight: string,
  anchor: "middle" | "start" = "middle"
): string {
  const lines = label.split("\n");
  const lineHeight = fontSize * 1.2;
  const firstDy = -((lines.length - 1) * lineHeight) / 2;
  const tspans = lines
    .map(
      (line, index) =>
        `<tspan x="${cx.toFixed(1)}" dy="${(index === 0 ? firstDy : lineHeight).toFixed(1)}">${escapeXml(line)}</tspan>`
    )
    .join("");
  return `<text x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="central" font-family="sans-serif" font-size="${fontSize}" font-weight="${escapeXml(fontWeight)}" fill="${escapeXml(fill)}">${tspans}</text>`;
}

/** SVG markup for a group container: dashed outline with its label. */
function groupNodeSvg(node: DiagramNode, rect: NodeRect): string {
  const label = labelTextSvg(
    node.data.label,
    rect.x + 8,
    rect.y + 16,
    12,
    "#8ca893",
    "600",
    "start"
  );
  return (
    `<rect x="${rect.x.toFixed(1)}" y="${rect.y.toFixed(1)}" width="${rect.width.toFixed(1)}" height="${rect.height.toFixed(1)}" rx="8" fill="rgba(124, 251, 176, 0.05)" stroke="#4bcc7b" stroke-width="1.5" stroke-dasharray="6 4" />` +
    label
  );
}

/** True when the node data carries a shape (today every node does). */
function isShapeNodeData(data: BaseNodeData): data is BaseShapeNodeData {
  return typeof (data as BaseShapeNodeData).shape === "string";
}

/** SVG markup for one node (shape + centered label). */
function nodeSvg(
  node: DiagramNode,
  byId: Map<string, DiagramNode>
): string {
  const rect = nodeRect(node, byId);
  if (node.type === GROUP_NODE_TYPE) return groupNodeSvg(node, rect);
  const style = resolveNodeStyle(node.data.style);
  const shape = isShapeNodeData(node.data) ? node.data.shape : undefined;
  const polygonPoints = shape === undefined ? null : shapePolygonPoints(shape);
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const fill = escapeXml(style.backgroundColor);
  const stroke = escapeXml(style.borderColor);
  let shapeMarkup: string;
  if (polygonPoints !== null) {
    shapeMarkup = `<polygon points="${scalePolygonPoints(polygonPoints, rect.width, rect.height)}" transform="translate(${rect.x.toFixed(1)} ${rect.y.toFixed(1)})" fill="${fill}" stroke="${stroke}" stroke-width="${style.borderWidth}" />`;
  } else if (shape === "ellipse") {
    shapeMarkup = `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(rect.width / 2).toFixed(1)}" ry="${(rect.height / 2).toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${style.borderWidth}" />`;
  } else {
    shapeMarkup = `<rect x="${rect.x.toFixed(1)}" y="${rect.y.toFixed(1)}" width="${rect.width.toFixed(1)}" height="${rect.height.toFixed(1)}" rx="${style.borderRadius}" fill="${fill}" stroke="${stroke}" stroke-width="${style.borderWidth}" />`;
  }
  const label = labelTextSvg(
    node.data.label,
    cx,
    cy,
    style.fontSize,
    style.textColor,
    style.fontWeight
  );
  return `<g opacity="${style.opacity}">${shapeMarkup}${label}</g>`;
}

/**
 * Distinct stroke colors of the edges that draw an arrowhead: one
 * `<marker>` definition per color is enough for the whole document.
 */
function arrowColorsOf(edges: DiagramEdge[]): string[] {
  const colors: string[] = [];
  for (const edge of edges) {
    const style = resolveEdgeStyle(edge.data?.style);
    if (style.arrow && !colors.includes(style.strokeColor)) {
      colors.push(style.strokeColor);
    }
  }
  return colors;
}

/** SVG `<marker>` definitions, one arrowhead per distinct edge color. */
function arrowMarkersSvg(colors: string[]): string {
  return colors
    .map(
      (color, index) =>
        `<marker id="arrow-${index}" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${escapeXml(color)}" /></marker>`
    )
    .join("");
}

/**
 * SVG markup for one edge (path + optional label). Returns "" for a
 * dangling edge whose endpoint node was deleted — it has no geometry
 * to draw.
 */
function edgeSvg(
  edge: DiagramEdge,
  byId: Map<string, DiagramNode>,
  arrowColors: string[]
): string {
  const source = byId.get(edge.source);
  const target = byId.get(edge.target);
  if (source === undefined || target === undefined) return "";
  const style = resolveEdgeStyle(edge.data?.style);
  const path = computeEdgePath(
    nodeRect(source, byId),
    nodeRect(target, byId),
    style.lineType
  );
  const marker =
    style.arrow && arrowColors.includes(style.strokeColor)
      ? ` marker-end="url(#arrow-${arrowColors.indexOf(style.strokeColor)})"`
      : "";
  const dash =
    style.strokeDasharray !== "" && style.strokeDasharray !== undefined
      ? ` stroke-dasharray="${escapeXml(style.strokeDasharray)}"`
      : "";
  const pathMarkup = `<path d="${path.d}" fill="none" stroke="${escapeXml(style.strokeColor)}" stroke-width="${style.strokeWidth}"${dash}${marker} opacity="${style.opacity}" />`;
  const label = edge.data?.label?.trim();
  if (label === undefined || label === "") return pathMarkup;
  const lines = label.split("\n");
  const fontSize = 12;
  const longest = Math.max(...lines.map((line) => line.length));
  const labelWidth = longest * fontSize * 0.55 + 10;
  const labelHeight = lines.length * fontSize * 1.25 + 6;
  const rectMarkup = `<rect x="${(path.labelX - labelWidth / 2).toFixed(1)}" y="${(path.labelY - labelHeight / 2).toFixed(1)}" width="${labelWidth.toFixed(1)}" height="${labelHeight.toFixed(1)}" rx="4" fill="#071a0e" />`;
  const textMarkup = labelTextSvg(
    label,
    path.labelX,
    path.labelY,
    fontSize,
    DEFAULT_EDGE_STYLE.strokeColor,
    "500"
  );
  return `${pathMarkup}${rectMarkup}${textMarkup}`;
}

/**
 * Build a standalone SVG document for the diagram: white background,
 * edges (under the nodes, with arrowheads and labels), then nodes.
 * Coordinates are in canvas space; the viewBox is the padded bounds.
 */
export function buildDiagramSvg(diagram: Diagram): string {
  const bounds = diagramExportBounds(diagram);
  const byId = new Map(diagram.nodes.map((node) => [node.id, node]));

  const arrowColors = arrowColorsOf(diagram.edges);
  const markers = arrowMarkersSvg(arrowColors);
  const edgeMarkup = diagram.edges
    .map((edge) => edgeSvg(edge, byId, arrowColors))
    .join("");

  // Group containers render under their members.
  const groups = diagram.nodes.filter(
    (node) => node.type === GROUP_NODE_TYPE
  );
  const members = diagram.nodes.filter(
    (node) => node.type !== GROUP_NODE_TYPE
  );
  const nodeMarkup = [...groups, ...members]
    .map((node) => nodeSvg(node, byId))
    .join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}">` +
    `<defs>${markers}</defs>` +
    `<rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="#030a07" />` +
    edgeMarkup +
    nodeMarkup +
    `</svg>`
  );
}

// ---------------------------------------------------------------------------
// File names
// ---------------------------------------------------------------------------

/**
 * Download file name from the diagram name, e.g. "My Diagram" →
 * "my-diagram.json". Falls back to "diagram" for blank names.
 */
export function diagramFileName(diagram: Diagram, extension: string): string {
  const slug =
    diagram.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "diagram";
  return `${slug}.${extension}`;
}

// ---------------------------------------------------------------------------
// Browser downloads
// ---------------------------------------------------------------------------

/** Trigger a download of an in-memory blob. */
export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Download JSON text for the diagram (re-importable via Import). */
export function exportDiagramAsJson(diagram: Diagram): void {
  downloadBlob(
    diagramFileName(diagram, "json"),
    new Blob([serializeDiagram(diagram)], {
      type: "application/json;charset=utf-8",
    })
  );
}

/** Download the diagram as a standalone SVG file. */
export function exportDiagramAsSvg(diagram: Diagram): void {
  downloadBlob(
    diagramFileName(diagram, "svg"),
    new Blob([buildDiagramSvg(diagram)], {
      type: "image/svg+xml;charset=utf-8",
    })
  );
}

/** Load an image from an object URL, rejecting when it cannot be decoded. */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("Could not render the diagram as an image."));
    image.src = url;
  });
}

/**
 * Download the diagram as a PNG (the SVG rasterized on a canvas at 2x
 * scale, on a white background). Rejects when the browser cannot render
 * the image.
 */
export async function exportDiagramAsPng(diagram: Diagram): Promise<void> {
  const bounds = diagramExportBounds(diagram);
  const url = URL.createObjectURL(
    new Blob([buildDiagramSvg(diagram)], {
      type: "image/svg+xml;charset=utf-8",
    })
  );
  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bounds.width * PNG_SCALE));
    canvas.height = Math.max(1, Math.round(bounds.height * PNG_SCALE));
    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Canvas is not available in this browser.");
    }
    context.fillStyle = "#030a07";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const png = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (png === null) {
      throw new Error("Could not render the diagram as PNG.");
    }
    downloadBlob(diagramFileName(diagram, "png"), png);
  } finally {
    URL.revokeObjectURL(url);
  }
}
