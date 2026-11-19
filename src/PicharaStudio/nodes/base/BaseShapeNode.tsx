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
import { resolveNodeStyle } from "../../utils/apply-style";

function BaseShapeNode({
  data,
  selected,
}: NodeProps<Node<BaseShapeNodeData>>) {
  const style = resolveNodeStyle(data.style);
  return (
    <div
      className={`shape-node shape-node--${data.shape}${
        selected ? " is-selected" : ""
      }`}
      style={{
        width: DEFAULT_NODE_WIDTH,
        minHeight: DEFAULT_NODE_HEIGHT,
        opacity: style.opacity,
      }}
    >
      <div
        className="shape-node__bg"
        aria-hidden="true"
        style={{
          backgroundColor: style.backgroundColor,
          borderColor: style.borderColor,
          borderWidth: style.borderWidth,
          // The ellipse gets its roundness from CSS (50%); the diamond
          // from its clip-path. Only the rectangle uses the radius value.
          borderRadius:
            data.shape === "rectangle" ? style.borderRadius : undefined,
        }}
      />
      <div className="shape-node__content">
        <span
          className="shape-node__label"
          style={{
            color: style.textColor,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
          }}
        >
          {data.label}
        </span>
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
