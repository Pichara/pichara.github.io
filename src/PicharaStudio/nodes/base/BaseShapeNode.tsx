/**
 * BaseShapeNode — renders one of the base shapes (rectangle, diamond,
 * ellipse) from the shape library.
 *
 * The shape is a visual variant driven by `data.shape`; the background
 * layer carries the geometry (so the diamond's clip-path never clips the
 * connection handles) and the content layer carries the label.
 */

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { BaseShapeNodeData } from "../../types";
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from "../../constants";

function BaseShapeNode({
  data,
  selected,
}: NodeProps<Node<BaseShapeNodeData>>) {
  return (
    <div
      className={`shape-node shape-node--${data.shape}${
        selected ? " is-selected" : ""
      }`}
      style={{ width: DEFAULT_NODE_WIDTH, minHeight: DEFAULT_NODE_HEIGHT }}
    >
      <div className="shape-node__bg" aria-hidden="true" />
      <div className="shape-node__content">
        <span className="shape-node__label">{data.label}</span>
        {data.description ? (
          <span className="shape-node__description">{data.description}</span>
        ) : null}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(BaseShapeNode);
