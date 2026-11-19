/**
 * BaseShapeNode — renders one of the base shapes (rectangle, diamond,
 * ellipse, triangle, parallelogram, hexagon, pentagon) from the shape
 * library.
 *
 * Rectangle and ellipse use a CSS background layer; polygon shapes are
 * drawn as an inline SVG polygon so the border follows the shape outline
 * (a clip-path would cut the border off). The content layer carries the
 * label on top of either background.
 */

import { memo } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { BaseShapeNodeData } from "../../types";
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from "../../constants";
import { resolveNodeStyle } from "../../utils/apply-style";
import { shapePolygonPoints } from "../../utils/shape-geometry";

function BaseShapeNode({
  data,
  selected,
}: NodeProps<Node<BaseShapeNodeData>>) {
  const style = resolveNodeStyle(data.style);
  const polygonPoints = shapePolygonPoints(data.shape);
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
      {polygonPoints === null ? (
        <div
          className="shape-node__bg"
          aria-hidden="true"
          style={{
            backgroundColor: style.backgroundColor,
            borderColor: style.borderColor,
            borderWidth: style.borderWidth,
            // The ellipse gets its roundness from CSS (50%); only the
            // rectangle uses the radius value.
            borderRadius:
              data.shape === "rectangle" ? style.borderRadius : undefined,
          }}
        />
      ) : (
        <svg
          className="shape-node__bg shape-node__bg--svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polygon
            points={polygonPoints}
            fill={style.backgroundColor}
            stroke={style.borderColor}
            strokeWidth={style.borderWidth}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
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
