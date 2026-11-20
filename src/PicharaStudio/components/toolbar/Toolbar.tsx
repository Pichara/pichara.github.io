/**
 * Toolbar — top bar of the diagram editor.
 *
 * Shapes live in the left sidebar (`components/sidebar/ShapeLibrary.tsx`);
 * this bar holds navigation, undo/redo, export/import, and "New" (starts
 * an empty diagram with a confirm step, since autosave will replace the
 * saved diagram).
 */

import { useCallback, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { useDiagramStore } from "../../stores/diagramStore";
import { useHistoryStore } from "../../stores/historyStore";
import {
  exportDiagramAsJson,
  exportDiagramAsPng,
  exportDiagramAsSvg,
} from "../../services/export/diagram-export";
import { parseDiagramJson } from "../../services/import/diagram-import";

interface ToolbarProps {
  /** True when the most recent LocalStorage autosave failed. */
  saveFailed: boolean;
}

export default function Toolbar({ saveFailed }: ToolbarProps) {
  const diagram = useDiagramStore((state) => state.diagram);
  const loadDiagram = useDiagramStore((state) => state.loadDiagram);
  const newDiagram = useDiagramStore((state) => state.newDiagram);
  const diagramName = useDiagramStore((state) => state.diagram.name);
  const copySelection = useDiagramStore((state) => state.copySelection);
  const pasteClipboard = useDiagramStore((state) => state.pasteClipboard);
  const duplicateSelection = useDiagramStore(
    (state) => state.duplicateSelection
  );
  const hasNodeSelection = useDiagramStore((state) =>
    state.diagram.nodes.some((node) => node.selected)
  );
  const hasClipboard = useDiagramStore((state) => state.clipboard !== null);
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
      <span className="studio-toolbar__diagram-name">{diagramName}</span>
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
      <div
        className="studio-toolbar__history"
        role="group"
        aria-label="Undo and redo"
      >
        <button
          type="button"
          className="studio-button"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          ↩ Undo
        </button>
        <button
          type="button"
          className="studio-button"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          ↪ Redo
        </button>
      </div>
      <div
        className="studio-toolbar__view"
        role="group"
        aria-label="View"
      >
        <button
          type="button"
          className="studio-button"
          onClick={requestFitView}
          disabled={!hasNodes}
          title="Zoom to fit the whole diagram (Ctrl+0)"
          aria-label="Zoom to fit"
        >
          Zoom to fit
        </button>
        <button
          type="button"
          className="studio-button"
          onClick={toggleGrid}
          aria-pressed={showGrid}
          title="Show or hide the dotted grid"
          aria-label="Toggle grid"
        >
          Grid
        </button>
        <button
          type="button"
          className="studio-button"
          onClick={toggleSnapToGrid}
          aria-pressed={snapToGrid}
          title="Snap shapes to the grid when moving, dropping or adding them"
          aria-label="Toggle snap to grid"
        >
          Snap
        </button>
      </div>
      <div
        className="studio-toolbar__clipboard"
        role="group"
        aria-label="Copy, paste and duplicate"
      >
        <button
          type="button"
          className="studio-button"
          onClick={copySelection}
          disabled={!hasNodeSelection}
          title="Copy selection (Ctrl+C)"
          aria-label="Copy selection"
        >
          Copy
        </button>
        <button
          type="button"
          className="studio-button"
          onClick={pasteClipboard}
          disabled={!hasClipboard}
          title="Paste (Ctrl+V)"
          aria-label="Paste"
        >
          Paste
        </button>
        <button
          type="button"
          className="studio-button"
          onClick={duplicateSelection}
          disabled={!hasNodeSelection}
          title="Duplicate selection (Ctrl+D)"
          aria-label="Duplicate selection"
        >
          Duplicate
        </button>
      </div>
      <div
        className="studio-toolbar__export"
        role="group"
        aria-label="Export and import"
      >
        <button
          type="button"
          className="studio-button"
          onClick={() => exportDiagramAsJson(diagram)}
          title="Download the diagram as a JSON file"
        >
          Export JSON
        </button>
        <button
          type="button"
          className="studio-button"
          onClick={() => exportDiagramAsSvg(diagram)}
          title="Download the diagram as an SVG image"
        >
          Export SVG
        </button>
        <button
          type="button"
          className="studio-button"
          onClick={handleExportPng}
          title="Download the diagram as a PNG image"
        >
          Export PNG
        </button>
        <button
          type="button"
          className="studio-button"
          onClick={handleImportClick}
          title="Open a diagram from a JSON file"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={handleImportFile}
          aria-label="Choose a diagram JSON file to import"
        />
      </div>
      <button
        type="button"
        className="studio-button"
        onClick={handleNewDiagram}
      >
        New
      </button>
    </header>
  );
}
