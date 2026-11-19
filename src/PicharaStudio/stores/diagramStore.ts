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
 * Undo/redo history IS recorded here: content-changing actions push the
 * pre-change diagram into `stores/historyStore.ts` (see `recordHistory`).
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
  EdgeStyle,
  NodeStyle,
  ShapeKind,
  Viewport,
} from "../types";
import { DEFAULT_VIEWPORT, createDefaultMetadata } from "../constants";
import { generateId } from "../utils/generate-id";
import {
  applyEdgeStyle,
  applyNodeStyle,
  clearEdgeStyle,
  clearNodeStyle,
} from "../utils/apply-style";
import { useHistoryStore } from "./historyStore";

/**
 * True while a node resize is in progress. Module-scoped (not store state):
 * it only exists to record one history entry per resize gesture — on the
 * first `dimensions` change with `resizing: true` — instead of one per
 * pointer move. Mirrors `nodeDragActive` below.
 */
let nodeResizeActive = false;

/**
 * True while a node drag is in progress. Module-scoped (not store state):
 * it only exists to record one history entry per drag — on the first
 * `position` change with `dragging: true` — instead of one per pointer move.
 */
let nodeDragActive = false;

/** Record the given diagram so the next undo returns to it. */
function recordHistory(diagram: Diagram): void {
  useHistoryStore.getState().pushHistory(diagram);
}

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

  /**
   * Record the current diagram as one undo step. Call before a gesture
   * that applies many small changes (e.g. dragging a color picker), so
   * the whole gesture undoes in one step instead of one per change.
   */
  beginStyleEdit: () => void;

  /**
   * Merge a style patch into every selected node. Records one undo step
   * unless `recordHistory` is false (used with `beginStyleEdit` for
   * continuous controls such as color pickers).
   */
  updateSelectedNodeStyle: (
    patch: Partial<NodeStyle>,
    recordHistory?: boolean
  ) => void;

  /**
   * Merge a style patch into every selected edge. Records one undo step
   * unless `recordHistory` is false (see `updateSelectedNodeStyle`).
   */
  updateSelectedEdgeStyle: (
    patch: Partial<EdgeStyle>,
    recordHistory?: boolean
  ) => void;

  /** Remove style overrides from every selected node and edge (back to defaults). */
  resetSelectedStyle: () => void;

  /**
   * Replace a node's label (double-click edit). Records one undo step.
   * No-op when the node does not exist or the label is unchanged.
   */
  updateNodeLabel: (nodeId: string, label: string) => void;

  /**
   * Replace the label of every selected edge. Records one undo step.
   * An empty label clears the label (the edge renders no text).
   * No-op when no edge is selected or no label actually changes.
   */
  updateSelectedEdgeLabel: (label: string) => void;

  /** Replace the current diagram with a loaded one. */
  loadDiagram: (diagram: Diagram) => void;

  /** Discard the current diagram and start a new empty one. */
  newDiagram: () => void;
}

export const useDiagramStore = create<DiagramStore>()((set, get) => ({
  diagram: createEmptyDiagram(),
  spawnOffset: 0,

  addNode: (shape, position) => {
    recordHistory(get().diagram);
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
    });
  },

  onNodesChange: (changes) => {
    // Record content changes only: deletions, one entry per node drag (on
    // the first `position` change with `dragging: true`), and one entry
    // per node resize (on the first `dimensions` change with
    // `resizing: true`). Selection changes and intermediate drag/resize
    // positions are not undoable steps.
    const positionChanges = changes.getByType("position");
    const dragging = positionChanges.some(
      (change) => change.dragging === true
    );
    const dragEnded = positionChanges.some(
      (change) => change.dragging === false
    );
    const dimensionChanges = changes.getByType("dimensions");
    const resizing = dimensionChanges.some(
      (change) => change.resizing === true
    );
    const resizeEnded = dimensionChanges.some(
      (change) => change.resizing === false
    );
    if (
      changes.getByType("remove").length > 0 ||
      (dragging && !nodeDragActive) ||
      (resizing && !nodeResizeActive)
    ) {
      recordHistory(get().diagram);
    }
    nodeDragActive = dragging ? true : dragEnded ? false : nodeDragActive;
    nodeResizeActive = resizing
      ? true
      : resizeEnded
        ? false
        : nodeResizeActive;
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: changes.applyTo(state.diagram.nodes),
      },
    }));
  },

  onEdgesChange: (changes) => {
    // Selection changes are not undoable; only deletions are recorded.
    if (changes.getByType("remove").length > 0) {
      recordHistory(get().diagram);
    }
    set((state) => ({
      diagram: {
        ...state.diagram,
        edges: changes.applyTo(state.diagram.edges),
      },
    }));
  },

  onConnect: (connection) => {
    recordHistory(get().diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        edges: addEdge(
          { ...connection, id: generateId(), type: "default" },
          state.diagram.edges
        ),
      },
    }));
  },

  setViewport: (viewport) =>
    set((state) => ({
      diagram: { ...state.diagram, viewport },
    })),

  beginStyleEdit: () => {
    recordHistory(get().diagram);
  },

  updateSelectedNodeStyle: (patch, record = true) => {
    const { diagram } = get();
    if (!diagram.nodes.some((node) => node.selected)) return;
    if (record) recordHistory(diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) =>
          node.selected ? applyNodeStyle(node, patch) : node
        ),
      },
    }));
  },

  updateSelectedEdgeStyle: (patch, record = true) => {
    const { diagram } = get();
    if (!diagram.edges.some((edge) => edge.selected)) return;
    if (record) recordHistory(diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        edges: state.diagram.edges.map((edge) =>
          edge.selected ? applyEdgeStyle(edge, patch) : edge
        ),
      },
    }));
  },

  resetSelectedStyle: () => {
    const { diagram } = get();
    const hasSelection =
      diagram.nodes.some((node) => node.selected) ||
      diagram.edges.some((edge) => edge.selected);
    if (!hasSelection) return;
    recordHistory(diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) =>
          node.selected ? clearNodeStyle(node) : node
        ),
        edges: state.diagram.edges.map((edge) =>
          edge.selected ? clearEdgeStyle(edge) : edge
        ),
      },
    }));
  },

  updateNodeLabel: (nodeId, label) => {
    const { diagram } = get();
    const node = diagram.nodes.find((candidate) => candidate.id === nodeId);
    if (!node || node.data.label === label) return;
    recordHistory(diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: state.diagram.nodes.map((candidate) =>
          candidate.id === nodeId
            ? { ...candidate, data: { ...candidate.data, label } }
            : candidate
        ),
      },
    }));
  },

  updateSelectedEdgeLabel: (label) => {
    const { diagram } = get();
    const nextLabel = label.trim() ? label : undefined;
    const selected = diagram.edges.filter((edge) => edge.selected);
    if (
      selected.length === 0 ||
      selected.every((edge) => edge.data?.label === nextLabel)
    ) {
      return;
    }
    recordHistory(diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        edges: state.diagram.edges.map((edge) =>
          edge.selected
            ? { ...edge, data: { ...edge.data, label: nextLabel } }
            : edge
        ),
      },
    }));
  },

  loadDiagram: (diagram) => {
    // A different diagram replaces the current one: past undo steps from
    // the old diagram must not leak into the new one.
    useHistoryStore.getState().clearHistory();
    set({ diagram, spawnOffset: 0 });
  },

  newDiagram: () => {
    useHistoryStore.getState().clearHistory();
    set({ diagram: createEmptyDiagram(), spawnOffset: 0 });
  },
}));
