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
 * Interactions: double-click the label to edit it inline — the text
 * itself becomes editable with no visible box around it (Enter commits,
 * Escape cancels, an empty label keeps the previous text); when the node
 * is selected, `NodeResizeControl`s show handles to resize it — the four
 * corner dots sit on the shape's border (`resizeHandleAnchor` in
 * `utils/shape-geometry.ts`) and the four edge lines run along the
 * bounding-box sides, as `NodeResizer` did before.
 * Connection handles come from `shapeHandles` in `utils/shape-geometry.ts`
 * — every attach point carries both a target and a source handle, so
 * edges can start from or land on any of them.
 * The label renders inside the shape's safe text box (`shapeTextBox`
 * in `utils/shape-text-box.ts`) — the centered rectangle that lies
 * inside the shape's outline — and shrinks to fit when the wrapped
 * text is taller or wider than that box, so it never shows outside
 * the outline on any of the seven shapes.
 * Resizing writes explicit width/height on the node, so the component
 * renders those when present and falls back to the defaults otherwise.
 * The fallback also covers the fresh-node case: React Flow v13 passes
 * measured dimensions as the width/height props, and a new node measures
 * 0x0 — see `utils/node-size.ts`.
 */

import {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import {
  Handle,
  NodeResizeControl,
  Position,
  ResizeControlVariant,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import type { BaseShapeNodeData } from "../../types";
import { MIN_NODE_HEIGHT, MIN_NODE_WIDTH } from "../../constants";
import { useDiagramStore } from "../../stores/diagramStore";
import { resolveNodeStyle } from "../../utils/apply-style";
import { commitLabelEdit } from "../../utils/node-editing";
import { resolveNodeSize } from "../../utils/node-size";
import {
  resizeHandleAnchor,
  shapeHandles,
  shapePolygonPoints,
  type HandleSide,
  type ResizeCorner,
  type ShapeHandle,
} from "../../utils/shape-geometry";
import {
  computeFitScale,
  shapeTextBox,
} from "../../utils/shape-text-box";

/** Maps a handle side to the React Flow position it anchors to. */
const HANDLE_POSITIONS: Record<HandleSide, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};

/**
 * CSS offset for a handle whose point is not its side midpoint.
 * Side midpoints need no offset — the handle class already centers them.
 * A right-side handle also needs `right: auto`, otherwise the class's
 * `right: 0` would fight the `left` offset.
 */
function handleStyle(handle: ShapeHandle): CSSProperties | undefined {
  const isMidpoint =
    handle.side === "top" || handle.side === "bottom"
      ? handle.x === 50
      : handle.side === "left"
        ? handle.x === 0
        : handle.x === 100;
  if (isMidpoint) return undefined;
  return handle.side === "right"
    ? { left: `${handle.x}%`, right: "auto" }
    : { left: `${handle.x}%` };
}

/**
 * Corner resize controls, in render order. The `position` is the
 * control's logical corner — it fixes the drag direction (which edges
 * move) exactly as `NodeResizer`'s corner handles did. The rendered
 * position comes from `resizeHandleAnchor` instead: the library's
 * default puts every corner handle on the bounding-box corner, but
 * only the rectangle's outline passes through there, so on the other
 * shapes the dots floated in empty space away from the border.
 */
const RESIZE_CORNERS: ResizeCorner[] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

/** Edge resize controls (the lines along the bounding-box sides). */
const RESIZE_LINE_SIDES = ["top", "right", "bottom", "left"] as const;

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

  // Shrink-to-fit — the label (and description) scale down when the
  // wrapped text is taller or wider than the shape's safe text box,
  // so a long label stays inside the outline instead of spilling
  // past it. The content resets to full size whenever the text or
  // the node size changes, then shrinks again only as far as the new
  // text needs; while editing, the editor keeps the base size.
  const contentRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const textBox = shapeTextBox(data.shape);

  useEffect(() => {
    setFitScale(1);
  }, [
    data.label,
    data.description,
    data.shape,
    nodeWidth,
    nodeHeight,
    style.fontSize,
  ]);

  useLayoutEffect(() => {
    if (editing) return;
    const content = contentRef.current;
    if (content === null) return;
    const nextScale = computeFitScale(
      {
        scrollHeight: content.scrollHeight,
        scrollWidth: content.scrollWidth,
        clientHeight: content.clientHeight,
        clientWidth: content.clientWidth,
      },
      fitScale
    );
    if (nextScale !== fitScale) setFitScale(nextScale);
  }, [editing, data.label, data.description, nodeWidth, nodeHeight, fitScale]);

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
        <>
          {/* Corner handles, centered on the shape's border — see
              `resizeHandleAnchor` in `utils/shape-geometry.ts`. The
              inline left/top overrides the library's bounding-box
              corner positioning; the library's `translate: -50% -50%`
              still centers the dot on the anchor point. Same min size
              and drag directions as the NodeResizer this replaces. */}
          {RESIZE_CORNERS.map((corner) => {
            const anchor = resizeHandleAnchor(data.shape, corner);
            return (
              <NodeResizeControl
                key={corner}
                position={corner}
                minWidth={MIN_NODE_WIDTH}
                minHeight={MIN_NODE_HEIGHT}
                style={{
                  left: `${anchor.x}%`,
                  top: `${anchor.y}%`,
                }}
              />
            );
          })}
          {/* Edge lines, unchanged from NodeResizer: they run along
              the bounding-box sides and resize one axis each. */}
          {RESIZE_LINE_SIDES.map((side) => (
            <NodeResizeControl
              key={side}
              variant={ResizeControlVariant.Line}
              position={side}
              minWidth={MIN_NODE_WIDTH}
              minHeight={MIN_NODE_HEIGHT}
            />
          ))}
        </>
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
      {/* The content layer sits in the shape's safe text box
          (`shapeTextBox` in `utils/shape-text-box.ts`) — the centered
          rectangle that lies inside this shape's outline — so the
          label renders inside the shape on every shape type, not
          across the full bounding box. The layer clips anything that
          still does not fit, and the label shrinks to fit (see
          `fitScale` above) before that backstop is reached. */}
      <div
        className="shape-node__content"
        ref={contentRef}
        style={{
          left: `${textBox.left}%`,
          top: `${textBox.top}%`,
          width: `${textBox.width}%`,
          height: `${textBox.height}%`,
        }}
        onDoubleClick={startEditing}
      >
        {editing ? (
          <textarea
            className="shape-node__label-input nodrag nowheel"
            value={draft}
            autoFocus
            // Same typography as the label span below, so the field
            // looks like the text itself — borderless, transparent
            // (see `.shape-node__label-input` in DiagramStudio.css).
            style={{
              color: style.textColor,
              fontSize: style.fontSize,
              fontWeight: style.fontWeight,
            }}
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
                fontSize: style.fontSize * fitScale,
                fontWeight: style.fontWeight,
              }}
            >
              {data.label}
            </span>
            {data.description ? (
              <span
                className="shape-node__description"
                style={{ fontSize: 12 * fitScale }}
              >
                {data.description}
              </span>
            ) : null}
          </>
        )}
      </div>
      {/* Connection handles for this shape (see `utils/shape-geometry.ts`):
          every point carries both a target and a source handle, so edges
          can start from or land on any of them. */}
      {shapeHandles(data.shape).map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={HANDLE_POSITIONS[handle.side]}
          style={handleStyle(handle)}
        />
      ))}
    </div>
  );
}

export default memo(BaseShapeNode);
