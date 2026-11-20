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
import {
  DEFAULT_GROUP_LABEL,
  GROUP_NODE_TYPE,
} from "../constants/defaults";
import { generateId } from "../utils/generate-id";
import { groupNodes, ungroupNodes } from "../utils/grouping";
import {
  applyEdgeStyle,
  applyNodeStyle,
  clearEdgeStyle,
  clearNodeStyle,
} from "../utils/apply-style";
import { useHistoryStore } from "./historyStore";
import {
  alignNodes,
  cloneSelection,
  distributeNodes,
  removeSelection,
  snapshotSelection,
  type AlignKind,
  type DistributeAxis,
  type SelectionSnapshot,
} from "../utils/selection-ops";

/** Offset (px) applied to each paste so repeated pastes cascade. */
const PASTE_OFFSET = 20;

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

  /**
   * Last copied selection (deep copies of nodes + internal edges).
   * Ephemeral UI state — not part of the diagram, never persisted.
   * `null` when nothing has been copied yet.
   */
  clipboard: SelectionSnapshot | null;

  /**
   * How many times the current clipboard has been pasted. Each paste
   * shifts the clones a bit further so repeated pastes cascade instead
   * of stacking exactly on top of each other. Reset by copying.
   */
  pasteCount: number;

  /**
   * Whether the dotted grid background is drawn on the canvas.
   * Ephemeral view state — not part of the diagram, never persisted.
   */
  showGrid: boolean;

  /**
   * Whether node dragging, drops and spawns snap positions to the
   * grid. Ephemeral view state — not part of the diagram, never
   * persisted.
   */
  snapToGrid: boolean;

  /**
   * Incremented each time the user asks to zoom to fit. The canvas
   * watches it and calls React Flow's `fitView` (the toolbar and the
   * keyboard shortcut live outside the React Flow tree, so they cannot
   * call it directly). Ephemeral view state, never persisted.
   */
  fitViewRequest: number;

  /** Toggle the dotted grid background on the canvas. */
  toggleGrid: () => void;

  /** Toggle snapping node positions to the grid. */
  toggleSnapToGrid: () => void;

  /** Ask the canvas to zoom/pan so the whole diagram is visible. */
  requestFitView: () => void;

  /**
   * Delete the selected nodes and edges (edges attached to a deleted
   * node go away too, so none dangle). Records one undo step.
   * No-op when nothing is selected.
   */
  deleteSelection: () => void;

  /** Select every node and edge. Selection is not an undoable step. */
  selectAll: () => void;

  /** Clear the selection. Selection is not an undoable step. */
  clearSelection: () => void;

  /** Copy the selected nodes (and edges between them) to the clipboard. */
  copySelection: () => void;

  /**
   * Paste the clipboard as fresh nodes/edges, offset so they do not land
   * exactly on the originals, and select the pasted copies. No-op when
   * the clipboard is empty. Records one undo step.
   */
  pasteClipboard: () => void;

  /**
   * Duplicate the selection in place: same as copy + paste, offset by
   * one paste step, without touching the clipboard. Records one undo step.
   */
  duplicateSelection: () => void;

  /**
   * Wrap the selected nodes in a group container: the group hugs the
   * selection's bounding box and dragging it moves the members together.
   * Needs at least two selected top-level nodes (nodes already inside a
   * group stay where they are). Records one undo step.
   */
  groupSelection: () => void;

  /**
   * Dissolve each selected group: the container goes away and its
   * members stay exactly where they were, selected. Records one undo
   * step. No-op when no group node is selected.
   */
  ungroupSelection: () => void;

  /**
   * Line the selected nodes up with each other (left, center, right,
   * top, middle, bottom). No-op with fewer than two nodes selected.
   * Records one undo step.
   */
  alignSelection: (kind: AlignKind) => void;

  /**
   * Space the selected nodes evenly along an axis. The outermost nodes
   * stay put; the ones between get evenly spaced centers. No-op with
   * fewer than three nodes selected. Records one undo step.
   */
  distributeSelection: (axis: DistributeAxis) => void;

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

  /**
   * Rename the current diagram (what the library list shows).
   * Not an undoable step — like moving the camera, it is not canvas
   * content. No-op for a blank name or the current name.
   */
  renameDiagram: (name: string) => void;
}

