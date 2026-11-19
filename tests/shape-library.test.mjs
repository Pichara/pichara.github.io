import test from "node:test";
import assert from "node:assert/strict";
import {
  isPolygonShape,
  shapePolygonPoints,
} from "../src/PicharaStudio/utils/shape-geometry.ts";
import {
  computeDropPosition,
  computeSpawnPosition,
} from "../src/PicharaStudio/utils/geometry.ts";
import { SHAPE_LIBRARY } from "../src/PicharaStudio/constants/shapes.ts";

const ALL_SHAPES = [
  "rectangle",
  "diamond",
  "ellipse",
  "triangle",
  "parallelogram",
  "hexagon",
  "pentagon",
];

/** Parse "x,y x,y ..." into [x, y] pairs. */
function parsePoints(points) {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number));
}

test("shapePolygonPoints returns null for CSS-rendered shapes", () => {
  assert.equal(shapePolygonPoints("rectangle"), null);
  assert.equal(shapePolygonPoints("ellipse"), null);
});

test("shapePolygonPoints returns a valid polygon for every polygon shape", () => {
  for (const shape of ["diamond", "triangle", "parallelogram", "hexagon", "pentagon"]) {
    const points = shapePolygonPoints(shape);
    assert.ok(typeof points === "string", `${shape} should have points`);
    const parsed = parsePoints(points);
    assert.ok(parsed.length >= 3, `${shape} needs at least 3 points`);
    for (const [x, y] of parsed) {
      assert.ok(Number.isFinite(x) && x >= 0 && x <= 100, `${shape} x in range`);
      assert.ok(Number.isFinite(y) && y >= 0 && y <= 100, `${shape} y in range`);
    }
  }
});

test("isPolygonShape matches shapePolygonPoints", () => {
  for (const shape of ALL_SHAPES) {
    assert.equal(isPolygonShape(shape), shapePolygonPoints(shape) !== null);
  }
});

test("SHAPE_LIBRARY covers every shape exactly once", () => {
  const seen = SHAPE_LIBRARY.flatMap((category) => category.shapes);
  assert.ok(SHAPE_LIBRARY.length > 0, "needs at least one category");
  for (const category of SHAPE_LIBRARY) {
    assert.ok(category.title.length > 0, "category needs a title");
    assert.ok(category.shapes.length > 0, "category needs shapes");
    for (const entry of category.shapes) {
      assert.ok(entry.label.length > 0, "shape needs a label");
    }
  }
  const kinds = seen.map((entry) => entry.kind).sort();
  assert.deepEqual(kinds, [...ALL_SHAPES].sort());
});

test("computeSpawnPosition centers the node in the visible viewport", () => {
  const position = computeSpawnPosition(
    { x: 0, y: 0, zoom: 1 },
    0,
    1000,
    600
  );
  // Node is 180x60, so its top-left sits half a node left/up of center.
  assert.deepEqual(position, { x: 410, y: 270 });
});

test("computeSpawnPosition shifts by spawnOffset and accounts for zoom", () => {
  const position = computeSpawnPosition(
    { x: 100, y: 50, zoom: 2 },
    40,
    1000,
    600
  );
  // center: ((500 - 100) / 2 - 90, (300 - 50) / 2 - 30) + 40 offset
  assert.deepEqual(position, { x: 150, y: 135 });
});

test("computeDropPosition centers the node under the cursor", () => {
  const position = computeDropPosition(
    190,
    110,
    { left: 100, top: 50 },
    { x: 0, y: 0, zoom: 1 }
  );
  assert.deepEqual(position, { x: 0, y: 30 });
});

test("computeDropPosition accounts for viewport offset and zoom", () => {
  const position = computeDropPosition(
    300,
    250,
    { left: 100, top: 50 },
    { x: 20, y: 10, zoom: 2 }
  );
  assert.deepEqual(position, { x: 0, y: 65 });
});
