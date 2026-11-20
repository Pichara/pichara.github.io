/**
 * Toolbar — top bar of the diagram editor.
 *
 * Shapes live in the left sidebar (`components/sidebar/ShapeLibrary.tsx`);
 * this bar holds navigation, undo/redo, export/import, and "New" (starts
 * an empty diagram with a confirm step, since autosave will replace the
 * saved diagram).
 */

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { useDiagramStore } from "../../stores/diagramStore";
import { useHistoryStore } from "../../stores/historyStore";
import { GROUP_NODE_TYPE } from "../../constants";
import DiagramLibraryDialog from "../dialogs/DiagramLibraryDialog";
import {
  exportDiagramAsJson,
  exportDiagramAsPng,
  exportDiagramAsSvg,
} from "../../services/export/diagram-export";
import { parseDiagramJson } from "../../services/import/diagram-import";
import type { MobilePanel } from "../../utils/mobile-panels";

interface ToolbarProps {
  /** True when the most recent LocalStorage autosave failed. */
  saveFailed: boolean;
  /** Which side panel is open as an overlay drawer on narrow screens. */
  mobilePanel: MobilePanel | null;
  /** Toggles a side panel drawer (narrow screens only; no-op visually on desktop). */
  onToggleMobilePanel: (panel: MobilePanel) => void;
}

interface ToolbarGroupProps {
  /** Accessible name for the button group. */
  label: string;
  /** Layout class (each group keeps its own toolbar class). */
  className: string;
  children: ReactNode;
}

/** A labelled group of toolbar buttons (one concern per group). */
function ToolbarGroup({ label, className, children }: ToolbarGroupProps) {
  return (
    <div className={className} role="group" aria-label={label}>
      {children}
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  /** Tooltip (also the accessible name when `ariaLabel` is omitted). */
  title?: string;
  /** Accessible name for buttons whose text is not descriptive enough. */
  ariaLabel?: string;
  disabled?: boolean;
  /** True when the button reflects an on state (Grid/Snap, panel toggles). */
  pressed?: boolean;
  /** True when the button opens a panel that is currently open. */
  expanded?: boolean;
  /** Extra class (e.g. the mobile panel-toggle class). */
  className?: string;
  children: ReactNode;
}

/** One toolbar button: same styling, optional toggle state. */
function ToolbarButton({
  onClick,
  title,
  ariaLabel,
  disabled = false,
  pressed,
  expanded,
  className = "studio-button",
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      {...(title !== undefined ? { title } : {})}
      {...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : {})}
      {...(pressed !== undefined ? { "aria-pressed": pressed } : {})}
      {...(expanded !== undefined ? { "aria-expanded": expanded } : {})}
    >
      {children}
    </button>
  );
}

