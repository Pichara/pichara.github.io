/**
 * Named-diagram library — save several diagrams by name in LocalStorage.
 *
 * The editor used to keep a single diagram under one LocalStorage key.
 * The library keeps an index of saved diagrams plus one key per diagram,
 * so the user can keep many named diagrams and switch between them.
 * Autosave writes the current diagram back into its own library entry;
 * a brand-new empty diagram is only added to the library once the user
 * gives it content or saves it by name (see `hooks/useDiagramPersistence`).
 *
 * Storage is injected (a `DiagramStorage`) so the logic stays testable
 * in Node; in the browser it defaults to `localStorage`. Every function
 * guards its storage access and reports success instead of throwing —
 * the editor must keep working when persistence is unavailable.
 *
 * Import paths use explicit `.ts` extensions so the Node test runner can
 * resolve them (see `services/import/diagram-import.ts`).
 */

import {
  DIAGRAM_STORAGE_KEY,
  serializeDiagram,
  validateDiagram,
} from "./persistence.ts";
import { STORAGE_KEY_PREFIX } from "../constants/index.ts";
import type { Diagram } from "../types/index.ts";

/** LocalStorage key holding the library index (array of entries). */
export const DIAGRAM_LIBRARY_INDEX_KEY = `${STORAGE_KEY_PREFIX}:library`;

/** LocalStorage key holding the id of the last opened diagram. */
export const LAST_OPENED_DIAGRAM_KEY = `${STORAGE_KEY_PREFIX}:last-opened`;

/** LocalStorage key holding one saved diagram, by diagram id. */
export function diagramStorageKey(id: string): string {
  return `${STORAGE_KEY_PREFIX}:diagram:${id}`;
}

/** One row in the library index — the list the UI shows. */
export interface SavedDiagramEntry {
  /** Matches the diagram's own `id`. */
  id: string;

  /** User-facing name (the diagram's `name` at save time). */
  name: string;

  /** ISO 8601 timestamp of the last save. */
  updatedAt: string;
}

/**
 * Minimal Storage surface the library needs. `localStorage` satisfies
 * it in the browser; tests pass an in-memory fake.
 */
export interface DiagramStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Resolve which storage to use: the injected one, else the browser's
 * `localStorage` when available, else `null` (persistence unavailable).
 */
function resolveStorage(
  storage?: DiagramStorage | null
): DiagramStorage | null {
  if (storage !== undefined) return storage;
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    return null;
  }
  return null;
}

/** Parse the library index, or `[]` when missing or malformed. */
function readIndex(storage: DiagramStorage): SavedDiagramEntry[] {
  let raw: string | null;
  try {
    raw = storage.getItem(DIAGRAM_LIBRARY_INDEX_KEY);
  } catch {
    return [];
  }
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const entries: SavedDiagramEntry[] = [];
  for (const candidate of parsed as Array<Partial<SavedDiagramEntry>>) {
    if (
      typeof candidate === "object" &&
      candidate !== null &&
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.updatedAt === "string"
    ) {
      entries.push({
        id: candidate.id,
        name: candidate.name,
        updatedAt: candidate.updatedAt,
      });
    }
  }
  return entries;
}

