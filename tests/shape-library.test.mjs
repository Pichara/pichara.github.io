import test from "node:test";
import assert from "node:assert/strict";
import {
  isPolygonShape,
  shapeHandles,
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

/** Distinct attach points in a handle list, keyed by x,y. */
function handlePoints(handles) {
  const points = new Map();
  for (const handle of handles) {
    const key = `${handle.x},${handle.y}`;
    if (!points.has(key)) points.set(key, []);
    points.get(key).push(handle);
  }
  return points;
}

test("shapeHandles gives every shape a target and a source handle", () => {
  for (const shape of ALL_SHAPES) {
    const handles = shapeHandles(shape);
    assert.ok(handles.length >= 2, `${shape} needs handles`);
    assert.ok(
      handles.some((h) => h.type === "target"),
      `${shape} needs a target handle`
    );
    assert.ok(
      handles.some((h) => h.type === "source"),
      `${shape} needs a source handle`
    );
    for (const handle of handles) {
      assert.ok(Number.isFinite(handle.x) && handle.x >= 0 && handle.x <= 100);
      assert.ok(Number.isFinite(handle.y) && handle.y >= 0 && handle.y <= 100);
      assert.ok(["top", "right", "bottom", "left"].includes(handle.side));
    }
  }
});

test("shapeHandles keeps the legacy top-target / bottom-source first", () => {
  // Edges saved before handles had ids attach to the first handle of
  // their type, so the first target must stay the top one and the first
  // source must stay the bottom one for every shape.
  for (const shape of ALL_SHAPES) {
    const handles = shapeHandles(shape);
    const firstTarget = handles.find((h) => h.type === "target");
    const firstSource = handles.find((h) => h.type === "source");
    assert.deepEqual(
      [firstTarget.side, firstTarget.x, firstTarget.y],
      ["top", 50, 0],
      `${shape} first target must be the top point`
    );
    assert.deepEqual(
      [firstSource.side, firstSource.x, firstSource.y],
      ["bottom", 50, 100],
      `${shape} first source must be the bottom point`
    );
  }
});

test("shapeHandles gives every ellipse/triangle point both types", () => {
  // Only the shapes this slice extends get a target and a source on
  // every point; the other shapes keep the legacy target-top /
  // source-bottom pair (see the legacy-pair test below).
  for (const shape of ["ellipse", "triangle"]) {
    const handles = shapeHandles(shape);
    const ids = handles.map((h) => h.id);
    assert.equal(new Set(ids).size, ids.length, `${shape} handle ids unique`);
    for (const [point, atPoint] of handlePoints(handles)) {
      assert.deepEqual(
        atPoint.map((h) => h.type).sort(),
        ["source", "target"],
        `${shape} point ${point} needs both handle types`
      );
    }
  }
});

test("shapeHandles gives the ellipse the 4 side midpoints", () => {
  const points = handlePoints(shapeHandles("ellipse"));
  assert.deepEqual(
    [...points.keys()].sort(),
    ["0,50", "100,50", "50,0", "50,100"].sort(),
    "ellipse needs N/E/S/W midpoints"
  );
  for (const [point, atPoint] of points) {
    assert.equal(atPoint.length, 2, `ellipse point ${point} has both types`);
  }
});

test("shapeHandles gives the triangle 3 vertices + 3 side midpoints", () => {
  const handles = shapeHandles("triangle");
  const points = handlePoints(handles);
  assert.deepEqual(
    [...points.keys()].sort(),
    ["0,100", "100,100", "25,50", "50,0", "50,100", "75,50"].sort(),
    "triangle needs vertices and side midpoints"
  );
  // Every triangle point must sit on the outline: vertices (50,0),
  // (100,100), (0,100) joined by three straight sides.
  const vertices = [
    [50, 0],
    [100, 100],
    [0, 100],
  ];
  const onSegment = (px, py, [ax, ay], [bx, by]) => {
    const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax);
    if (cross !== 0) return false;
    const dot = (px - ax) * (px - bx) + (py - ay) * (py - by);
    return dot <= 0;
  };
  for (const [key] of points) {
    const [x, y] = key.split(",").map(Number);
    const onOutline = [0, 1, 2].some((i) =>
      onSegment(x, y, vertices[i], vertices[(i + 1) % 3])
    );
    assert.ok(onOutline, `triangle point ${key} must sit on the outline`);
  }
});

test("shapeHandles leaves the other shapes with the legacy pair only", () => {
  for (const shape of ["rectangle", "diamond", "parallelogram", "hexagon", "pentagon"]) {
    assert.deepEqual(
      shapeHandles(shape).map((h) => [h.id, h.type, h.side, h.x, h.y]),
      [
        ["target-top", "target", "top", 50, 0],
        ["source-bottom", "source", "bottom", 50, 100],
      ],
      `${shape} handles must stay the legacy pair`
    );
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
