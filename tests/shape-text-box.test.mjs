import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shapePolygonPoints } from "../src/PicharaStudio/utils/shape-geometry.ts";
import {
  computeFitScale,
  MIN_FIT_SCALE,
  shapeTextBox,
} from "../src/PicharaStudio/utils/shape-text-box.ts";

const css = readFileSync(
  new URL(
    "../src/PicharaStudio/components/DiagramStudio.css",
    import.meta.url
  ),
  "utf8"
);
const tsx = readFileSync(
  new URL("../src/PicharaStudio/nodes/base/BaseShapeNode.tsx", import.meta.url),
  "utf8"
);

const ALL_SHAPES = [
  "rectangle",
  "diamond",
  "ellipse",
  "triangle",
  "parallelogram",
  "hexagon",
  "pentagon",
];

// Default node size (constants/defaults.ts) and default label size.
const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 60;
const DEFAULT_FONT_SIZE = 14;
const LINE_HEIGHT = 1.3;

/** Parse "x,y x,y ..." into [x, y] pairs. */
function parsePoints(points) {
  return points
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number));
}

/** Ray-casting point-in-polygon test (vertices in 0–100 node space). */
function pointInPolygon(x, y, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    if (
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

/** True when (x, y) lies inside the shape's outline (0–100 space). */
function pointInShape(shape, x, y) {
  if (shape === "rectangle") return x >= 0 && x <= 100 && y >= 0 && y <= 100;
  if (shape === "ellipse") {
    return (x - 50) ** 2 + (y - 50) ** 2 <= 50 ** 2;
  }
  const points = shapePolygonPoints(shape);
  assert.ok(points !== null, `${shape} should have polygon points`);
  return pointInPolygon(x, y, parsePoints(points));
}

/** Points sampled along the box boundary: corners + quarter points. */
function boxBoundarySamples(box) {
  const samples = [];
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    samples.push([box.left + box.width * t, box.top]);
    samples.push([box.left + box.width * t, box.top + box.height]);
    samples.push([box.left, box.top + box.height * t]);
    samples.push([box.left + box.width, box.top + box.height * t]);
  }
  return samples;
}

test("shapeTextBox stays inside the node bounds for every shape", () => {
  for (const shape of ALL_SHAPES) {
    const box = shapeTextBox(shape);
    for (const value of [box.left, box.top, box.width, box.height]) {
      assert.ok(Number.isFinite(value) && value > 0, `${shape} box values`);
    }
    assert.ok(box.left >= 0 && box.left + box.width <= 100, `${shape} box width`);
    assert.ok(box.top >= 0 && box.top + box.height <= 100, `${shape} box height`);
  }
});

test("shapeTextBox is horizontally centred for every shape", () => {
  for (const shape of ALL_SHAPES) {
    const box = shapeTextBox(shape);
    assert.equal(
      box.left + box.width / 2,
      50,
      `${shape} box must be centred on x=50`
    );
  }
});

test("shapeTextBox boundary lies inside the shape outline for every shape", () => {
  // A convex shape contains a rectangle exactly when the rectangle's
  // boundary is inside it — so sampling the boundary (corners and
  // quarter points on each edge) pins "text never shows outside the
  // outline" for each shape type.
  for (const shape of ALL_SHAPES) {
    const box = shapeTextBox(shape);
    for (const [x, y] of boxBoundarySamples(box)) {
      assert.ok(
        pointInShape(shape, x, y),
        `${shape} box boundary point (${x}, ${y}) must be inside the outline`
      );
    }
  }
});

test("shapeTextBox fits at least one label line at the default node size", () => {
  // A short label must render at full size on every shape: the box
  // has to be at least one 14px line tall and wide enough for a word.
  const oneLinePx = DEFAULT_FONT_SIZE * LINE_HEIGHT;
  for (const shape of ALL_SHAPES) {
    const box = shapeTextBox(shape);
    const heightPx = (box.height / 100) * DEFAULT_NODE_HEIGHT;
    const widthPx = (box.width / 100) * DEFAULT_NODE_WIDTH;
    assert.ok(
      heightPx >= oneLinePx,
      `${shape} box is ${heightPx.toFixed(1)}px tall, needs ${oneLinePx}px for one line`
    );
    assert.ok(widthPx >= 80, `${shape} box is ${widthPx.toFixed(1)}px wide`);
  }
});

test("computeFitScale keeps the scale when the label already fits", () => {
  assert.equal(
    computeFitScale(
      { scrollHeight: 40, scrollWidth: 100, clientHeight: 50, clientWidth: 120 },
      1
    ),
    1
  );
  // Zero-size box (before first layout): no measurement, no change.
  assert.equal(
    computeFitScale(
      { scrollHeight: 40, scrollWidth: 100, clientHeight: 0, clientWidth: 0 },
      1
    ),
    1
  );
});

test("computeFitScale shrinks a longer label that overflows vertically", () => {
  // Content twice as tall as the box: a long label wrapped into too
  // many lines. The scale drops, but stays above the minimum.
  const next = computeFitScale(
    { scrollHeight: 100, scrollWidth: 100, clientHeight: 50, clientWidth: 120 },
    1
  );
  assert.ok(next < 1, "overflowing label must shrink");
  assert.ok(next >= MIN_FIT_SCALE, "must not shrink below the minimum");
  assert.ok(next <= 0.9, "one pass shrinks by at most one step");
});

test("computeFitScale shrinks a label that overflows horizontally", () => {
  const next = computeFitScale(
    { scrollHeight: 40, scrollWidth: 200, clientHeight: 50, clientWidth: 120 },
    1
  );
  assert.ok(next < 1, "overflowing label must shrink");
  assert.ok(next >= MIN_FIT_SCALE, "must not shrink below the minimum");
});

test("computeFitScale never goes below the minimum, however long the label", () => {
  assert.equal(
    computeFitScale(
      { scrollHeight: 500, scrollWidth: 900, clientHeight: 50, clientWidth: 120 },
      MIN_FIT_SCALE
    ),
    MIN_FIT_SCALE
  );
  assert.equal(
    computeFitScale(
      { scrollHeight: 500, scrollWidth: 900, clientHeight: 50, clientWidth: 120 },
      1
    ),
    MIN_FIT_SCALE
  );
});

// ---------------------------------------------------------------------------
// Wiring: the component must use the safe box and the shrink-to-fit.
// ---------------------------------------------------------------------------

/** Declaration blocks for one selector, comments stripped first. */
function cssBlocksFor(source, selector) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = rulePattern.exec(withoutComments)) !== null) {
    if (match[1].trim() === selector) blocks.push(match[2]);
  }
  return blocks;
}

