/**
 * FormatPanel — side formatting panel (right side of the editor).
 *
 * Shows controls for the current selection: fill/border/text for shapes,
 * line color/width/style for connections. With nothing selected it shows
 * a hint instead. Every control applies to all selected elements at once.
 *
 * Undo/redo: discrete controls (selects, checkbox) record one undo step
 * per change. Color pickers fire many changes per drag, so the first
 * change of a focus session records the step (`beginStyleEdit`) and the
 * rest apply without recording — one undo step per color gesture.
 */

import { useCallback, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDiagramStore } from "../../stores/diagramStore";
import { DEFAULT_EDGE_STYLE, DEFAULT_NODE_STYLE } from "../../constants";
import {
  asHexColor,
  resolveEdgeStyle,
  resolveNodeStyle,
} from "../../utils/apply-style";
import type { EdgeLineType, EdgeStyle, NodeStyle } from "../../types";

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

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

function ColorField({ label, value, onChange, onBlur }: ColorFieldProps) {
  return (
    <label className="format-panel__field">
      <span className="format-panel__label">{label}</span>
      <span className="format-panel__color-row">
        <input
          type="color"
          className="format-panel__color-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          aria-label={label}
        />
        <code className="format-panel__color-value">{value}</code>
      </span>
    </label>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onCommit: (value: string) => void;
}

/**
 * Single-line text field that commits on blur (Enter blurs).
 * Uncontrolled with `defaultValue` so typing never re-renders the panel
 * or records history per keystroke; the parent remounts it (via `key`)
 * when the selection changes.
 */
function TextField({ label, value, onCommit }: TextFieldProps) {
  return (
    <label className="format-panel__field">
      <span className="format-panel__label">{label}</span>
      <input
        type="text"
        className="format-panel__text-input"
        defaultValue={value}
        onBlur={(event) => onCommit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        aria-label={label}
      />
    </label>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="format-panel__field">
      <span className="format-panel__label">{label}</span>
      <select
        className="format-panel__select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FormatPanelProps {
  /** True when the panel is open as an overlay drawer (narrow screens). */
  isMobileOpen?: boolean;
  /** Closes the overlay drawer (narrow screens). */
  onClose?: () => void;
}

export default function FormatPanel({
  isMobileOpen = false,
  onClose,
}: FormatPanelProps) {
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
  const alignSelection = useDiagramStore((state) => state.alignSelection);
  const distributeSelection = useDiagramStore(
    (state) => state.distributeSelection
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

  // With a multi-selection the panel shows (and edits from) the first
  // element's values; applying a control updates every selected element.
  const nodeStyle = resolveNodeStyle(selectedNodes[0]?.data.style);
  const edgeStyle = resolveEdgeStyle(selectedEdges[0]?.data?.style);
  const hasSelection =
    selectedNodes.length > 0 || selectedEdges.length > 0;

  return (
    <aside
      className={`format-panel${isMobileOpen ? " is-mobile-open" : ""}`}
      aria-label="Format"
    >
      <button
        type="button"
        className="studio-button studio-panel__close"
        onClick={onClose}
        aria-label="Close format panel"
      >
        ✕ Close
      </button>
      <h2 className="format-panel__title">Format</h2>

      {!hasSelection ? (
        <p className="format-panel__hint">
          Select a shape or a connection to format it.
        </p>
      ) : null}

      {selectedNodes.length > 0 ? (
        <section aria-label="Shape formatting">
          <h3 className="format-panel__section-title">
            {selectedNodes.length === 1
              ? "Shape"
              : `Shapes (${selectedNodes.length})`}
          </h3>
          <ColorField
            label="Fill"
            value={asHexColor(
              nodeStyle.backgroundColor,
              DEFAULT_NODE_STYLE.backgroundColor
            )}
            onChange={(value) => applyNodeColor({ backgroundColor: value })}
            onBlur={endColorEdit}
          />
          <ColorField
            label="Border"
            value={asHexColor(
              nodeStyle.borderColor,
              DEFAULT_NODE_STYLE.borderColor
            )}
            onChange={(value) => applyNodeColor({ borderColor: value })}
            onBlur={endColorEdit}
          />
          <SelectField
            label="Border width"
            value={String(nodeStyle.borderWidth)}
            options={BORDER_WIDTHS.map((width) => ({
              value: String(width),
              label: `${width} px`,
            }))}
            onChange={(value) =>
              updateSelectedNodeStyle({ borderWidth: Number(value) })
            }
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
            onChange={(value) =>
              updateSelectedNodeStyle({ fontSize: Number(value) })
            }
          />
          <SelectField
            label="Font weight"
            value={nodeStyle.fontWeight}
            options={FONT_WEIGHTS}
            onChange={(value) =>
              updateSelectedNodeStyle({ fontWeight: value })
            }
          />
        </section>
      ) : null}

      {selectedEdges.length > 0 ? (
        <section aria-label="Connection formatting">
          <h3 className="format-panel__section-title">
            {selectedEdges.length === 1
              ? "Connection"
              : `Connections (${selectedEdges.length})`}
          </h3>
          <TextField
            key={selectedEdges[0]?.id}
            label="Label"
            value={selectedEdges[0]?.data?.label ?? ""}
            onCommit={(value) => updateSelectedEdgeLabel(value)}
          />
          <SelectField
            label="Line type"
            value={edgeStyle.lineType}
            options={EDGE_LINE_TYPES}
            onChange={(value) =>
              updateSelectedEdgeStyle({ lineType: value as EdgeLineType })
            }
          />
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
            onChange={(value) =>
              updateSelectedEdgeStyle({ strokeWidth: Number(value) })
            }
          />
          <SelectField
            label="Line style"
            value={edgeStyle.strokeDasharray}
            options={EDGE_DASHES}
            onChange={(value) =>
              updateSelectedEdgeStyle({ strokeDasharray: value })
            }
          />
          <label className="format-panel__check">
            <input
              type="checkbox"
              checked={edgeStyle.animated}
              onChange={(event) =>
                updateSelectedEdgeStyle({ animated: event.target.checked })
              }
            />
            Animated flow
          </label>
          <label className="format-panel__check">
            <input
              type="checkbox"
              checked={edgeStyle.arrow}
              onChange={(event) =>
                updateSelectedEdgeStyle({ arrow: event.target.checked })
              }
            />
            Arrowhead
          </label>
        </section>
      ) : null}

      {selectedNodes.length >= 2 ? (
        <section aria-label="Arrange">
          <h3 className="format-panel__section-title">Arrange</h3>
          <div
            className="format-panel__arrange-grid"
            role="group"
            aria-label="Align"
          >
            <button
              type="button"
              className="studio-button format-panel__arrange-button"
              onClick={() => alignSelection("left")}
              title="Align left edges"
            >
              ⇤ Left
            </button>
            <button
              type="button"
              className="studio-button format-panel__arrange-button"
              onClick={() => alignSelection("center-x")}
              title="Align horizontal centers"
            >
              ↔ Center
            </button>
            <button
              type="button"
              className="studio-button format-panel__arrange-button"
              onClick={() => alignSelection("right")}
              title="Align right edges"
            >
              Right ⇥
            </button>
            <button
              type="button"
              className="studio-button format-panel__arrange-button"
              onClick={() => alignSelection("top")}
              title="Align top edges"
            >
              ⇧ Top
            </button>
            <button
              type="button"
              className="studio-button format-panel__arrange-button"
              onClick={() => alignSelection("center-y")}
              title="Align vertical centers"
            >
              ↕ Middle
            </button>
            <button
              type="button"
              className="studio-button format-panel__arrange-button"
              onClick={() => alignSelection("bottom")}
              title="Align bottom edges"
            >
              Bottom ⇩
            </button>
          </div>
          <div
            className="format-panel__arrange-grid format-panel__arrange-grid--two"
            role="group"
            aria-label="Distribute"
          >
            <button
              type="button"
              className="studio-button format-panel__arrange-button"
              onClick={() => distributeSelection("horizontal")}
              disabled={selectedNodes.length < 3}
              title="Space evenly left to right (needs 3+ shapes)"
            >
              Distribute ⇄
            </button>
            <button
              type="button"
              className="studio-button format-panel__arrange-button"
              onClick={() => distributeSelection("vertical")}
              disabled={selectedNodes.length < 3}
              title="Space evenly top to bottom (needs 3+ shapes)"
            >
              Distribute ⇅
            </button>
          </div>
        </section>
      ) : null}

      {hasSelection ? (
        <button
          type="button"
          className="studio-button format-panel__reset"
          onClick={resetSelectedStyle}
        >
          Reset style
        </button>
      ) : null}
    </aside>
  );
}