export const useDiagramStore = create<DiagramStore>()((set, get) => ({
  diagram: createEmptyDiagram(),
  spawnOffset: 0,
  clipboard: null,
  pasteCount: 0,
  showGrid: true,
  snapToGrid: true,
  fitViewRequest: 0,

  toggleGrid: () => {
    set((state) => ({ showGrid: !state.showGrid }));
  },

  toggleSnapToGrid: () => {
    set((state) => ({ snapToGrid: !state.snapToGrid }));
  },

  requestFitView: () => {
    set((state) => ({ fitViewRequest: state.fitViewRequest + 1 }));
  },

  deleteSelection: () => {
    const { diagram } = get();
    const hasSelection =
      diagram.nodes.some((node) => node.selected) ||
      diagram.edges.some((edge) => edge.selected);
    if (!hasSelection) return;
    recordHistory(diagram);
    const { nodes, edges } = removeSelection(diagram.nodes, diagram.edges);
    set((state) => ({
      diagram: { ...state.diagram, nodes, edges },
    }));
  },

  selectAll: () => {
    const { diagram } = get();
    if (
      diagram.nodes.every((node) => node.selected) &&
      diagram.edges.every((edge) => edge.selected)
    ) {
      return;
    }
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) => ({
          ...node,
          selected: true,
        })),
        edges: state.diagram.edges.map((edge) => ({
          ...edge,
          selected: true,
        })),
      },
    }));
  },

  clearSelection: () => {
    const { diagram } = get();
    if (
      diagram.nodes.every((node) => !node.selected) &&
      diagram.edges.every((edge) => !edge.selected)
    ) {
      return;
    }
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) => ({
          ...node,
          selected: false,
        })),
        edges: state.diagram.edges.map((edge) => ({
          ...edge,
          selected: false,
        })),
      },
    }));
  },

  copySelection: () => {
    const { diagram } = get();
    if (!diagram.nodes.some((node) => node.selected)) return;
    set({
      clipboard: snapshotSelection(diagram.nodes, diagram.edges),
      pasteCount: 0,
    });
  },

  pasteClipboard: () => {
    const { diagram, clipboard, pasteCount } = get();
    if (clipboard === null) return;
    const clones = cloneSelection(
      clipboard,
      PASTE_OFFSET * (pasteCount + 1),
      () => generateId()
    );
    recordHistory(diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: [
          ...state.diagram.nodes.map((node) => ({
            ...node,
            selected: false,
          })),
          ...clones.nodes,
        ],
        edges: [
          ...state.diagram.edges.map((edge) => ({
            ...edge,
            selected: false,
          })),
          ...clones.edges,
        ],
      },
      pasteCount: state.pasteCount + 1,
    }));
  },

  duplicateSelection: () => {
    const { diagram } = get();
    const snapshot = snapshotSelection(diagram.nodes, diagram.edges);
    if (snapshot.nodes.length === 0) return;
    const clones = cloneSelection(snapshot, PASTE_OFFSET, () => generateId());
    recordHistory(diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: [
          ...state.diagram.nodes.map((node) => ({
            ...node,
            selected: false,
          })),
          ...clones.nodes,
        ],
        edges: [
          ...state.diagram.edges.map((edge) => ({
            ...edge,
            selected: false,
          })),
          ...clones.edges,
        ],
      },
    }));
  },

  groupSelection: () => {
    const { diagram } = get();
    const grouped = groupNodes(
      diagram.nodes,
      generateId(),
      DEFAULT_GROUP_LABEL
    );
    if (grouped === null) return;
    recordHistory(diagram);
    set((state) => ({
      diagram: { ...state.diagram, nodes: grouped },
    }));
  },

  ungroupSelection: () => {
    const { diagram } = get();
    const groupIds = diagram.nodes
      .filter((node) => node.selected && node.type === GROUP_NODE_TYPE)
      .map((node) => node.id);
    const ungrouped = ungroupNodes(diagram.nodes, groupIds);
    if (ungrouped === null) return;
    recordHistory(diagram);
    set((state) => ({
      diagram: { ...state.diagram, nodes: ungrouped },
    }));
  },

  alignSelection: (kind) => {
    const { diagram } = get();
    const selected = diagram.nodes.filter((node) => node.selected);
    // Align/distribute only make sense in one coordinate space: a child
    // node's position is relative to its group, a top-level node's is
    // absolute, so mixing them would move shapes to wrong places.
    const parents = new Set(selected.map((node) => node.parentId));
    if (parents.size > 1) return;
    const moves = alignNodes(selected, kind);
    if (moves.length === 0) return;
    const positions = new Map(moves.map((move) => [move.id, move.position]));
    recordHistory(diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) => {
          const position = positions.get(node.id);
          return position === undefined ? node : { ...node, position };
        }),
      },
    }));
  },

  distributeSelection: (axis) => {
    const { diagram } = get();
    const selected = diagram.nodes.filter((node) => node.selected);
    // Same coordinate-space rule as alignSelection (see above).
    const parents = new Set(selected.map((node) => node.parentId));
    if (parents.size > 1) return;
    const moves = distributeNodes(selected, axis);
    if (moves.length === 0) return;
    const positions = new Map(moves.map((move) => [move.id, move.position]));
    recordHistory(diagram);
    set((state) => ({
      diagram: {
        ...state.diagram,
        nodes: state.diagram.nodes.map((node) => {
          const position = positions.get(node.id);
          return position === undefined ? node : { ...node, position };
        }),
      },
    }));
  },

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
    set({ diagram, spawnOffset: 0, clipboard: null, pasteCount: 0 });
  },

  newDiagram: () => {
    useHistoryStore.getState().clearHistory();
    set({
      diagram: createEmptyDiagram(),
      spawnOffset: 0,
      clipboard: null,
      pasteCount: 0,
    });
  },

  renameDiagram: (name) => {
    const trimmed = name.trim();
    if (trimmed === "" || trimmed === get().diagram.name) return;
    set((state) => ({
      diagram: { ...state.diagram, name: trimmed },
    }));
  },
}));
