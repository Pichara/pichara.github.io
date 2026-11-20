import test from "node:test";
import assert from "node:assert/strict";
import { parseDiagramText } from "../src/PicharaStudio/services/persistence.ts";

/** A minimal valid diagram, serialized to JSON. */
function diagramJson(overrides = {}) {
  return JSON.stringify({
    id: "d1",
    name: "Test",
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: {
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      version: "1.0.0",
    },
    ...overrides,
  });
}

test("parseDiagramText accepts a valid diagram", () => {
  const result = parseDiagramText(diagramJson());
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.diagram.name, "Test");
});

test("parseDiagramText reports malformed JSON", () => {
  assert.deepEqual(parseDiagramText("{not json"), {
    ok: false,
    reason: "invalid-json",
  });
});

test("parseDiagramText reports valid JSON with the wrong shape", () => {
  assert.deepEqual(parseDiagramText(JSON.stringify({ hello: "world" })), {
    ok: false,
    reason: "invalid-diagram",
  });
});

test("parseDiagramText rejects JSON null as the wrong shape, not bad JSON", () => {
  assert.deepEqual(parseDiagramText("null"), {
    ok: false,
    reason: "invalid-diagram",
  });
});
