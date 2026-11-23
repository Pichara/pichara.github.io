/**
 * FormatPopup — formatting controls as a single compact horizontal
 * strip above an item (minimalist redesign 2026-11-23 at the owner's
 * request: the tall vertical stack was too big).
 *
 * Replaces the old right-side FormatPanel (removed 2026-11-23 at the
 * owner's request): the canvas takes the freed space and formatting
 * opens as a popup above the clicked item instead. It opens:
 *
 * - on right-click (contextmenu) on a node or edge — anchored above the
 *   click point (see `components/canvas/DiagramCanvas.tsx`);
 * - from the F key — anchored above the current selection
 *   (see `components/DiagramStudio.tsx`). There is no toolbar button
 *   for it: the toolbar "Format" button was removed 2026-11-23 at the
 *   owner's request (right-click and F are the only ways in).
 *
 * One row, no title, with a ✕ close button at the end of the row:
 * ColorPicker popover still opens from each swatch), compact selects
 * for widths / sizes / weights, and a ↺ reset icon. Shapes get fill,
 * border width, text color, font size and font weight — there is no
 * border-color control (removed 2026-11-23 at the owner's request):
 * shapes keep their border color from the data model (Matrix-theme
 * default); connections get line color, line width, line style, line
 * type, a label field and an arrowhead toggle. With a mixed selection both
 * groups sit side by side in the same row, separated by a divider.
 * Align / distribute and the animated-flow toggle used to live here;
 * they were dropped with the vertical layout — there is no other UI
 * for them yet (see the run notes), so re-adding them means finding
 * them a new home, not growing this strip back into a panel.
 * With a multi-selection the popup shows (and edits from) the first
 * element's values and applies every control to all selected elements
 * at once.
 *
 * Closing: Esc (capture phase, so it does not also clear the
 * selection), clicking outside the popup, or the ✕ button at the end
 * of the row (restored 2026-11-23: the minimalist redesign had dropped
 * it by mistake — the owner meant the toolbar "Format" button to go,
 * not this one).
 * Discrete one-shot controls (selects, the arrowhead toggle, reset)
 * also close the popup after applying — the change is done, so the
 * popup gets out of the way. Color picking and the edge-label text
 * field keep the popup open: picking a color is a multi-step gesture
 * (presets, hex typing, custom color) and typing a label takes more
 * than one keystroke.
 *
 * Placement: rendered in a portal to `document.body` with `position:
 * fixed`, measured after mount and placed above its anchor with
 * `placePopoverAbove` (flips below when there is no room above, always
 * clamped inside the viewport). The ColorPicker's own popover is a
 * separate portal, so clicks on it must not count as outside clicks
 * here (see the mousedown handler).
 *
 * Undo/redo: same as the old panel — discrete controls record one undo
 * step per change. Color pickers fire many changes per drag, so the
 * first change of a focus session records the step (`beginStyleEdit`)
 * and the rest apply without recording — one undo step per color
 * gesture.
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import { useReactFlow } from "@xyflow/react";
import { useDiagramStore } from "../../stores/diagramStore";
import ColorPicker from "./ColorPicker";
import { DEFAULT_EDGE_STYLE, DEFAULT_NODE_STYLE } from "../../constants";
import {
  asHexColor,
  resolveEdgeStyle,
  resolveNodeStyle,
} from "../../utils/apply-style";
import {
  placePopoverAbove,
  type AnchorRect,
} from "../../utils/popover-placement";
import {
  edgeEndpointBounds,
  selectionBounds,
} from "../../utils/selection-bar";
import {
  COLOR_PICKER_POPOVER_SELECTOR,
  isColorPickerPopoverOpen,
} from "../../utils/popup-escape";
import type { EdgeLineType, EdgeStyle, NodeStyle } from "../../types";

/** Where the popup anchors: a right-click point, or the selection. */
export type FormatPopupAnchor =
  | { kind: "point"; x: number; y: number }
  | { kind: "selection" };

const BORDER_WIDTHS = [1, 2, 3, 4];
const FONT_SIZES = [12, 14, 16, 18, 20];
const FONT_WEIGHTS = [
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
];
const EDGE_WIDTHS = [1, 1.5, 2, 3, 4];
const EDGE_DASHES = [
  { value: "", label: "Solid" },
  { value: "6,4", label: "Dashed" },
  { value: "2,4", label: "Dotted" },
];
const EDGE_LINE_TYPES: { value: EdgeLineType; label: string }[] = [
  { value: "curved", label: "Curved" },
  { value: "straight", label: "Straight" },
  { value: "orthogonal", label: "Orthogonal" },
];