export default function Toolbar({
  saveFailed,
  mobilePanel,
  onToggleMobilePanel,
}: ToolbarProps) {
  const diagram = useDiagramStore((state) => state.diagram);
  const loadDiagram = useDiagramStore((state) => state.loadDiagram);
  const newDiagram = useDiagramStore((state) => state.newDiagram);
  const copySelection = useDiagramStore((state) => state.copySelection);
  const pasteClipboard = useDiagramStore((state) => state.pasteClipboard);
  const duplicateSelection = useDiagramStore(
    (state) => state.duplicateSelection
  );
  const hasNodeSelection = useDiagramStore((state) =>
    state.diagram.nodes.some((node) => node.selected)
  );
  const hasClipboard = useDiagramStore((state) => state.clipboard !== null);
  const groupSelection = useDiagramStore((state) => state.groupSelection);
  const ungroupSelection = useDiagramStore(
    (state) => state.ungroupSelection
  );
  const canGroup = useDiagramStore(
    (state) =>
      state.diagram.nodes.filter(
        (node) => node.selected && node.parentId === undefined
      ).length >= 2
  );
  const canUngroup = useDiagramStore((state) =>
    state.diagram.nodes.some(
      (node) => node.selected && node.type === GROUP_NODE_TYPE
    )
  );
  const hasNodes = useDiagramStore(
    (state) => state.diagram.nodes.length > 0
  );
  const showGrid = useDiagramStore((state) => state.showGrid);
  const snapToGrid = useDiagramStore((state) => state.snapToGrid);
  const toggleGrid = useDiagramStore((state) => state.toggleGrid);
  const toggleSnapToGrid = useDiagramStore(
    (state) => state.toggleSnapToGrid
  );
  const requestFitView = useDiagramStore((state) => state.requestFitView);
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.past.length > 0);
  const canRedo = useHistoryStore((state) => state.future.length > 0);

  // Import/export failures are shown inline (same treatment as the
  // autosave warning) instead of failing silently.
  const [fileError, setFileError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleNewDiagram = useCallback(() => {
    if (
      window.confirm(
        "Start a new diagram? The current diagram will be replaced."
      )
    ) {
      newDiagram();
    }
  }, [newDiagram]);

  const handleExportPng = useCallback(() => {
    setFileError(null);
    exportDiagramAsPng(diagram).catch((error: unknown) => {
      setFileError(
        error instanceof Error
          ? error.message
          : "Could not export the diagram as PNG."
      );
    });
  }, [diagram]);

  const handleImportClick = useCallback(() => {
    setFileError(null);
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      // Reset the input so the same file can be picked again.
      event.target.value = "";
      if (file === undefined) return;
      const text = await file.text();
      const result = parseDiagramJson(text);
      if (!result.ok) {
        setFileError(result.error);
        return;
      }
      if (
        (diagram.nodes.length > 0 || diagram.edges.length > 0) &&
        !window.confirm(
          "Import this diagram? The current diagram will be replaced."
        )
      ) {
        return;
      }
      loadDiagram(result.diagram);
      setFileError(null);
    },
    [diagram, loadDiagram]
  );

  return (
    <header className="studio-toolbar">
      <Link to="/" className="studio-toolbar__back">
        ← Portfolio
      </Link>
      <span className="studio-toolbar__title">Pichara Studio</span>
      <span className="studio-toolbar__diagram-name">{diagram.name}</span>
      {saveFailed ? (
        <span className="studio-toolbar__save-warning" role="alert">
          Couldn&apos;t save locally
        </span>
      ) : null}
      {fileError !== null ? (
        <span className="studio-toolbar__save-warning" role="alert">
          {fileError}
        </span>
      ) : null}
      <ToolbarGroup label="Side panels" className="studio-toolbar__panels">
        <ToolbarButton
          onClick={() => onToggleMobilePanel("shapes")}
          title="Open the shape library"
          ariaLabel="Toggle shape library"
          pressed={mobilePanel === "shapes"}
          expanded={mobilePanel === "shapes"}
          className="studio-button studio-toolbar__panel-toggle"
        >
          Shapes
        </ToolbarButton>
        <ToolbarButton
          onClick={() => onToggleMobilePanel("format")}
          title="Open the format panel"
          ariaLabel="Toggle format panel"
          pressed={mobilePanel === "format"}
          expanded={mobilePanel === "format"}
          className="studio-button studio-toolbar__panel-toggle"
        >
          Format
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup label="Undo and redo" className="studio-toolbar__history">
        <ToolbarButton
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          ariaLabel="Undo"
        >
          ↩ Undo
        </ToolbarButton>
        <ToolbarButton
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          ariaLabel="Redo"
        >
          ↪ Redo
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup label="View" className="studio-toolbar__view">
        <ToolbarButton
          onClick={requestFitView}
          disabled={!hasNodes}
          title="Zoom to fit the whole diagram (Ctrl+0)"
          ariaLabel="Zoom to fit"
        >
          Zoom to fit
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleGrid}
          title="Show or hide the dotted grid"
          ariaLabel="Toggle grid"
          pressed={showGrid}
        >
          Grid
        </ToolbarButton>
        <ToolbarButton
          onClick={toggleSnapToGrid}
          title="Snap shapes to the grid when moving, dropping or adding them"
          ariaLabel="Toggle snap to grid"
          pressed={snapToGrid}
        >
          Snap
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup
        label="Copy, paste and duplicate"
        className="studio-toolbar__clipboard"
      >
        <ToolbarButton
          onClick={copySelection}
          disabled={!hasNodeSelection}
          title="Copy selection (Ctrl+C)"
          ariaLabel="Copy selection"
        >
          Copy
        </ToolbarButton>
        <ToolbarButton
          onClick={pasteClipboard}
          disabled={!hasClipboard}
          title="Paste (Ctrl+V)"
          ariaLabel="Paste"
        >
          Paste
        </ToolbarButton>
        <ToolbarButton
          onClick={duplicateSelection}
          disabled={!hasNodeSelection}
          title="Duplicate selection (Ctrl+D)"
          ariaLabel="Duplicate selection"
        >
          Duplicate
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup label="Group and ungroup" className="studio-toolbar__group">
        <ToolbarButton
          onClick={groupSelection}
          disabled={!canGroup}
          title="Group the selection so it moves together (Ctrl+G)"
          ariaLabel="Group selection"
        >
          Group
        </ToolbarButton>
        <ToolbarButton
          onClick={ungroupSelection}
          disabled={!canUngroup}
          title="Ungroup the selected group (Ctrl+Shift+G)"
          ariaLabel="Ungroup selection"
        >
          Ungroup
        </ToolbarButton>
      </ToolbarGroup>
      <ToolbarGroup label="Export and import" className="studio-toolbar__export">
        <ToolbarButton
          onClick={() => exportDiagramAsJson(diagram)}
          title="Download the diagram as a JSON file"
        >
          Export JSON
        </ToolbarButton>
        <ToolbarButton
          onClick={() => exportDiagramAsSvg(diagram)}
          title="Download the diagram as an SVG image"
        >
          Export SVG
        </ToolbarButton>
        <ToolbarButton
          onClick={handleExportPng}
          title="Download the diagram as a PNG image"
        >
          Export PNG
        </ToolbarButton>
        <ToolbarButton
          onClick={handleImportClick}
          title="Open a diagram from a JSON file"
        >
          Import
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={handleImportFile}
          aria-label="Choose a diagram JSON file to import"
        />
      </ToolbarGroup>
      <ToolbarButton
        onClick={() => setShowLibrary(true)}
        title="Open templates and your saved diagrams"
      >
        Diagrams
      </ToolbarButton>
      <ToolbarButton onClick={handleNewDiagram}>
        New
      </ToolbarButton>
      {showLibrary ? (
        <DiagramLibraryDialog onClose={() => setShowLibrary(false)} />
      ) : null}
    </header>
  );
}
