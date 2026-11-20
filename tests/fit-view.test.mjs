import test from "node:test";
import assert from "node:assert/strict";
import {
  diagramBounds,
  shouldFitView,
  viewportForBounds,
  FIT_VIEW_PADDING,
} from "../src/PicharaStudio/utils/fit-view.ts";

function node(id, x, y, extra = {}) {
  return {
    id,
    type: "shape",
    position: { x, y },
    data: { shape: "rectangle", label: id },
    ...extra,
  };
}

/** Map a flow point to screen pixels through a viewport. */
function toScreen(point, viewport) {
  return {
    x: point.x * viewport.zoom + viewport.x,
    y: point.y * viewport.zoom + viewport.y,
  };
}

test("shouldFitView skips the first run and empty diagrams", () => {
  assert.equal(shouldFitView(true, 5), false);
  assert.equal(shouldFitView(false, 0), false);
  assert.equal(shouldFitView(false, 1), true);
});

test("diagramBounds is null with no nodes", () => {
  assert.equal(diagramBounds([]), null);
});

test("diagramBounds uses the default 180x60 size for unmeasured nodes", () => {
  // A freshly added node measures 0x0 — it must still count, at its
  // rendered size, or zoom-to-fit leaves it out of the frame.
  assert.deepEqual(diagramBounds([node("a", 10, 20, { width: 0, height: 0 })]), {
    x: 10,
    y: 20,
    width: 180,
    height: 60,
  });
});

test("diagramBounds uses explicit sizes once a node is resized", () => {
  assert.deepEqual(
    diagramBounds([node("a", 0, 0, { width: 300, height: 120 })]),
    { x: 0, y: 0, width: 300, height: 120 }
  );
});

test("diagramBounds covers every node and skips grouped children", () => {
  const bounds = diagramBounds([
    node("a", 0, 0),
    node("b", 500, 400),
    // Child of the group at (0, 0): its relative position must not
    // extend the bounds — the group node already covers it.
    node("c", 10, 10, { parentId: "a" }),
  ]);
  assert.deepEqual(bounds, { x: 0, y: 0, width: 680, height: 460 });
});

test("viewportForBounds centers the diagram and fits the tighter axis", () => {
  const viewport = viewportForBounds(
    { x: 0, y: 0, width: 400, height: 200 },
    1200,
    800,
    0.1,
    4
  );
  assert.notEqual(viewport, null);
  // Usable pane after the 20% margin: 720x480; width is the tighter axis.
  assert.equal(viewport.zoom, 720 / 400);
  assert.deepEqual(toScreen({ x: 0, y: 0 }, viewport), { x: 240, y: 220 });
  assert.deepEqual(toScreen({ x: 400, y: 200 }, viewport), { x: 960, y: 580 });
});

test("viewportForBounds clamps the zoom to min/max", () => {
  // A tiny diagram would zoom past the max; a huge one below the min.
  assert.equal(
    viewportForBounds({ x: 0, y: 0, width: 10, height: 10 }, 1200, 800, 0.1, 4)
      .zoom,
    4
  );
  assert.equal(
    viewportForBounds(
      { x: 0, y: 0, width: 100000, height: 100000 },
      1200,
      800,
      0.1,
      4
    ).zoom,
    0.1
  );
});

test("viewportForBounds is null without a pane or bounds", () => {
  assert.equal(
    viewportForBounds({ x: 0, y: 0, width: 100, height: 100 }, 0, 800, 0.1, 4),
    null
  );
  assert.equal(
    viewportForBounds({ x: 0, y: 0, width: 0, height: 0 }, 1200, 800, 0.1, 4),
    null
  );
});

test("viewportForBounds frames a tall cascade of fresh nodes (regression)", () => {
  // Seven shapes added by clicking cascade diagonally from the center —
  // the case where zoom-to-fit used to stop at 248% with the bottom
  // shape cut off. Every corner of the bounds must land inside the
  // pane, with at least the padding margin.
  const nodes = Array.from({ length: 7 }, (_, i) =>
    node(`n${i}`, 500 + i * 40, 300 + i * 40)
  );
  const bounds = diagramBounds(nodes);
  assert.notEqual(bounds, null);
  const viewport = viewportForBounds(bounds, 1200, 800, 0.1, 4);
  assert.notEqual(viewport, null);
  const marginX = FIT_VIEW_PADDING * 1200;
  const marginY = FIT_VIEW_PADDING * 800;
  for (const corner of [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  ]) {
    const screen = toScreen(corner, viewport);
    assert.ok(screen.x >= marginX - 1, `left inside: ${screen.x}`);
    assert.ok(screen.x <= 1200 - marginX + 1, `right inside: ${screen.x}`);
    assert.ok(screen.y >= marginY - 1, `top inside: ${screen.y}`);
    assert.ok(screen.y <= 800 - marginY + 1, `bottom inside: ${screen.y}`);
  }
});
