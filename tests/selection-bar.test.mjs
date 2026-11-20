import test from "node:test";
import assert from "node:assert/strict";
import {
  selectionBarPlacement,
  selectionBounds,
} from "../src/PicharaStudio/utils/selection-bar.ts";

function node(id, x, y, extra = {}) {
  return {
    id,
    type: "shape-rectangle",
    position: { x, y },
    data: { label: id, shape: "rectangle" },
    ...extra,
  };
}

test("selectionBounds returns null when nothing is selected", () => {
  assert.equal(selectionBounds([]), null);
  assert.equal(selectionBounds([node("a", 0, 0)]), null);
});

test("selectionBounds covers one selected node at its default size", () => {
  assert.deepEqual(selectionBounds([node("a", 100, 50, { selected: true })]), {
    x: 100,
    y: 50,
    width: 180,
    height: 60,
  });
});

test("selectionBounds uses the measured size when present", () => {
  assert.deepEqual(
    selectionBounds([
      node("a", 0, 0, { selected: true, width: 240, height: 120 }),
    ]),
    { x: 0, y: 0, width: 240, height: 120 }
  );
});

test("selectionBounds unions several selected nodes", () => {
  assert.deepEqual(
    selectionBounds([
      node("a", 0, 0, { selected: true }),
      node("b", 300, 200, { selected: true }),
      node("c", 50, 50),
    ]),
    { x: 0, y: 0, width: 480, height: 260 }
  );
});

test("selectionBounds ignores grouped children when a top-level node is selected", () => {
  assert.deepEqual(
    selectionBounds([
      node("group", 0, 0, { selected: true, width: 400, height: 200 }),
      node("child", 500, 500, { selected: true, parentId: "group" }),
    ]),
    { x: 0, y: 0, width: 400, height: 200 }
  );
});

test("selectionBounds falls back to grouped children when only they are selected", () => {
  assert.deepEqual(
    selectionBounds([
      node("child", 500, 500, { selected: true, parentId: "group" }),
    ]),
    { x: 500, y: 500, width: 180, height: 60 }
  );
});

test("selectionBarPlacement puts the bar above the selection, centered", () => {
  assert.deepEqual(
    selectionBarPlacement(
      { x: 100, y: 200, width: 180, height: 60 },
      { x: 0, y: 0, zoom: 1 },
      { width: 1200, height: 800 },
      { width: 320, height: 40 }
    ),
    { left: 30, top: 148, below: false }
  );
});

test("selectionBarPlacement respects zoom and pan", () => {
  assert.deepEqual(
    selectionBarPlacement(
      { x: 100, y: 200, width: 180, height: 60 },
      { x: 50, y: 25, zoom: 2 },
      { width: 1200, height: 800 },
      { width: 320, height: 40 }
    ),
    { left: 270, top: 373, below: false }
  );
});

test("selectionBarPlacement goes below the selection when there is no room above", () => {
  assert.deepEqual(
    selectionBarPlacement(
      { x: 100, y: 10, width: 180, height: 60 },
      { x: 0, y: 0, zoom: 1 },
      { width: 1200, height: 800 },
      { width: 320, height: 40 }
    ),
    { left: 30, top: 82, below: true }
  );
});

test("selectionBarPlacement clamps the bar inside the canvas", () => {
  const placement = selectionBarPlacement(
    { x: 0, y: 300, width: 180, height: 60 },
    { x: 0, y: 0, zoom: 1 },
    { width: 400, height: 800 },
    { width: 320, height: 40 }
  );
  assert.equal(placement.left, 8);
  assert.equal(placement.below, false);

  const right = selectionBarPlacement(
    { x: 1000, y: 300, width: 180, height: 60 },
    { x: 0, y: 0, zoom: 1 },
    { width: 1200, height: 800 },
    { width: 320, height: 40 }
  );
  assert.equal(right.left, 1200 - 320 - 8);
});
