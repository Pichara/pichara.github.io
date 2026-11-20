import test from "node:test";
import assert from "node:assert/strict";
import {
  deleteDiagramFromLibrary,
  getLastOpenedDiagramId,
  listSavedDiagrams,
  loadDiagramFromLibrary,
  migrateLegacyDiagram,
  saveDiagramToLibrary,
} from "../src/PicharaStudio/services/diagram-library.ts";
import {
  DIAGRAM_STORAGE_KEY,
  serializeDiagram,
} from "../src/PicharaStudio/services/persistence.ts";

/** In-memory stand-in for localStorage. */
function fakeStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    has: (key) => store.has(key),
  };
}

function fixtureDiagram(id, name) {
  return {
    id,
    name,
    description: "",
    diagramType: "general",
    nodes: [
      {
        id: "n1",
        type: "shape-rectangle",
        position: { x: 0, y: 0 },
        data: { label: "A", shape: "rectangle" },
      },
    ],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {
      createdAt: "2026-11-19T00:00:00.000Z",
      updatedAt: "2026-11-19T00:00:00.000Z",
      version: "1.0.0",
    },
  };
}

test("saving and loading a named diagram round-trips", () => {
  const storage = fakeStorage();
  const diagram = fixtureDiagram("d1", "My flowchart");
  assert.equal(saveDiagramToLibrary(diagram, storage), true);
  const entries = listSavedDiagrams(storage);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, "d1");
  assert.equal(entries[0].name, "My flowchart");
  const loaded = loadDiagramFromLibrary("d1", storage);
  assert.notEqual(loaded, null);
  assert.equal(loaded.id, "d1");
  assert.equal(loaded.name, "My flowchart");
  assert.equal(loaded.nodes.length, 1);
});

test("saving the same diagram again updates its entry instead of duplicating", () => {
  const storage = fakeStorage();
  saveDiagramToLibrary(fixtureDiagram("d1", "First name"), storage);
  saveDiagramToLibrary(fixtureDiagram("d1", "Renamed"), storage);
  const entries = listSavedDiagrams(storage);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, "Renamed");
});

test("several diagrams list most recently updated first", () => {
  const storage = fakeStorage();
  saveDiagramToLibrary(fixtureDiagram("d1", "Older"), storage);
  saveDiagramToLibrary(fixtureDiagram("d2", "Newer"), storage);
  const entries = listSavedDiagrams(storage);
  assert.deepEqual(
    entries.map((entry) => entry.id),
    ["d2", "d1"]
  );
});

test("deleting a diagram removes it from the list and storage", () => {
  const storage = fakeStorage();
  saveDiagramToLibrary(fixtureDiagram("d1", "Keep me"), storage);
  saveDiagramToLibrary(fixtureDiagram("d2", "Delete me"), storage);
  assert.equal(deleteDiagramFromLibrary("d2", storage), true);
  assert.deepEqual(
    listSavedDiagrams(storage).map((entry) => entry.id),
    ["d1"]
  );
  assert.equal(loadDiagramFromLibrary("d2", storage), null);
});

test("saving remembers the diagram as last opened", () => {
  const storage = fakeStorage();
  assert.equal(getLastOpenedDiagramId(storage), null);
  saveDiagramToLibrary(fixtureDiagram("d1", "First"), storage);
  assert.equal(getLastOpenedDiagramId(storage), "d1");
  saveDiagramToLibrary(fixtureDiagram("d2", "Second"), storage);
  assert.equal(getLastOpenedDiagramId(storage), "d2");
  deleteDiagramFromLibrary("d2", storage);
  assert.equal(getLastOpenedDiagramId(storage), null);
});

test("legacy single-diagram storage migrates once into the library", () => {
  const storage = fakeStorage();
  const diagram = fixtureDiagram("legacy-1", "Old diagram");
  storage.setItem(DIAGRAM_STORAGE_KEY, serializeDiagram(diagram));
  const migrated = migrateLegacyDiagram(storage);
  assert.notEqual(migrated, null);
  assert.equal(migrated.id, "legacy-1");
  assert.equal(listSavedDiagrams(storage).length, 1);
  assert.equal(storage.has(DIAGRAM_STORAGE_KEY), false);
  // Second call is a no-op: the index exists now.
  assert.equal(migrateLegacyDiagram(storage), null);
  assert.equal(listSavedDiagrams(storage).length, 1);
});

test("migration does nothing when there is no legacy diagram", () => {
  const storage = fakeStorage();
  assert.equal(migrateLegacyDiagram(storage), null);
  assert.deepEqual(listSavedDiagrams(storage), []);
});

test("library functions degrade gracefully without storage", () => {
  // No storage injected and no localStorage in Node.
  assert.deepEqual(listSavedDiagrams(), []);
  assert.equal(loadDiagramFromLibrary("d1"), null);
  assert.equal(getLastOpenedDiagramId(), null);
  assert.equal(saveDiagramToLibrary(fixtureDiagram("d1", "X")), false);
  assert.equal(deleteDiagramFromLibrary("d1"), false);
  assert.equal(migrateLegacyDiagram(), null);
});

test("a malformed library index lists as empty instead of throwing", () => {
  const storage = fakeStorage();
  storage.setItem("pichara-studio:library", "{not json");
  assert.deepEqual(listSavedDiagrams(storage), []);
});
