/**
 * Diagram templates — ready-made starting points for new diagrams.
 *
 * Pure builders: each template returns a fresh `Diagram` (new ids every
 * time) built from the base shapes, so the user can start from a
 * flowchart or a system sketch instead of a blank canvas. No React,
 * no store, no persistence — the UI loads the built diagram with the
 * store's `loadDiagram`, exactly like an imported file.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `services/import/diagram-import.ts`).
 */

import type {
  BaseShapeNodeData,
  Diagram,
  DiagramEdge,
  DiagramNode,
  DiagramType,
  ShapeKind,
} from "../types/index.ts";
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
  DEFAULT_VIEWPORT,
  createDefaultMetadata,
} from "../constants/index.ts";
import { generateId } from "../utils/generate-id.ts";

/** One template the user can start a diagram from. */
export interface TemplateDefinition {
  /** Stable key (e.g. "flowchart"). */
  id: string;

  /** User-facing name shown in the library dialog. */
  name: string;

  /** One-line description shown under the name. */
  description: string;

  /** Diagram category the template belongs to. */
  diagramType: DiagramType;

  /** Build a fresh copy of the template diagram (new ids each call). */
  build: () => Diagram;
}

/** Build one base-shape node for a template. */
function shapeNode(
  shape: ShapeKind,
  label: string,
  x: number,
  y: number
): DiagramNode<BaseShapeNodeData> {
  return {
    id: generateId(),
    type: `shape-${shape}`,
    position: { x, y },
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
    data: { label, shape },
  };
}

/** Build one connection between two template nodes. */
function link(
  source: string,
  target: string,
  label?: string
): DiagramEdge {
  return {
    id: generateId(),
    type: "default",
    source,
    target,
    ...(label === undefined ? {} : { data: { label } }),
  };
}

/** Assemble a template diagram from its nodes and edges. */
function buildTemplateDiagram(
  name: string,
  diagramType: DiagramType,
  nodes: DiagramNode[],
  edges: DiagramEdge[]
): Diagram {
  return {
    id: generateId(),
    name,
    description: "",
    diagramType,
    nodes,
    edges,
    viewport: DEFAULT_VIEWPORT,
    metadata: createDefaultMetadata(),
  };
}

/** Start → Process → Decision → End, with a "Yes" branch to the end. */
function buildFlowchartTemplate(): Diagram {
  const start = shapeNode("ellipse", "Start", 320, 40);
  const process = shapeNode("rectangle", "Process", 320, 160);
  const decision = shapeNode("diamond", "Decide?", 320, 280);
  const end = shapeNode("ellipse", "End", 320, 400);
  return buildTemplateDiagram(
    "Basic flowchart",
    "flowchart",
    [start, process, decision, end],
    [
      link(start.id, process.id),
      link(process.id, decision.id),
      link(decision.id, end.id, "Yes"),
    ]
  );
}

/** User → Load balancer → API server → Database. */
function buildSystemDesignTemplate(): Diagram {
  const user = shapeNode("rectangle", "User", 40, 180);
  const balancer = shapeNode("rectangle", "Load balancer", 300, 180);
  const api = shapeNode("rectangle", "API server", 560, 80);
  const database = shapeNode("rectangle", "Database", 560, 280);
  return buildTemplateDiagram(
    "Simple system design",
    "system-design",
    [user, balancer, api, database],
    [
      link(user.id, balancer.id),
      link(balancer.id, api.id),
      link(api.id, database.id),
    ]
  );
}

/** Every template offered in the library dialog, in display order. */
export const TEMPLATES: TemplateDefinition[] = [
  {
    id: "flowchart",
    name: "Basic flowchart",
    description: "Start, process, decision and end — a classic flow.",
    diagramType: "flowchart",
    build: buildFlowchartTemplate,
  },
  {
    id: "system-design",
    name: "Simple system design",
    description: "User, load balancer, API server and database.",
    diagramType: "system-design",
    build: buildSystemDesignTemplate,
  },
];

/** Find a template by id, or `undefined` when there is none. */
export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find((template) => template.id === id);
}
