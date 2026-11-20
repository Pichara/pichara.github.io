/**
 * ShortcutsDialog — keyboard shortcuts and mouse tips.
 *
 * Opened from the toolbar "?" button or by pressing "?" anywhere in the
 * editor. The rows come from `constants/shortcuts.ts` so the dialog can
 * never drift from what the editor actually handles. Closes with Esc
 * (capture phase, so it wins over the editor's own Esc handler, which
 * clears the selection), by clicking the backdrop, or with the ✕ button.
 */

import { useEffect } from "react";
import { MOUSE_TIPS, SHORTCUTS } from "../../constants/shortcuts";

interface ShortcutsDialogProps {
  /** Close the dialog. */
  onClose: () => void;
}

export default function ShortcutsDialog({ onClose }: ShortcutsDialogProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        // Capture phase: this runs before the editor's Esc handler, so
        // closing the dialog does not also clear the selection.
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  return (
    <div
      className="diagram-library-dialog__backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="diagram-library-dialog shortcuts-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="diagram-library-dialog__header">
          <h2 className="diagram-library-dialog__title">Shortcuts</h2>
          <button
            type="button"
            className="studio-button"
            onClick={onClose}
            aria-label="Close shortcuts"
          >
            ✕
          </button>
        </div>

        <section className="diagram-library-dialog__section">
          <h3 className="diagram-library-dialog__section-title">Keyboard</h3>
          <ul className="shortcuts-dialog__list">
            {SHORTCUTS.map((entry) => (
              <li key={entry.keys} className="shortcuts-dialog__row">
                <kbd className="shortcuts-dialog__keys">{entry.keys}</kbd>
                <span className="shortcuts-dialog__action">
                  {entry.action}
                </span>
              </li>
            ))}
          </ul>
          <p className="diagram-library-dialog__message">
            Ctrl on Windows/Linux, Cmd on Mac.
          </p>
        </section>

        <section className="diagram-library-dialog__section">
          <h3 className="diagram-library-dialog__section-title">Mouse</h3>
          <ul className="shortcuts-dialog__list">
            {MOUSE_TIPS.map((entry) => (
              <li key={entry.keys} className="shortcuts-dialog__row">
                <span className="shortcuts-dialog__keys">
                  {entry.keys}
                </span>
                <span className="shortcuts-dialog__action">
                  {entry.action}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
