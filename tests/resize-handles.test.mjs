import test from "node:test";
import assert from "node:assert/strict";
import {
  resizeHandleAnchor,
  shapePolygonPoints,
} from "../src/PicharaStudio/utils/shape-geometry.ts";

const ALL_SHAPES = [
  "rectangle",
  "diamond",
  "ellipse",
  "triangle",
  "parallelogram",
  "hexagon",
  "pentagon",
];

const CORNERS = {
  "top-left": [0, 0],
  "top-right": [100, 0],
  "bottom-left": [0, 100],
  "bottom-right": [100, 100],
};

/**
 * Distance from a point to a polygon outline (min over its edges),
 * in the 0–100 node space. Zero means the point sits on the outline.
 */
function distanceToPolygonOutline(vertices, [px, py]) {
  let best = Infinity;
  for (let i = 0; i < vertices.length; i += 1) {
    const [ax, ay] = vertices[i];
    const [bx, by] = vertices[(i + 1) % vertices.length];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(
      best,
      Math.hypot(px - (ax + dx * t), py - (ay + dy * t))
    );
  }
  return best;
}

function parsePoints(points) {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number));
}

/** True when a point lies on the shape's outline (within tolerance). */
function isOnOutline(shape, [x, y]) {
  if (shape === "rectangle") {
    // The outline runs along the box edges.
    return x === 0 || x === 100 || y === 0 || y === 100;
  }
  if (shape === "ellipse") {
    // ((x-50)/50)^2 + ((y-50)/50)^2 == 1 on the ellipse.
    const value = ((x - 50) / 50) ** 2 + ((y - 50) / 50) ** 2;
    return Math.abs(value - 1) < 1e-9;
  }
  const vertices = parsePoints(shapePolygonPoints(shape));
  return distanceToPolygonOutline(vertices, [x, y]) < 1e-9;
}

test("resizeHandleAnchor stays inside the node box for every shape", () => {
  for (const shape of ALL_SHAPES) {
    for (const corner of Object.keys(CORNERS)) {
      const anchor = resizeHandleAnchor(shape, corner);
      assert.ok(Number.isFinite(anchor.x) && anchor.x >= 0 && anchor.x <= 100,
        `${shape} ${corner} x in range`);
      assert.ok(Number.isFinite(anchor.y) && anchor.y >= 0 && anchor.y <= 100,
        `${shape} ${corner} y in range`);
    }
  }
});

test("resizeHandleAnchor sits exactly on the shape outline", () => {
  for (const shape of ALL_SHAPES) {
    for (const corner of Object.keys(CORNERS)) {
      const anchor = resizeHandleAnchor(shape, corner);
      assert.ok(
        isOnOutline(shape, [anchor.x, anchor.y]),
        `${shape} ${corner} anchor (${anchor.x}, ${anchor.y}) must sit on the outline`
      );
    }
  }
});

test("resizeHandleAnchor lies on the center-to-corner ray", () => {
  // The anchor is where the ray from the box center (50,50) to the
  // bounding-box corner first meets the outline, so anchor, center
  // and corner are collinear, with the anchor between center and corner.
  for (const shape of ALL_SHAPES) {
    for (const [corner, [cx, cy]] of Object.entries(CORNERS)) {
      const anchor = resizeHandleAnchor(shape, corner);
      const cross =
        (anchor.x - 50) * (cy - 50) - (anchor.y - 50) * (cx - 50);
      assert.ok(
        Math.abs(cross) < 1e-9,
        `${shape} ${corner} anchor must be collinear with center and corner`
      );
      const along =
        ((anchor.x - 50) * (cx - 50) + (anchor.y - 50) * (cy - 50)) /
        ((cx - 50) ** 2 + (cy - 50) ** 2);
      assert.ok(
        along > 0 && along <= 1,
        `${shape} ${corner} anchor must sit between center and corner`
      );
    }
  }
});

test("resizeHandleAnchor keeps the rectangle corners on the corners", () => {
  // The rectangle outline runs along the box, so its anchors are the
  // corners themselves — the old NodeResizer positions were already right.
  for (const [corner, [x, y]] of Object.entries(CORNERS)) {
    assert.deepEqual(resizeHandleAnchor("rectangle", corner), { x, y });
  }
});

test("resizeHandleAnchor moves the other shapes' handles onto the border", () => {
  // Expected anchors: the center-to-corner ray's first outline
  // crossing, in the 0–100 node space.
  const expected = {
    diamond: {
      "top-left": [25, 25],
      "top-right": [75, 25],
      "bottom-left": [25, 75],
      "bottom-right": [75, 75],
    },
    ellipse: {
      "top-left": [50 - 50 / Math.SQRT2, 50 - 50 / Math.SQRT2],
      "top-right": [50 + 50 / Math.SQRT2, 50 - 50 / Math.SQRT2],
      "bottom-left": [50 - 50 / Math.SQRT2, 50 + 50 / Math.SQRT2],
      "bottom-right": [50 + 50 / Math.SQRT2, 50 + 50 / Math.SQRT2],
    },
    triangle: {
      "top-left": [100 / 3, 100 / 3],
      "top-right": [200 / 3, 100 / 3],
      "bottom-left": [0, 100],
      "bottom-right": [100, 100],
    },
    parallelogram: {
      "top-left": [20, 20],
      "top-right": [100, 0],
      "bottom-left": [0, 100],
      "bottom-right": [80, 80],
    },
    hexagon: {
      "top-left": [50 / 3, 50 / 3],
      "top-right": [250 / 3, 50 / 3],
      "bottom-left": [50 / 3, 250 / 3],
      "bottom-right": [250 / 3, 250 / 3],
    },
    pentagon: {
      "top-left": [21.59, 21.59],
      "top-right": [78.41, 21.59],
      "bottom-left": [14.54, 85.46],
      "bottom-right": [85.46, 85.46],
    },
  };
  for (const [shape, corners] of Object.entries(expected)) {
    for (const [corner, [x, y]] of Object.entries(corners)) {
      const anchor = resizeHandleAnchor(shape, corner);
      assert.ok(
        Math.abs(anchor.x - x) < 0.01 && Math.abs(anchor.y - y) < 0.01,
        `${shape} ${corner} anchor should be near (${x}, ${y}), got (${anchor.x}, ${anchor.y})`
      );
    }
  }
});

test("the old bounding-box corners sit off the outline (the reported gap)", () => {
  // Regression guard for the complaint: on every non-rectangle shape
  // the top-left corner — where the user grabs to shrink — was in
  // empty space, not on the border. The shapes are convex, so the
  // center-to-corner ray meets the outline exactly once, at the
  // anchor: the corner is on the outline only when it equals the
  // anchor. The gap below is how far the dot moved onto the border.
  // (The top-left corner is used because some shapes have a vertex
  // exactly on another corner — e.g. the parallelogram's top-right —
  // so only top-left is off-outline for every shape.)
  for (const shape of ALL_SHAPES) {
    const anchor = resizeHandleAnchor(shape, "top-left");
    const [cx, cy] = CORNERS["top-left"];
    const gap = Math.hypot(anchor.x - cx, anchor.y - cy);
    if (shape === "rectangle") {
      assert.equal(gap, 0, "rectangle corner is on the outline");
    } else {
      assert.ok(
        gap > 5,
        `${shape} top-left must sit well off the outline (was the gap, ${gap.toFixed(1)} in 0-100 units)`
      );
    }
  }
});
