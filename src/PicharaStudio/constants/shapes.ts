/**
 * Shape library — the categorized shape catalog shown in the sidebar.
 *
 * Each category groups shapes the way Lucidchart-style libraries do, so
 * adding a shape means adding one entry here (plus its rendering, see
 * `utils/shape-geometry.ts` and `nodes/base/BaseShapeNode.tsx`).
 */

import type { ShapeKind } from "../types";

/** One draggable shape in the library. */
export interface ShapeLibraryEntry {
  /** Which base shape a node of this entry renders as. */
  kind: ShapeKind;

  /** Label shown under the shape preview. */
  label: string;
}

/** One collapsible section of the shape library. */
export interface ShapeLibraryCategory {
  /** Section heading. */
  title: string;

  /** Shapes in this section, in display order. */
  shapes: ShapeLibraryEntry[];
}

/** The full shape library, grouped by category. */
export const SHAPE_LIBRARY: ShapeLibraryCategory[] = [
  {
    title: "Basic shapes",
    shapes: [
      { kind: "rectangle", label: "Rectangle" },
      { kind: "ellipse", label: "Ellipse" },
      { kind: "diamond", label: "Diamond" },
      { kind: "triangle", label: "Triangle" },
      { kind: "hexagon", label: "Hexagon" },
      { kind: "pentagon", label: "Pentagon" },
    ],
  },
  {
    title: "Flowchart",
    shapes: [{ kind: "parallelogram", label: "Input / Output" }],
  },
];

/** MIME type used for HTML5 drag-and-drop of library shapes. */
export const SHAPE_DRAG_MIME_TYPE = "application/reactflow";