/**
 * One color control: a swatch-only ColorPicker (compact) — the label
 * and hex code are dropped in the strip; the swatch's title and
 * aria-label still name the color. The `onBlur` ends the color-edit
 * undo session when the picker closes.
 */
interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function ColorField({ label, value, onChange, onBlur }: ColorFieldProps) {
  return (
    <ColorPicker
      compact
      label={label}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
    />
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onCommit: (value: string) => void;
}

/**
 * Single-line text field that commits on blur (Enter blurs).
 * Uncontrolled with `defaultValue` so typing never re-renders the popup
 * or records history per keystroke; the parent remounts it (via `key`)
 * when the selection changes. Compact: no visible label — the
 * placeholder and aria-label name the field.
 */
function TextField({ label, value, onCommit }: TextFieldProps) {
  return (
    <input
      type="text"
      className="format-popup__text-input"
      defaultValue={value}
      placeholder={label}
      onBlur={(event) => onCommit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
      }}
      aria-label={label}
    />
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

/**
 * Compact select: no visible label — the label is the select's
 * aria-label and title, so a screen reader still names it.
 */
function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <select
      className="format-popup__select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      title={label}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface FormatPopupProps {
  /** Where the popup anchors (right-click point or selection). */
  anchor: FormatPopupAnchor;
  /** Closes the popup. */
  onClose: () => void;
  /**
   * The canvas wrapper element: `flowToScreenPosition` is relative to
   * the React Flow pane, so the selection anchor needs this rect to
   * convert to client coordinates for the fixed-position popup.
   */
  canvasRef: RefObject<HTMLDivElement | null>;
}

export default function FormatPopup({
  anchor,
  onClose,
  canvasRef,
}: FormatPopupProps) {
  // These selectors build new arrays, so useShallow keeps the snapshot
  // referentially stable: without it, Zustand v5's useSyncExternalStore
  // sees a new snapshot on every render and re-renders in a loop until
  // React aborts with "Maximum update depth exceeded" (black /diagram).
  const selectedNodes = useDiagramStore(
    useShallow((state) =>
      state.diagram.nodes.filter((node) => node.selected)
    )
  );
  const selectedEdges = useDiagramStore(
    useShallow((state) =>
      state.diagram.edges.filter((edge) => edge.selected)
    )
  );
  const beginStyleEdit = useDiagramStore((state) => state.beginStyleEdit);
  const updateSelectedNodeStyle = useDiagramStore(
    (state) => state.updateSelectedNodeStyle
  );
  const updateSelectedEdgeStyle = useDiagramStore(
    (state) => state.updateSelectedEdgeStyle
  );
  const updateSelectedEdgeLabel = useDiagramStore(
    (state) => state.updateSelectedEdgeLabel
  );
  const resetSelectedStyle = useDiagramStore(
    (state) => state.resetSelectedStyle
  );

  // True while a color picker drag is in progress: the first change of
  // the drag records the undo step, later changes only apply the style.
  const colorEditActive = useRef(false);

  const applyNodeColor = useCallback(
    (patch: Partial<NodeStyle>) => {
      if (!colorEditActive.current) {
        beginStyleEdit();
        colorEditActive.current = true;
      }
      updateSelectedNodeStyle(patch, false);
    },
    [beginStyleEdit, updateSelectedNodeStyle]
  );

  const applyEdgeColor = useCallback(
    (patch: Partial<EdgeStyle>) => {
      if (!colorEditActive.current) {
        beginStyleEdit();
        colorEditActive.current = true;
      }
      updateSelectedEdgeStyle(patch, false);
    },
    [beginStyleEdit, updateSelectedEdgeStyle]
  );

  const endColorEdit = useCallback(() => {
    colorEditActive.current = false;
  }, []);

  // With a multi-selection the popup shows (and edits from) the first
  // element's values; applying a control updates every selected element.
  const nodeStyle = resolveNodeStyle(selectedNodes[0]?.data.style);
  const edgeStyle = resolveEdgeStyle(selectedEdges[0]?.data?.style);
  const hasSelection =
    selectedNodes.length > 0 || selectedEdges.length > 0;

  // --- Placement -------------------------------------------------------

  const { flowToScreenPosition } = useReactFlow();
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<CSSProperties>({
    visibility: "hidden",
  });
  // Last placed position: `place` only sets state when it moved, so
  // the layout effect below (which runs after every render while the
  // popup is open) cannot setState itself into a render loop.
  const lastPlacedRef = useRef<{ top: number; left: number } | null>(null);

  // Screen rect of the anchor in client coordinates: the click point
  // directly, or the selection's flow bounds converted through the
  // pane (edges-only selections anchor to their endpoint nodes).
  const anchorRect = useCallback((): AnchorRect => {
    if (anchor.kind === "point") {
      return { left: anchor.x, right: anchor.x, top: anchor.y, bottom: anchor.y };
    }
    const nodes = useDiagramStore.getState().diagram.nodes;
    const edges = useDiagramStore.getState().diagram.edges;
    const bounds =
      selectionBounds(nodes) ?? edgeEndpointBounds(edges, nodes);
    const canvas = canvasRef.current;
    if (bounds === null || canvas === null) {
      // Defensive fallback (no measurable selection): top-center of the
      // canvas, so the popup still opens somewhere sensible.
      const rect = canvas?.getBoundingClientRect();
      const x = rect === undefined ? window.innerWidth / 2 : rect.left + rect.width / 2;
      const y = rect === undefined ? 120 : rect.top + 120;
      return { left: x, right: x, top: y, bottom: y };
    }
    const canvasRect = canvas.getBoundingClientRect();
    const topLeft = flowToScreenPosition({ x: bounds.x, y: bounds.y });
    const bottomRight = flowToScreenPosition({
      x: bounds.x + bounds.width,
      y: bounds.y + bounds.height,
    });
    return {
      left: canvasRect.left + topLeft.x,
      right: canvasRect.left + bottomRight.x,
      top: canvasRect.top + topLeft.y,
      bottom: canvasRect.top + bottomRight.y,
    };
  }, [anchor, canvasRef, flowToScreenPosition]);

  // Measure the popup after mount and whenever its content or anchor
  // changes (its height is content-driven), and re-place on resize:
  // the placement must use the real size.
  useLayoutEffect(() => {
    const popup = popupRef.current;
    if (popup === null) return;
    const place = () => {
      const rect = popup.getBoundingClientRect();
      const { top, left } = placePopoverAbove(
        anchorRect(),
        { width: rect.width, height: rect.height },
        { width: window.innerWidth, height: window.innerHeight }
      );
      const last = lastPlacedRef.current;
      if (last === null || last.top !== top || last.left !== left) {
        lastPlacedRef.current = { top, left };
        setPopupStyle({ top, left, visibility: "visible" });
      }
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(popup);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  });

  // Move keyboard focus into the popup once it becomes visible, so a
  // keyboard user who opened it with F lands on
  // its controls instead of staying on the canvas. Focusing on mount
  // does not work: at that point the popup's style is still
  // `visibility: hidden` (the layout effect's visible style has not
  // rendered yet) and `.focus()` on a `visibility: hidden` element is
  // a no-op in Chrome.
  useEffect(() => {
    if (popupStyle.visibility === "visible") {
      popupRef.current?.focus();
    }
  }, [popupStyle.visibility]);

  // Close on Escape (capture phase: the editor's own Esc handler clears
  // the selection, and closing the popup must not do that too) and on
  // an outside mousedown. Clicks inside the ColorPicker's own portal
  // popover are not outside clicks — it lives in `document.body`,
  // outside this popup's DOM tree.
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        popupRef.current !== null &&
        !popupRef.current.contains(target) &&
        !(target instanceof Element && target.closest(COLOR_PICKER_POPOVER_SELECTOR) !== null)
      ) {
        onClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // A color-picker popover open inside the popup owns Escape:
        // its own capture-phase handler (registered later, so it runs
        // after this one) closes just the picker. Return without
        // closing or stopping propagation so that handler still runs;
        // closing here would close the whole popup instead.
        if (isColorPickerPopoverOpen(document)) return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [onClose]);

  if (!hasSelection) return null;

  return createPortal(
    <div
      ref={popupRef}
      className="format-popup"
      role="dialog"
      aria-label="Format"
      tabIndex={-1}
      style={popupStyle}
    >
      {selectedNodes.length > 0 ? (
        <div
          className="format-popup__row"
          role="group"
          aria-label="Shape formatting"
        >
          <ColorField
            label="Fill"
            value={asHexColor(
              nodeStyle.backgroundColor,
              DEFAULT_NODE_STYLE.backgroundColor
            )}
            onChange={(value) => applyNodeColor({ backgroundColor: value })}
            onBlur={endColorEdit}
          />
          <SelectField
            label="Border width"
            value={String(nodeStyle.borderWidth)}
            options={BORDER_WIDTHS.map((width) => ({
              value: String(width),
              label: `${width} px`,
            }))}
            onChange={(value) => {
              updateSelectedNodeStyle({ borderWidth: Number(value) });
              onClose();
            }}
          />
          <ColorField
            label="Text"
            value={asHexColor(
              nodeStyle.textColor,
              DEFAULT_NODE_STYLE.textColor
            )}
            onChange={(value) => applyNodeColor({ textColor: value })}
            onBlur={endColorEdit}
          />
          <SelectField
            label="Font size"
            value={String(nodeStyle.fontSize)}
            options={FONT_SIZES.map((size) => ({
              value: String(size),
              label: `${size} px`,
            }))}
            onChange={(value) => {
              updateSelectedNodeStyle({ fontSize: Number(value) });
              onClose();
            }}
          />
          <SelectField
            label="Font weight"
            value={nodeStyle.fontWeight}
            options={FONT_WEIGHTS}
            onChange={(value) => {
              updateSelectedNodeStyle({ fontWeight: value });
              onClose();
            }}
          />
          <button
            type="button"
            className="studio-button format-popup__icon-button"
            onClick={() => {
              resetSelectedStyle();
              onClose();
            }}
            aria-label="Reset style"
            title="Reset style"
          >
            ↺
          </button>
        </div>
      ) : null}

      {selectedNodes.length > 0 && selectedEdges.length > 0 ? (
        <span className="format-popup__divider" aria-hidden="true" />
      ) : null}

      {selectedEdges.length > 0 ? (
        <div
          className="format-popup__row"
          role="group"
          aria-label="Connection formatting"
        >
          <ColorField
            label="Line"
            value={asHexColor(
              edgeStyle.strokeColor,
              DEFAULT_EDGE_STYLE.strokeColor
            )}
            onChange={(value) => applyEdgeColor({ strokeColor: value })}
            onBlur={endColorEdit}
          />
          <SelectField
            label="Line width"
            value={String(edgeStyle.strokeWidth)}
            options={EDGE_WIDTHS.map((width) => ({
              value: String(width),
              label: `${width} px`,
            }))}
            onChange={(value) => {
              updateSelectedEdgeStyle({ strokeWidth: Number(value) });
              onClose();
            }}
          />
          <SelectField
            label="Line style"
            value={edgeStyle.strokeDasharray}
            options={EDGE_DASHES}
            onChange={(value) => {
              updateSelectedEdgeStyle({ strokeDasharray: value });
              onClose();
            }}
          />
          <SelectField
            label="Line type"
            value={edgeStyle.lineType}
            options={EDGE_LINE_TYPES}
            onChange={(value) => {
              updateSelectedEdgeStyle({ lineType: value as EdgeLineType });
              onClose();
            }}
          />
          <TextField
            key={selectedEdges[0]?.id}
            label="Label"
            value={selectedEdges[0]?.data?.label ?? ""}
            onCommit={(value) => updateSelectedEdgeLabel(value)}
          />
          <button
            type="button"
            className="studio-button format-popup__icon-button"
            onClick={() => {
              updateSelectedEdgeStyle({ arrow: !edgeStyle.arrow });
              onClose();
            }}
            aria-label="Arrowhead"
            aria-pressed={edgeStyle.arrow}
            title="Arrowhead"
          >
            →
          </button>
          <button
            type="button"
            className="studio-button format-popup__icon-button"
            onClick={() => {
              resetSelectedStyle();
              onClose();
            }}
            aria-label="Reset style"
            title="Reset style"
          >
            ↺
          </button>
        </div>
      ) : null}
      <button
        type="button"
        className="studio-button format-popup__icon-button format-popup__close"
        onClick={onClose}
        aria-label="Close format popup"
        title="Close"
      >
        ✕
      </button>
    </div>,
    document.body
  );
}
