/**
 * Autosave hook — the only place that wires the diagram store to persistence.
 *
 * On mount, loads a previously saved diagram from LocalStorage (if any).
 * Afterwards, subscribes to diagram changes and saves them debounced, so
 * dragging nodes does not write on every pointer move.
 *
 * Returns whether the most recent save failed, so the UI can warn the user.
 * The editor keeps working normally when persistence is unavailable.
 */

import { useEffect, useState } from "react";
import { useDiagramStore } from "../stores/diagramStore";
import {
  loadDiagramFromLocalStorage,
  saveDiagramToLocalStorage,
} from "../services/persistence";

const AUTOSAVE_DELAY_MS = 500;

export function useDiagramPersistence(): { saveFailed: boolean } {
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    const saved = loadDiagramFromLocalStorage();
    if (saved !== null) {
      useDiagramStore.getState().loadDiagram(saved);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useDiagramStore.subscribe((state, prevState) => {
      if (state.diagram === prevState.diagram) return;
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        const ok = saveDiagramToLocalStorage(state.diagram);
        setSaveFailed(!ok);
      }, AUTOSAVE_DELAY_MS);
    });
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return { saveFailed };
}
