/**
 * Focus trap — pure Tab-cycling rules for modal dialogs.
 *
 * Kept free of React and DOM dependencies so the wrap-around rules can
 * be unit-tested in isolation (see `tests/focus-trap.test.mjs`).
 * Callers query the dialog's focusable elements and pass them, in DOM
 * order, with the currently focused element (or null when focus is
 * outside the dialog).
 */

/** Selector matching the elements Tab can reach inside a dialog. */
export const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Which element Tab should move focus to next inside a modal, or null
 * when the browser's default Tab movement is fine. Wraps around at the
 * edges: Tab on the last element goes to the first, Shift+Tab on the
 * first goes to the last. When focus is outside the dialog, Tab pulls
 * it to the first element (Shift+Tab to the last).
 */
export function trapTab<T>(
  items: readonly T[],
  active: T | null,
  shiftKey: boolean,
): T | null {
  if (items.length === 0) return null;
  const index = active === null ? -1 : items.indexOf(active);
  if (index === -1) {
    return shiftKey ? items[items.length - 1] : items[0];
  }
  if (!shiftKey && index === items.length - 1) return items[0];
  if (shiftKey && index === 0) return items[items.length - 1];
  return null;
}
