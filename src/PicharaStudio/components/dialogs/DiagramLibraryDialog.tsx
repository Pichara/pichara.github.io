/**
 * DiagramLibraryDialog — templates and named saved diagrams.
 *
 * Opened from the toolbar's "Diagrams" button. Three sections:
 *
 * - Templates: ready-made diagrams (flowchart, system design). Loading
 *   one replaces the current diagram, with the same confirm step as
 *   import when the canvas is not empty.
 * - Save current diagram: name the diagram on the canvas and save it to
 *   the library (creates the entry, or updates it when it exists).
 * - My diagrams: every saved diagram, most recent first, with Open and
 *   Delete. Opening replaces the canvas (confirm when non-empty);
 *   deleting the diagram currently on the canvas starts a new empty one
 *   so autosave does not resurrect it.
 */

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useDiagramStore } from "../../stores/diagramStore";
import { TEMPLATES } from "../../services/templates";
import {
  deleteDiagramFromLibrary,
  listSavedDiagrams,
  loadDiagramFromLibrary,
  saveDiagramToLibrary,
  type SavedDiagramEntry,
} from "../../services/diagram-library";

interface DiagramLibraryDialogProps {
  /** Close the dialog. */
  onClose: () => void;
}

interface LibraryRowProps {
  /** Row title (diagram/template name). */
  name: ReactNode;
  /** Secondary line (description or last-saved time). */
  meta: string;
  /** Action buttons on the right of the row. */
  children: ReactNode;
}

/** One row of the templates / saved-diagrams lists (name + actions). */
function LibraryRow({ name, meta, children }: LibraryRowProps) {
  return (
    <li className="diagram-library-dialog__row">
      <span className="diagram-library-dialog__row-text">
        <span className="diagram-library-dialog__row-name">{name}</span>
        <span className="diagram-library-dialog__row-meta">{meta}</span>
      </span>
      {children}
    </li>
  );
}

export default function DiagramLibraryDialog({
  onClose,
}: DiagramLibraryDialogProps) {
  const diagram = useDiagramStore((state) => state.diagram);
  const loadDiagram = useDiagramStore((state) => state.loadDiagram);
  const newDiagram = useDiagramStore((state) => state.newDiagram);
  const renameDiagram = useDiagramStore((state) => state.renameDiagram);

  const [entries, setEntries] = useState<SavedDiagramEntry[]>(() =>
    listSavedDiagrams()
  );
  const [saveName, setSaveName] = useState(diagram.name);
  const [message, setMessage] = useState<string | null>(null);

  const refreshEntries = useCallback(() => {
    setEntries(listSavedDiagrams());
  }, []);

  // Re-read the list whenever the dialog opens.
  useEffect(() => {
    refreshEntries();
  }, [refreshEntries]);

  const hasContent = diagram.nodes.length > 0 || diagram.edges.length > 0;

  const confirmReplace = useCallback(() => {
    if (!hasContent) return true;
    return window.confirm(
      "Replace the current diagram? Unsaved changes on the canvas will be lost."
    );
  }, [hasContent]);

  const handleUseTemplate = useCallback(
    (templateId: string) => {
      const template = TEMPLATES.find(
        (candidate) => candidate.id === templateId
      );
      if (template === undefined) return;
      if (!confirmReplace()) return;
      loadDiagram(template.build());
      onClose();
    },
    [confirmReplace, loadDiagram, onClose]
  );

  const handleSave = useCallback(() => {
    const name = saveName.trim();
    if (name === "") {
      setMessage("Give the diagram a name first.");
      return;
    }
    renameDiagram(name);
    const current = useDiagramStore.getState().diagram;
    if (!saveDiagramToLibrary(current)) {
      setMessage("Could not save the diagram locally.");
      return;
    }
    setMessage(`Saved “${name}”.`);
    refreshEntries();
  }, [saveName, renameDiagram, refreshEntries]);

  const handleOpen = useCallback(
    (entry: SavedDiagramEntry) => {
      if (entry.id === diagram.id) {
        onClose();
        return;
      }
      if (!confirmReplace()) return;
      const saved = loadDiagramFromLibrary(entry.id);
      if (saved === null) {
        setMessage(`Could not open “${entry.name}” — the saved copy is missing or invalid.`);
        refreshEntries();
        return;
      }
      loadDiagram(saved);
      onClose();
    },
    [confirmReplace, diagram.id, loadDiagram, onClose, refreshEntries]
  );

  const handleDelete = useCallback(
    (entry: SavedDiagramEntry) => {
      if (
        !window.confirm(
          `Delete “${entry.name}” from your saved diagrams? This cannot be undone.`
        )
      ) {
        return;
      }
      deleteDiagramFromLibrary(entry.id);
      if (entry.id === diagram.id) {
        // The canvas still shows the deleted diagram — start fresh so
        // autosave does not write it back into the library.
        newDiagram();
      }
      refreshEntries();
    },
    [diagram.id, newDiagram, refreshEntries]
  );

  return (
    <div
      className="diagram-library-dialog__backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="diagram-library-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Diagrams"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="diagram-library-dialog__header">
          <h2 className="diagram-library-dialog__title">Diagrams</h2>
          <button
            type="button"
            className="studio-button"
            onClick={onClose}
            aria-label="Close diagrams"
          >
            ✕
          </button>
        </div>

        <section className="diagram-library-dialog__section">
          <h3 className="diagram-library-dialog__section-title">Templates</h3>
          <ul className="diagram-library-dialog__list">
            {TEMPLATES.map((template) => (
              <LibraryRow
                key={template.id}
                name={template.name}
                meta={template.description}
              >
                <button
                  type="button"
                  className="studio-button"
                  onClick={() => handleUseTemplate(template.id)}
                >
                  Use template
                </button>
              </LibraryRow>
            ))}
          </ul>
        </section>

        <section className="diagram-library-dialog__section">
          <h3 className="diagram-library-dialog__section-title">
            Save current diagram
          </h3>
          <div className="diagram-library-dialog__save-row">
            <input
              type="text"
              className="format-panel__text-input"
              value={saveName}
              onChange={(event) => setSaveName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") handleSave();
              }}
              aria-label="Diagram name"
              placeholder="Diagram name"
            />
            <button
              type="button"
              className="studio-button"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
          {message !== null ? (
            <p className="diagram-library-dialog__message" role="status">
              {message}
            </p>
          ) : null}
        </section>

        <section className="diagram-library-dialog__section">
          <h3 className="diagram-library-dialog__section-title">
            My diagrams
          </h3>
          {entries.length === 0 ? (
            <p className="diagram-library-dialog__empty">
              No saved diagrams yet. Name the current diagram above and
              save it to keep it here.
            </p>
          ) : (
            <ul className="diagram-library-dialog__list">
              {entries.map((entry) => (
                <LibraryRow
                  key={entry.id}
                  name={
                    <>
                      {entry.name}
                      {entry.id === diagram.id ? " (open)" : ""}
                    </>
                  }
                  meta={new Date(entry.updatedAt).toLocaleString()}
                >
                  <span className="diagram-library-dialog__row-actions">
                    <button
                      type="button"
                      className="studio-button"
                      onClick={() => handleOpen(entry)}
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      className="studio-button"
                      onClick={() => handleDelete(entry)}
                    >
                      Delete
                    </button>
                  </span>
                </LibraryRow>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
