/**
 * Grouping — pure helpers for grouping nodes into a container group
 * and ungrouping them again.
 *
 * React Flow renders a node whose `parentId` points at a group node as a
 * child of that group, with its `position` relative to the group's
 * top-left corner; dragging the group moves the children with it. These
 * functions only rewrite the plain node arrays — they never touch the
 * store or React Flow — so they can be unit-tested without rendering.
 * The store (`stores/diagramStore.ts`) wires them to history, selection
 * state and id generation.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `utils/history-stack.ts` for the same convention).
 */

import { GROUP_NODE_TYPE, GROUP_PADDING } from "../constants/defaults.ts";
import type { BaseNodeData, DiagramNode, NodePosition } from "../types";
import { resolveNodeSize } from "./node-size.ts";

/**
 * Bounding box covering the given nodes, using their rendered sizes
 * (0 falls back to the defaults, see `utils/node-size.ts`).
 */
function nodesBounds(nodes: DiagramNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const { width, height } = resolveNodeSize(node.width, node.height);
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + width);
    maxY = Math.max(maxY, node.position.y + height);
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Group the selected nodes under a new group node: the group wraps the
 * selection's bounding box plus `GROUP_PADDING` on every side, each
 * member keeps its on-canvas spot (its position becomes relative to the
 * group origin), and only the group stays selected — dragging the group
 * moves the whole set.
 *
 * Only selected top-level nodes join the group; selected nodes that
 * already live inside a group are left alone (and deselected with the
 * rest of the old selection). Returns the new node array (group
 * appended last) or `null` when fewer than two top-level nodes are
 * selected — a group of one is just the node itself. The inputs are
 * not mutated; `groupId` is supplied by the caller so the store owns
 * id generation.
 */
export function groupNodes(
  nodes: DiagramNode[],
  groupId: string,
  groupLabel: string
): DiagramNode[] | null {
  const members = nodes.filter(
    (node) => node.selected && node.parentId === undefined
  );
  if (members.length < 2) return null;
  const bounds = nodesBounds(members);
  const groupPosition: NodePosition = {
    x: bounds.minX - GROUP_PADDING,
    y: bounds.minY - GROUP_PADDING,
  };
  const group: DiagramNode<BaseNodeData> = {
    id: groupId,
    type: GROUP_NODE_TYPE,
    position: groupPosition,
    data: { label: groupLabel },
    width: bounds.maxX - bounds.minX + GROUP_PADDING * 2,
    height: bounds.maxY - bounds.minY + GROUP_PADDING * 2,
    selected: true,
  };
  const memberIds = new Set(members.map((node) => node.id));
  const updated = nodes.map((node) => {
    if (!memberIds.has(node.id)) {
      return node.selected ? { ...node, selected: false } : node;
    }
    return {
      ...node,
      parentId: groupId,
      position: {
        x: node.position.x - groupPosition.x,
        y: node.position.y - groupPosition.y,
      },
      selected: false,
    };
  });
  return [...updated, group];
}

/**
 * Ungroup the given groups: each group node is removed, and its former
 * children get absolute positions again (group origin + their relative
 * position) and become selected, so the ungrouped shapes stay exactly
 * where they were on the canvas.
 *
 * Nodes that are not children of a listed group are returned unchanged.
 * Returns `null` when `groupIds` is empty or matches no group present
 * in `nodes`. The inputs are not mutated.
 */
export function ungroupNodes(
  nodes: DiagramNode[],
  groupIds: string[]
): DiagramNode[] | null {
  if (groupIds.length === 0) return null;
  const groups = new Map(
    nodes
      .filter((node) => groupIds.includes(node.id))
      .map((node) => [node.id, node])
  );
  if (groups.size === 0) return null;
  const removedIds = new Set(groups.keys());
  const ungrouped: DiagramNode[] = [];
  for (const node of nodes) {
    if (removedIds.has(node.id)) continue;
    if (node.parentId === undefined || !groups.has(node.parentId)) {
      ungrouped.push(node);
      continue;
    }
    const parent = groups.get(node.parentId);
    ungrouped.push({
      ...node,
      parentId: undefined,
      position: {
        x: node.position.x + (parent?.position.x ?? 0),
        y: node.position.y + (parent?.position.y ?? 0),
      },
      selected: true,
    });
  }
  return ungrouped;
}

/**
 * Absolute (canvas-space) position of a node. Child nodes store their
 * position relative to their parent, so walk the parent chain until a
 * top-level node is reached; a missing parent (orphaned child) is
 * treated as if the position were already absolute.
 */
export function absoluteNodePosition(
  node: DiagramNode,
  byId: Map<string, DiagramNode>
): NodePosition {
  let x = node.position.x;
  let y = node.position.y;
  let parentId = node.parentId;
  // A cycle in parentId would loop forever; the diagram model never
  // produces one, but cap the walk anyway.
  for (let depth = 0; depth < 100 && parentId !== undefined; depth++) {
    const parent = byId.get(parentId);
    if (parent === undefined) break;
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}