test("content layer is absolutely positioned and clips overflow", () => {
  const blocks = cssBlocksFor(css, ".shape-node__content");
  assert.equal(blocks.length, 1, "expected one .shape-node__content rule");
  assert.match(blocks[0], /position:\s*absolute/);
  assert.match(blocks[0], /overflow:\s*hidden/);
});

test("label and description wrap and stay within the content layer", () => {
  for (const selector of [".shape-node__label", ".shape-node__description"]) {
    const blocks = cssBlocksFor(css, selector);
    assert.equal(blocks.length, 1, `expected one ${selector} rule`);
    assert.match(blocks[0], /overflow-wrap:\s*anywhere/);
    assert.match(blocks[0], /max-width:\s*100%/);
  }
});

test("BaseShapeNode renders the label inside the shape's safe text box", () => {
  assert.ok(
    tsx.includes("shapeTextBox(data.shape)"),
    "node must compute its safe text box from its shape"
  );
  const content = tsx.slice(tsx.indexOf('className="shape-node__content"'));
  for (const field of ["textBox.left", "textBox.top", "textBox.width", "textBox.height"]) {
    assert.ok(content.includes(field), `content style must set ${field}%`);
  }
  assert.ok(
    content.includes("ref={contentRef}"),
    "content layer must be measured for shrink-to-fit"
  );
});

test("BaseShapeNode shrinks the label to fit instead of overflowing", () => {
  assert.ok(tsx.includes("computeFitScale("), "node must use computeFitScale");
  assert.ok(tsx.includes("content.scrollHeight"), "node must measure content height");
  assert.ok(tsx.includes("content.clientHeight"), "node must measure box height");
  assert.ok(tsx.includes("content.scrollWidth"), "node must measure content width");
  assert.ok(tsx.includes("content.clientWidth"), "node must measure box width");
  const label = tsx.slice(tsx.indexOf('className="shape-node__label"'));
  assert.ok(
    label.includes("style.fontSize * fitScale"),
    "label font size must scale with fitScale"
  );
});

test("inline rename flow is untouched by the text-box change", () => {
  // Double-click still opens the editor on the content layer, the
  // editor is still the borderless textarea at the base font size
  // (not shrunk), and Enter / Escape still commit / cancel.
  const content = tsx.slice(tsx.indexOf('className="shape-node__content"'));
  assert.ok(
    content.includes("onDoubleClick={startEditing}"),
    "content must still open the editor on double-click"
  );
  assert.ok(tsx.includes("<textarea"), "expected a textarea editor");
  const textarea = tsx.slice(
    tsx.indexOf("<textarea"),
    tsx.indexOf("/>", tsx.indexOf("<textarea"))
  );
  assert.ok(
    textarea.includes("fontSize: style.fontSize,"),
    "editor must keep the base font size, not the shrunk one"
  );
  assert.ok(!textarea.includes("fitScale"), "editor must not use fitScale");
  assert.ok(tsx.includes("commitLabelEdit(data.label, draft)"));
  assert.ok(tsx.includes('event.key === "Escape"'));
});