/** Write the library index. Returns false when storage is unavailable. */
function writeIndex(
  storage: DiagramStorage,
  entries: SavedDiagramEntry[]
): boolean {
  try {
    storage.setItem(DIAGRAM_LIBRARY_INDEX_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

/**
 * List saved diagrams, most recently updated first. Saves that land in
 * the same millisecond keep their save order (most recent first), so
 * the list is deterministic.
 * Returns `[]` when storage is unavailable or nothing is saved yet.
 */
export function listSavedDiagrams(
  storage?: DiagramStorage | null
): SavedDiagramEntry[] {
  const resolved = resolveStorage(storage);
  if (resolved === null) return [];
  return readIndex(resolved)
    .map((entry, index) => ({ entry, index }))
    .sort(
      (a, b) =>
        b.entry.updatedAt.localeCompare(a.entry.updatedAt) ||
        b.index - a.index
    )
    .map(({ entry }) => entry);
}

/**
 * Save a diagram under its own id and name (creates or updates its
 * library entry) and remember it as the last opened diagram.
 * Returns false when storage is unavailable.
 */
export function saveDiagramToLibrary(
  diagram: Diagram,
  storage?: DiagramStorage | null
): boolean {
  const resolved = resolveStorage(storage);
  if (resolved === null) return false;
  const now = new Date().toISOString();
  try {
    resolved.setItem(diagramStorageKey(diagram.id), serializeDiagram(diagram));
  } catch {
    return false;
  }
  const entries = readIndex(resolved).filter(
    (entry) => entry.id !== diagram.id
  );
  entries.push({ id: diagram.id, name: diagram.name, updatedAt: now });
  if (!writeIndex(resolved, entries)) return false;
  try {
    resolved.setItem(LAST_OPENED_DIAGRAM_KEY, diagram.id);
  } catch {
    // The diagram itself is saved; remembering it as last opened is
    // best-effort.
  }
  return true;
}

/**
 * Load a saved diagram by id, or `null` when it is missing or invalid.
 */
export function loadDiagramFromLibrary(
  id: string,
  storage?: DiagramStorage | null
): Diagram | null {
  const resolved = resolveStorage(storage);
  if (resolved === null) return null;
  let raw: string | null;
  try {
    raw = resolved.getItem(diagramStorageKey(id));
  } catch {
    return null;
  }
  if (raw === null) return null;
  try {
    return validateDiagram(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/**
 * Delete a saved diagram and its library entry. When the deleted diagram
 * was the last opened one, that marker is cleared too.
 * Returns false when storage is unavailable.
 */
export function deleteDiagramFromLibrary(
  id: string,
  storage?: DiagramStorage | null
): boolean {
  const resolved = resolveStorage(storage);
  if (resolved === null) return false;
  try {
    resolved.removeItem(diagramStorageKey(id));
    if (resolved.getItem(LAST_OPENED_DIAGRAM_KEY) === id) {
      resolved.removeItem(LAST_OPENED_DIAGRAM_KEY);
    }
  } catch {
    return false;
  }
  const entries = readIndex(resolved).filter((entry) => entry.id !== id);
  return writeIndex(resolved, entries);
}

/** Id of the last opened diagram, or `null` when unknown. */
export function getLastOpenedDiagramId(
  storage?: DiagramStorage | null
): string | null {
  const resolved = resolveStorage(storage);
  if (resolved === null) return null;
  try {
    return resolved.getItem(LAST_OPENED_DIAGRAM_KEY);
  } catch {
    return null;
  }
}

/**
 * One-time migration from the old single-diagram storage: when the
 * library index does not exist yet but a diagram was saved under the
 * legacy key, import it as the library's first entry and remove the
 * legacy key. Returns the migrated diagram, or `null` when there was
 * nothing to migrate.
 */
export function migrateLegacyDiagram(
  storage?: DiagramStorage | null
): Diagram | null {
  const resolved = resolveStorage(storage);
  if (resolved === null) return null;
  let legacyRaw: string | null;
  try {
    if (resolved.getItem(DIAGRAM_LIBRARY_INDEX_KEY) !== null) return null;
    legacyRaw = resolved.getItem(DIAGRAM_STORAGE_KEY);
  } catch {
    return null;
  }
  if (legacyRaw === null) return null;
  let diagram: Diagram | null;
  try {
    diagram = validateDiagram(JSON.parse(legacyRaw) as unknown);
  } catch {
    return null;
  }
  if (diagram === null) return null;
  if (!saveDiagramToLibrary(diagram, resolved)) return null;
  try {
    resolved.removeItem(DIAGRAM_STORAGE_KEY);
  } catch {
    // The diagram is already safe in the library; the leftover legacy
    // key is harmless and migration will not run again (index exists).
  }
  return diagram;
}
