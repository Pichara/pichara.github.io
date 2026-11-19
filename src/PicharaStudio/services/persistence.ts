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
import { DIAGRAM_SCHEMA_VERSION, STORAGE_KEY_PREFIX } from "../constants";

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

/** Save the current diagram to LocalStorage. Returns false when unavailable. */
export function saveDiagramToLocalStorage(diagram: Diagram): boolean {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(DIAGRAM_STORAGE_KEY, serializeDiagram(diagram));
    return true;
  } catch {
    return false;
  }
}

/** Load the saved diagram from LocalStorage, or `null` when none/invalid. */
export function loadDiagramFromLocalStorage(): Diagram | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(DIAGRAM_STORAGE_KEY);
    if (raw === null) return null;
    return validateDiagram(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** Remove the saved diagram from LocalStorage. */
export function clearSavedDiagram(): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(DIAGRAM_STORAGE_KEY);
  } catch {
    // Persistence is best-effort; the editor works without it.
  }
}
