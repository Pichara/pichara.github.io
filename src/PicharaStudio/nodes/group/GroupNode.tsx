/**
 * GroupNode — renders a group container node.
 *
 * A group is a plain container: its children (nodes with `parentId`
 * pointing here) render inside it and move with it when it is dragged.
 * The label sits in the top-left corner; the dashed border marks the
 * group's extent. Groups have no connection handles and cannot be
 * resized — use Ungroup to edit the members individually.
 *
 * The width/height come from the store (bounding box of the members
 * plus `GROUP_PADDING`); fresh group nodes always carry explicit
 * dimensions, so no 0-size fallback is needed here.
 */

import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";
import type { BaseNodeData } from "../../types";
import { resolveNodeSize } from "../../utils/node-size";

function GroupNode({
  data,
  selected,
  width,
  height,
}: NodeProps<Node<BaseNodeData>>) {
  const { width: nodeWidth, height: nodeHeight } = resolveNodeSize(
    width,
    height
  );
  return (
    <div
      className={`group-node${selected ? " is-selected" : ""}`}
      style={{ width: nodeWidth, height: nodeHeight }}
    >
      <span className="group-node__label">{data.label}</span>
    </div>
  );
}

export default memo(GroupNode);
