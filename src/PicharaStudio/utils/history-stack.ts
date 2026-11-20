/**
 * History stack — pure undo/redo transitions over snapshots.
 *
 * Kept free of React and store dependencies so the transition rules can be
 * unit-tested in isolation (see `tests/history-stack.test.mjs`). The history
 * store (`stores/historyStore.ts`) is a thin Zustand wrapper around these
 * functions. Snapshots are treated as immutable: callers must never mutate
 * a snapshot after pushing it.
 */

export interface HistoryStack<Snapshot> {
  /** Snapshots that `undo` can restore, oldest first. */
  past: Snapshot[];
  /** Snapshots that `redo` can restore, next redo first. */
  future: Snapshot[];
}

/** Empty stack — no undo or redo available. */
export function createHistoryStack<Snapshot>(): HistoryStack<Snapshot> {
  return { past: [], future: [] };
}

/**
 * Record a snapshot as the state to return to on the next undo.
 * Clears the redo stack. Keeps at most `maxSize` past entries, dropping
 * the oldest. Pushing the exact snapshot already on top of the stack is a
 * no-op, so a discrete action recorded twice still undoes in one step.
 */
export function pushHistoryEntry<Snapshot>(
  stack: HistoryStack<Snapshot>,
  snapshot: Snapshot,
  maxSize: number
): HistoryStack<Snapshot> {
  if (stack.past.length > 0 && stack.past[stack.past.length - 1] === snapshot) {
    return stack;
  }
  const past = [...stack.past, snapshot];
  const trimmed =
    past.length > maxSize ? past.slice(past.length - maxSize) : past;
  return { past: trimmed, future: [] };
}

/**
 * Restore only the content (nodes/edges) of a snapshot over the current
 * state, keeping the current viewport (and name/metadata/id): moving the
 * camera is not an undoable step, so undo/redo must never jump the zoom.
 * Snapshots still carry the viewport they were taken with — it is simply
 * never restored.
 */
export function restoreContentSnapshot<
  Snapshot extends { nodes: unknown; edges: unknown },
>(current: Snapshot, snapshot: Snapshot): Snapshot {
  return { ...current, nodes: snapshot.nodes, edges: snapshot.edges };
}

/**
 * Step back one snapshot. Returns the snapshot to restore plus the updated
 * stack, or `null` when there is nothing to undo. The current state is
 * pushed onto the redo stack so `redo` can return to it.
 */
export function undoHistoryEntry<Snapshot>(
  stack: HistoryStack<Snapshot>,
  current: Snapshot
): { stack: HistoryStack<Snapshot>; snapshot: Snapshot } | null {
  if (stack.past.length === 0) return null;
  const snapshot = stack.past[stack.past.length - 1];
  return {
    stack: {
      past: stack.past.slice(0, -1),
      future: [current, ...stack.future],
    },
    snapshot,
  };
}

/**
 * Step forward one snapshot. Returns the snapshot to restore plus the
 * updated stack, or `null` when there is nothing to redo. The current state
 * is pushed back onto the undo stack.
 */
export function redoHistoryEntry<Snapshot>(
  stack: HistoryStack<Snapshot>,
  current: Snapshot
): { stack: HistoryStack<Snapshot>; snapshot: Snapshot } | null {
  if (stack.future.length === 0) return null;
  const snapshot = stack.future[0];
  return {
    stack: {
      past: [...stack.past, current],
      future: stack.future.slice(1),
    },
    snapshot,
  };
}
