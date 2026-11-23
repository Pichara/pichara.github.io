/**
 * Toolbar — top bar of the diagram editor.
 *
 * Kept deliberately slim: navigation, undo/redo, view controls, and a
 * "File" menu. Shapes live in the left sidebar
 * (`components/sidebar/ShapeLibrary.tsx`); selection actions (Group,
 * Ungroup) live in the floating bar that appears next to the selection
 * (`components/canvas/SelectionToolbar.tsx`) — Copy, Duplicate and
 * Paste are keyboard-only (Ctrl+C / Ctrl+D / Ctrl+V) — and file actions
 * (New, Diagrams, Import, Export) live in the File menu — so the top
 * bar shows only what is always relevant. Formatting opens as a popup
 * above the selection from right-click or the F key — it is no longer
 * a side panel, and there is no toolbar button for it (the "Format"
 * button was removed 2026-11-23 at the owner's request).
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
import ConfirmDialog from "../dialogs/ConfirmDialog";
import DiagramLibraryDialog from "../dialogs/DiagramLibraryDialog";
import FileMenu from "./FileMenu";
import type { Diagram } from "../../types";
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
  /** Opens the keyboard shortcuts dialog (also on the "?" key). */
  onShowShortcuts: () => void;
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
  onShowShortcuts,
}: ToolbarProps) {
  const diagram = useDiagramStore((state) => state.diagram);
  const loadDiagram = useDiagramStore((state) => state.loadDiagram);
  const newDiagram = useDiagramStore((state) => state.newDiagram);
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
  // Destructive file action waiting for the in-app confirm dialog
  // (a native window.confirm is auto-dismissed by automated browsers,
  // so the action would silently do nothing).
  const [pendingConfirm, setPendingConfirm] = useState<
    | { kind: "new" }
    | { kind: "import"; diagram: Diagram }
    | null
  >(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleNewDiagram = useCallback(() => {
    setPendingConfirm({ kind: "new" });
  }, []);

  const handleConfirmPending = useCallback(() => {
    if (pendingConfirm === null) return;
    if (pendingConfirm.kind === "new") {
      newDiagram();
    } else {
      loadDiagram(pendingConfirm.diagram);
      setFileError(null);
    }
    setPendingConfirm(null);
  }, [pendingConfirm, newDiagram, loadDiagram]);

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
        diagram.nodes.length > 0 ||
        diagram.edges.length > 0
      ) {
        // Ask first: importing replaces the canvas.
        setPendingConfirm({ kind: "import", diagram: result.diagram });
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
      </ToolbarGroup>
      <span className="studio-toolbar__spacer" aria-hidden="true" />
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
      <span className="studio-toolbar__divider" aria-hidden="true" />
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
      <span className="studio-toolbar__divider" aria-hidden="true" />
      <FileMenu
        onNew={handleNewDiagram}
        onOpenLibrary={() => setShowLibrary(true)}
        onImport={handleImportClick}
        onExportJson={() => exportDiagramAsJson(diagram)}
        onExportSvg={() => exportDiagramAsSvg(diagram)}
        onExportPng={handleExportPng}
      />
      <span className="studio-toolbar__divider" aria-hidden="true" />
      <ToolbarButton
        onClick={onShowShortcuts}
        title="Keyboard shortcuts (?)"
        ariaLabel="Show keyboard shortcuts"
      >
        ?
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={handleImportFile}
        aria-label="Choose a diagram JSON file to import"
      />
      {showLibrary ? (
        <DiagramLibraryDialog onClose={() => setShowLibrary(false)} />
      ) : null}
      {pendingConfirm !== null ? (
        <ConfirmDialog
          title={
            pendingConfirm.kind === "new" ? "New diagram" : "Import diagram"
          }
          message={
            pendingConfirm.kind === "new"
              ? "Start a new diagram? The current diagram will be replaced."
              : "Import this diagram? The current diagram will be replaced."
          }
          confirmLabel={
            pendingConfirm.kind === "new" ? "New diagram" : "Import"
          }
          onConfirm={handleConfirmPending}
          onCancel={() => setPendingConfirm(null)}
        />
      ) : null}
    </header>
  );
}
