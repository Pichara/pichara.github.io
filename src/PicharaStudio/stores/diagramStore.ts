/**
 * Diagram Store — source of truth for all diagram data.
 *
 * Holds the current `Diagram` (nodes, edges, viewport, metadata) and the
 * actions that mutate it. State is always JSON-serializable: no functions,
 * class instances, or DOM references inside `diagram`.
 *
 * React Flow drives changes through `onNodesChange` / `onEdgesChange` /
 * `onConnect`. In `@xyflow/react` v13 the change callbacks receive a
 * `NodeChangeset` / `EdgeChangeset`, and the changeset's own `applyTo`
 * method applies the queued changes with the library's logic — the store
 * just hands it the current elements. Persistence is deliberately NOT done
 * here — see `services/persistence.ts` and `hooks/useDiagramPersistence.ts`.
 */

import { create } from "zustand";
import {
  addEdge,
  type Connection,
  type EdgeChangeset,
  type NodeChangeset,
} from "@xyflow/react";
import type {
  BaseShapeNodeData,
  Diagram,
  DiagramEdge,
  DiagramNode,
  ShapeKind,
  Viewport,
} from "../types";
import { DEFAULT_VIEWPORT, createDefaultMetadata } from "../constants";
import { generateId } from "../utils/generate-id";

/** Build a fresh, empty diagram. */
export function createEmptyDiagram(): Diagram {
  return {
    id: generateId(),
    name: "Untitled Diagram",
    description: "",
    diagramType: "general",
    nodes: [],
    edges: [],
    viewport: DEFAULT_VIEWPORT,
    metadata: createDefaultMetadata(),
  };
}

interface DiagramStore {
  /** The current diagram — the only persisted state. */
  diagram: Diagram;

  /**
   * Cascading offset (px) applied to newly added nodes so they do not stack.
   * Ephemeral UI state — not part of the diagram, never persisted.
   */
  spawnOffset: number;

  /** Add a base-shape node at the given canvas position. */
  addNode: (
    shape: ShapeKind,
    position: { x: number; y: number }
  ) => void;

  /** Apply React Flow node changes (drag, select, remove, ...). */
  onNodesChange: (changes: NodeChangeset<DiagramNode>) => void;

  /** Apply React Flow edge changes (select, remove, ...). */
  onEdgesChange: (changes: EdgeChangeset<DiagramEdge>) => void;

  /** Create an edge from a React Flow connection. */
  onConnect: (connection: Connection) => void;

  /** Persist the camera position/zoom after a pan or zoom ends. */
  setViewport: (viewport: Viewport) => void;

  /** Replace the current diagram with a loaded one. */
  loadDiagram: (diagram: Diagram) => void;

  /** Discard the current diagram and start a new empty one. */
  newDiagram: () => void;
}

export const useDiagramStore = create<DiagramStore>()((set) => ({
  diagram: createEmptyDiagram(),
  spawnOffset: 0,

  addNode: (shape, position) =>
    set((state) => {
      const node: DiagramNode<BaseShapeNodeData> = {
        id: generateId(),
        type: `shape-${shape}`,
        position,
        data: { label: `New ${shape}`, shape },
      };
      return {
        diagram: {
          ...state.diagram,
          nodes: [...state.diagram.nodes, node],
        },
        spawnOffset: (state.spawnOffset + 40) % 200,
      };
    }),

  onNodesChange: (changes) =>
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: changes.applyTo(state.diagram.nodes),
      },
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      diagram: {
        ...state.diagram,
        edges: changes.applyTo(state.diagram.edges),
      },
    })),

  onConnect: (connection) =>
    set((state) => ({
      diagram: {
        ...state.diagram,
        edges: addEdge(
          { ...connection, id: generateId(), type: "default" },
          state.diagram.edges
        ),
      },
    })),

  setViewport: (viewport) =>
    set((state) => ({
      diagram: { ...state.diagram, viewport },
    })),

  loadDiagram: (diagram) =>
    set({ diagram, spawnOffset: 0 }),

  newDiagram: () =>
    set({ diagram: createEmptyDiagram(), spawnOffset: 0 }),
}));
