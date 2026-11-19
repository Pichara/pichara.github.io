/**
 * Node label editing — pure helpers for the double-click-to-edit flow.
 *
 * The editor itself lives in `nodes/base/BaseShapeNode.tsx`; this module
 * holds the commit decision so it can be unit-tested without rendering.
 */

/**
 * Decide what a label edit commits to.
 *
 * Returns the trimmed draft when it is non-empty and different from the
 * current label. Returns `null` when nothing should change — the draft
 * is empty (an empty label would leave a blank, unidentifiable node) or
 * identical to the current label — so the store can skip the history
 * entry and the state update entirely.
 */
export function commitLabelEdit(
  currentLabel: string,
  draft: string
): string | null {
  const next = draft.trim();
  if (next === "" || next === currentLabel) return null;
  return next;
}
