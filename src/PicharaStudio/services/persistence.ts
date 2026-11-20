/**
 * LocalStorage persistence service for Pichara Diagram Studio.
 *
 * Stateless logic only — no React, no Zustand. Components and hooks call
 * these functions; stores never touch persistence directly.
 *
 * The editor must keep working when persistence is unavailable (private
 * mode, storage full, disabled cookies): every function guards its
 * storage access with try/catch and reports success instead of throwing.
 */

import type { Diagram, DiagramEdge, DiagramNode } from "../types";
import { DIAGRAM_SCHEMA_VERSION, STORAGE_KEY_PREFIX } from "../constants/index.ts";

/** LocalStorage key holding the current diagram. */
export const DIAGRAM_STORAGE_KEY = `${STORAGE_KEY_PREFIX}:diagram`;

/**
 * Serialize a diagram for storage/export.
 *
 * Strips transient React Flow fields (`selected`, `dragging`) and refreshes
 * `metadata.updatedAt`. The result is a JSON string matching the `Diagram`
 * type, so it can be loaded back with `validateDiagram`.
 */
export function serializeDiagram(diagram: Diagram): string {
  const nodes: DiagramNode[] = diagram.nodes.map((node) => {
    const clean: DiagramNode = { ...node };
    delete clean.selected;
    delete clean.dragging;
    return clean;
  });
  const edges: DiagramEdge[] = diagram.edges.map((edge) => {
    const clean: DiagramEdge = { ...edge };
    delete clean.selected;
    return clean;
  });
  const storable: Diagram = {
    ...diagram,
    nodes,
    edges,
    metadata: {
      ...diagram.metadata,
      updatedAt: new Date().toISOString(),
      version: DIAGRAM_SCHEMA_VERSION,
    },
  };
  return JSON.stringify(storable);
}

/**
 * Validate unknown parsed data as a `Diagram`.
 *
 * Returns the diagram when the minimal shape checks out, otherwise `null`.
 * Never trust external JSON blindly — this is the single gate for data
 * coming back from LocalStorage.
 */
export function validateDiagram(data: unknown): Diagram | null {
  if (typeof data !== "object" || data === null) return null;
  const candidate = data as Partial<Diagram>;
  if (typeof candidate.id !== "string") return null;
  if (typeof candidate.name !== "string") return null;
  if (!Array.isArray(candidate.nodes)) return null;
  if (!Array.isArray(candidate.edges)) return null;
  if (typeof candidate.viewport !== "object" || candidate.viewport === null) {
    return null;
  }
  const viewport = candidate.viewport as {
    x?: unknown;
    y?: unknown;
    zoom?: unknown;
  };
  if (
    typeof viewport.x !== "number" ||
    typeof viewport.y !== "number" ||
    typeof viewport.zoom !== "number"
  ) {
    return null;
  }
  if (typeof candidate.metadata !== "object" || candidate.metadata === null) {
    return null;
  }
  const metadata = candidate.metadata as { version?: unknown };
  if (typeof metadata.version !== "string") return null;
  return data as Diagram;
}

/**
 * Parse JSON text as a `Diagram`, distinguishing the two failure modes
 * so callers can report the right error: malformed JSON vs. valid JSON
 * with the wrong shape. Single gate for every JSON → Diagram load
 * (LocalStorage, library, import) — the parse lives in one place.
 */
export type ParseDiagramTextResult =
  | { ok: true; diagram: Diagram }
  | { ok: false; reason: "invalid-json" | "invalid-diagram" };

export function parseDiagramText(text: string): ParseDiagramTextResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, reason: "invalid-json" };
  }
  const diagram = validateDiagram(parsed);
  if (diagram === null) {
    return { ok: false, reason: "invalid-diagram" };
  }
  return { ok: true, diagram };
}

/**
 * The browser's LocalStorage when available, else `null` (private mode,
 * disabled cookies, or a non-browser runtime such as Node tests).
 */
function localStorageOrNull(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

/** Save the current diagram to LocalStorage. Returns false when unavailable. */
export function saveDiagramToLocalStorage(diagram: Diagram): boolean {
  const storage = localStorageOrNull();
  if (storage === null) return false;
  try {
    storage.setItem(DIAGRAM_STORAGE_KEY, serializeDiagram(diagram));
    return true;
  } catch {
    return false;
  }
}

/** Load the saved diagram from LocalStorage, or `null` when none/invalid. */
export function loadDiagramFromLocalStorage(): Diagram | null {
  const storage = localStorageOrNull();
  if (storage === null) return null;
  let raw: string | null;
  try {
    raw = storage.getItem(DIAGRAM_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  const result = parseDiagramText(raw);
  return result.ok ? result.diagram : null;
}

/** Remove the saved diagram from LocalStorage. */
export function clearSavedDiagram(): void {
  const storage = localStorageOrNull();
  if (storage === null) return;
  try {
    storage.removeItem(DIAGRAM_STORAGE_KEY);
  } catch {
    // Persistence is best-effort; the editor works without it.
  }
}
