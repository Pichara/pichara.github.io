/**
 * Autosave hook — the only place that wires the diagram store to persistence.
 *
 * On mount, migrates the old single-diagram storage into the named-diagram
 * library (once), then loads the last opened diagram (falling back to the
 * most recently updated one). Afterwards, subscribes to diagram changes
 * and saves them debounced into the diagram's own library entry, so
 * dragging nodes does not write on every pointer move.
 *
 * A brand-new empty diagram is not added to the library by autosave: it
 * only gets an entry once the user adds content to it or saves it by name
 * from the library dialog. Otherwise every "New" would litter the list
 * with "Untitled Diagram" entries.
 *
 * Returns whether the most recent save failed, so the UI can warn the user.
 * The editor keeps working normally when persistence is unavailable.
 */

import { useEffect, useRef, useState } from "react";
import { useDiagramStore } from "../stores/diagramStore";
import {
  getLastOpenedDiagramId,
  listSavedDiagrams,
  loadDiagramFromLibrary,
  migrateLegacyDiagram,
  saveDiagramToLibrary,
} from "../services/diagram-library";

const AUTOSAVE_DELAY_MS = 500;

export function useDiagramPersistence(): { saveFailed: boolean } {
  const [saveFailed, setSaveFailed] = useState(false);
  // The load on mount replaces the diagram, which fires the subscription
  // once — skip that save so loading does not rewrite the stored copy.
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    migrateLegacyDiagram();
    const lastOpenedId = getLastOpenedDiagramId();
    let saved =
      lastOpenedId === null
        ? null
        : loadDiagramFromLibrary(lastOpenedId);
    if (saved === null) {
      const entries = listSavedDiagrams();
      saved =
        entries.length === 0
          ? null
          : loadDiagramFromLibrary(entries[0].id);
    }
    if (saved !== null) {
      skipNextSaveRef.current = true;
      useDiagramStore.getState().loadDiagram(saved);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useDiagramStore.subscribe((state, prevState) => {
      if (state.diagram === prevState.diagram) return;
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        return;
      }
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(() => {
        const diagram = state.diagram;
        const alreadySaved = listSavedDiagrams().some(
          (entry) => entry.id === diagram.id
        );
        // Do not create a library entry for a brand-new empty diagram.
        if (
          !alreadySaved &&
          diagram.nodes.length === 0 &&
          diagram.edges.length === 0
        ) {
          return;
        }
        const ok = saveDiagramToLibrary(diagram);
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
