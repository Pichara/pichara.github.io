/**
 * SelectionToolbar — floating action bar that appears next to the
 * current selection (Group / Ungroup).
 *
 * It only shows actions that make sense right now: Group needs two or
 * more top-level nodes selected, Ungroup needs a selected group. Copy,
 * Duplicate and Paste are keyboard-only (Ctrl+C / Ctrl+D / Ctrl+V, see
 * `hooks/useKeyboardShortcuts.ts`) and have no buttons here. The bar
 * hides entirely when there is no selection — the fixed toolbar no
 * longer carries these buttons at all.
 *
 * It lives inside the React Flow tree (rendered by DiagramCanvas) so it
 * can read the live viewport and track the selection as the camera
 * moves. The bar is measured after mount (and on resize) so it stays
 * clamped inside the canvas.
 */

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useViewport } from "@xyflow/react";
import { useDiagramStore } from "../../stores/diagramStore";
import { GROUP_NODE_TYPE } from "../../constants";
import {
  selectionBarPlacement,
  selectionBounds,
  SELECTION_BAR_GAP_PX,
  SELECTION_BAR_MARGIN_PX,
  type BoxSize,
} from "../../utils/selection-bar";

/** Rough size used before the bar is measured (one layout pass). */
const ESTIMATED_BAR_SIZE: BoxSize = { width: 200, height: 40 };

/** Rough canvas size used before the first measurement. */
const ESTIMATED_CONTAINER_SIZE: BoxSize = { width: 1200, height: 800 };

export default function SelectionToolbar() {
  const nodes = useDiagramStore((state) => state.diagram.nodes);
  const groupSelection = useDiagramStore((state) => state.groupSelection);
  const ungroupSelection = useDiagramStore(
    (state) => state.ungroupSelection
  );
  const viewport = useViewport();

  const selected = useMemo(
    () => nodes.filter((node) => node.selected),
    [nodes]
  );
  const canGroup = useMemo(
    () =>
      selected.filter((node) => node.parentId === undefined).length >= 2,
    [selected]
  );
  const canUngroup = useMemo(
    () => selected.some((node) => node.type === GROUP_NODE_TYPE),
    [selected]
  );
  const hasSelection = selected.length > 0;
  const visible = hasSelection;

  const bounds = useMemo(() => selectionBounds(nodes), [nodes]);

  const barRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState({
    container: ESTIMATED_CONTAINER_SIZE,
    bar: ESTIMATED_BAR_SIZE,
  });

  useLayoutEffect(() => {
    if (!visible) return;
    const bar = barRef.current;
    if (bar === null) return;
    const container = bar.parentElement;
    if (container === null) return;
    const measure = () => {
      setSizes({
        container: {
          width: container.clientWidth,
          height: container.clientHeight,
        },
        bar: { width: bar.offsetWidth, height: bar.offsetHeight },
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [visible]);

  const placement = useMemo(() => {
    // No selection bounds (defensive fallback — the bar only shows
    // with a selection): float at the top center of the canvas
    // instead of anchoring to a selection that does not exist.
    if (bounds === null) {
      return {
        left: Math.max(
          SELECTION_BAR_MARGIN_PX,
          (sizes.container.width - sizes.bar.width) / 2
        ),
        top: SELECTION_BAR_GAP_PX,
        below: false,
      };
    }
    return selectionBarPlacement(bounds, viewport, sizes.container, sizes.bar);
  }, [bounds, viewport, sizes]);

  if (!visible) return null;

  const style: CSSProperties = {
    left: placement.left,
    top: placement.top,
  };

  return (
    <div
      ref={barRef}
      className="selection-toolbar"
      style={style}
      role="toolbar"
      aria-label="Selection actions"
    >
      {canGroup ? (
        <button
          type="button"
          className="selection-toolbar__button"
          onClick={groupSelection}
          title="Group the selection so it moves together (Ctrl+G)"
          aria-label="Group selection"
        >
          Group
        </button>
      ) : null}
      {canUngroup ? (
        <button
          type="button"
          className="selection-toolbar__button"
          onClick={ungroupSelection}
          title="Ungroup the selected group (Ctrl+Shift+G)"
          aria-label="Ungroup selection"
        >
          Ungroup
        </button>
      ) : null}
    </div>
  );
}
