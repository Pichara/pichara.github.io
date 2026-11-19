/**
 * BaseShapeNode — renders one of the base shapes (rectangle, diamond,
 * ellipse, triangle, parallelogram, hexagon, pentagon) from the shape
 * library.
 *
 * Rectangle and ellipse use a CSS background layer; polygon shapes are
 * drawn as an inline SVG polygon so the border follows the shape outline
 * (a clip-path would cut the border off). The content layer carries the
 * label on top of either background.
 *
 * Interactions: double-click the label to edit it inline (Enter commits,
 * Escape cancels, an empty label keeps the previous text); when the node
 * is selected, React Flow's NodeResizer shows handles to resize it.
 * Resizing writes explicit width/height on the node, so the component
 * renders those when present and falls back to the defaults otherwise.
 * The fallback also covers the fresh-node case: React Flow v13 passes
 * measured dimensions as the width/height props, and a new node measures
 * 0x0 — see `utils/node-size.ts`.
 */

import { memo, useState, type KeyboardEvent } from "react";
import {
  Handle,
  NodeResizer,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import type { BaseShapeNodeData } from "../../types";
import { MIN_NODE_HEIGHT, MIN_NODE_WIDTH } from "../../constants";
import { useDiagramStore } from "../../stores/diagramStore";
import { resolveNodeStyle } from "../../utils/apply-style";
import { commitLabelEdit } from "../../utils/node-editing";
import { resolveNodeSize } from "../../utils/node-size";
import { shapePolygonPoints } from "../../utils/shape-geometry";

function BaseShapeNode({
  id,
  data,
  selected,
  width,
  height,
}: NodeProps<Node<BaseShapeNodeData>>) {
  const style = resolveNodeStyle(data.style);
  const polygonPoints = shapePolygonPoints(data.shape);
  const updateNodeLabel = useDiagramStore((state) => state.updateNodeLabel);
  // Fresh nodes arrive with width/height 0 (unmeasured); resolve to the
  // defaults so the shape renders instead of collapsing to 0x0.
  const { width: nodeWidth, height: nodeHeight } = resolveNodeSize(
    width,
    height
  );

  // Inline label editing — local UI state only; the store is touched
  // once, on commit, so typing never writes history entries.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEditing = (): void => {
    setDraft(data.label);
    setEditing(true);
  };

  const commitEditing = (): void => {
    const next = commitLabelEdit(data.label, draft);
    if (next !== null) updateNodeLabel(id, next);
    setEditing(false);
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === "Enter" && !event.shiftKey) {
      // Enter commits; Shift+Enter inserts a newline.
      event.preventDefault();
      commitEditing();
    } else if (event.key === "Escape") {
      event.preventDefault();
      setEditing(false);
    }
  };

  return (
    <div
      className={`shape-node shape-node--${data.shape}${
        selected ? " is-selected" : ""
      }`}
      style={{
        width: nodeWidth,
        height: nodeHeight,
        opacity: style.opacity,
      }}
    >
      {selected ? (
        <NodeResizer minWidth={MIN_NODE_WIDTH} minHeight={MIN_NODE_HEIGHT} />
      ) : null}
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
      <div className="shape-node__content" onDoubleClick={startEditing}>
        {editing ? (
          <textarea
            className="shape-node__label-input nodrag nowheel"
            value={draft}
            autoFocus
            onFocus={(event) => event.target.select()}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitEditing}
            onKeyDown={handleEditorKeyDown}
            aria-label="Edit node label"
            rows={2}
          />
        ) : (
          <>
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
              <span className="shape-node__description">
                {data.description}
              </span>
            ) : null}
          </>
        )}
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(BaseShapeNode);
