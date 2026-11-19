/**
 * History Store — undo/redo stack operating on diagram snapshots.
 *
 * Each entry is a full `Diagram` snapshot taken *before* a content change,
 * so `undo` restores exactly the state the editor had before that change.
 * Snapshots are never mutated after being pushed (the diagram store only
 * ever produces new objects), so storing references is safe.
 *
 * Recording rules (enforced by the diagram store, not here):
 * - Discrete content changes push the pre-change diagram: add node,
 *   connect edge, delete node/edge, drag start (one entry per drag).
 * - Selection and viewport changes are NOT recorded.
 * - `undo`/`redo` restore a snapshot directly through the diagram store
 *   without pushing, so they never pollute the stacks.
 * - Loading a diagram or starting a new one clears both stacks.
 */

import { create } from "zustand";
import type { Diagram } from "../types";
import { MAX_HISTORY_SIZE } from "../constants";
import {
  createHistoryStack,
  pushHistoryEntry,
  redoHistoryEntry,
  undoHistoryEntry,
  type HistoryStack,
} from "../utils/history-stack";
import { useDiagramStore } from "./diagramStore";

interface HistoryStore extends HistoryStack<Diagram> {
  /** Record the pre-change diagram so the next undo returns to it. */
  pushHistory: (snapshot: Diagram) => void;

  /** Restore the most recent snapshot, if any. No-op when empty. */
  undo: () => void;

  /** Re-apply the most recently undone snapshot, if any. */
  redo: () => void;

  /** Empty both stacks (e.g. when another diagram is loaded). */
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStore>()((set, get) => ({
  ...createHistoryStack<Diagram>(),

  pushHistory: (snapshot) =>
    set((state) => pushHistoryEntry(state, snapshot, MAX_HISTORY_SIZE)),

  undo: () => {
    const result = undoHistoryEntry(get(), useDiagramStore.getState().diagram);
    if (result === null) return;
    useDiagramStore.setState({ diagram: result.snapshot });
    set(result.stack);
  },

  redo: () => {
    const result = redoHistoryEntry(get(), useDiagramStore.getState().diagram);
    if (result === null) return;
    useDiagramStore.setState({ diagram: result.snapshot });
    set(result.stack);
  },

  clearHistory: () => set(createHistoryStack<Diagram>()),
}));
