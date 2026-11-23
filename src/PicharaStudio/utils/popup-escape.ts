/**
 * popup-escape — who owns Escape when the Format popup is open.
 *
 * Both FormatPopup and ColorPicker register capture-phase keydown
 * listeners on `document`. FormatPopup's registers when the popup
 * mounts; ColorPicker's only when its popover opens, i.e. later.
 * Same target + same phase means listeners fire in registration
 * order, so the popup's handler runs first: if it closed on Escape
 * unconditionally it would call `onClose()` + `stopPropagation()`
 * and the picker's handler would never run — Esc would close the
 * whole format popup instead of just the picker.
 *
 * The popup therefore asks this module first: while a picker popover
 * is open, Escape belongs to the picker and the popup must return
 * without closing or stopping propagation, letting the picker's own
 * handler close just the picker.
 *
 * Kept as a pure function over a minimal document shape (instead of
 * an inline `document.querySelector` in the component) so the rule
 * is unit-testable without a DOM or a React harness — the repo has
 * neither (see `tests/format-popup-escape.test.mjs`).
 */

/** Selector for the ColorPicker popover portal (same selector the
 * FormatPopup mousedown handler already uses to ignore clicks on
 * the picker popover). */
export const COLOR_PICKER_POPOVER_SELECTOR = ".color-picker__popover";

/** Minimal document shape this module needs: just `querySelector`. */
export interface DocumentLike {
  querySelector(selector: string): unknown;
}

/**
 * True while a color-picker popover is currently open in the
 * document — i.e. while Escape must close only the picker, not the
 * format popup that contains it.
 */
export function isColorPickerPopoverOpen(doc: DocumentLike): boolean {
  return doc.querySelector(COLOR_PICKER_POPOVER_SELECTOR) !== null;
}
