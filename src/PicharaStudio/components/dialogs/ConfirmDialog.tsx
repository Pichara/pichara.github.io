/**
 * ConfirmDialog — small in-app confirmation modal.
 *
 * Replaces `window.confirm` for destructive actions (new diagram, import,
 * template/open/delete in the library): native confirms are auto-dismissed
 * by automated browsers — so the action silently does nothing, with no
 * confirmation ever shown — and they cannot be styled to the Matrix
 * theme. Same backdrop/dialog styles as the library dialog. Esc (capture
 * phase, so it wins over the editor's own Esc handler, which clears the
 * selection), backdrop click and ✕ cancel; the Cancel button starts
 * focused, so Enter never confirms by accident.
 *
 * Rendered in a portal to `document.body`: the dialog is opened from
 * inside the toolbar, whose `backdrop-filter` makes it the containing
 * block of `position: fixed` descendants (and its own stacking context),
 * so without the portal the backdrop would cover only the 48px toolbar
 * strip and the dialog would paint underneath the canvas — present in
 * the DOM but invisible and unclickable. Tab is trapped inside the
 * dialog (see `utils/focus-trap.ts`) so keyboard focus cannot wander to
 * the page behind it.
 */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FOCUSABLE_SELECTOR, trapTab } from "../../utils/focus-trap";

interface ConfirmDialogProps {
  /** Dialog title. */
  title: string;
  /** What the user is about to do. */
  message: string;
  /** Label of the button that runs the action. */
  confirmLabel: string;
  /** Label of the button that cancels (default "Cancel"). */
  cancelLabel?: string;
  /** True when the action destroys data (red confirm button). */
  danger?: boolean;
  /** Runs the action. */
  onConfirm: () => void;
  /** Closes without doing anything. */
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (dialog === null) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      const target = trapTab(
        focusable,
        document.activeElement as HTMLElement | null,
        event.shiftKey,
      );
      if (target !== null) {
        event.preventDefault();
        target.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onCancel]);

  return createPortal(
    <div
      className="diagram-library-dialog__backdrop"
      onClick={onCancel}
      role="presentation"
    >
      <div
        ref={dialogRef}
        className="diagram-library-dialog confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="diagram-library-dialog__header">
          <h2 className="diagram-library-dialog__title">{title}</h2>
          <button
            type="button"
            className="studio-button"
            onClick={onCancel}
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>
        <p className="diagram-library-dialog__message">{message}</p>
        <div className="diagram-library-dialog__actions">
          <button
            type="button"
            className="studio-button"
            onClick={onCancel}
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`studio-button${
              danger ? " studio-button--danger" : ""
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
