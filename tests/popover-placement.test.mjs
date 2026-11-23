import test from "node:test";
import assert from "node:assert/strict";
import { placePopover, placePopoverAbove } from "../src/PicharaStudio/utils/popover-placement.ts";

const VIEWPORT = { width: 1920, height: 1080 };

test("places below the anchor, right-aligned with it", () => {
  const placed = placePopover(
    { left: 1700, top: 0, right: 1860, bottom: 48 },
    { width: 200, height: 300 },
    VIEWPORT
  );
  assert.deepEqual(placed, { top: 54, left: 1660 });
});

test("clamps the left edge inside the viewport when the anchor is at the right edge", () => {
  const placed = placePopover(
    { left: 1800, top: 0, right: 1912, bottom: 48 },
    { width: 240, height: 300 },
    VIEWPORT
  );
  // Right-aligned would start at 1672 and end at 1912 — inside, so kept.
  assert.equal(placed.left, 1672);
  const overflowing = placePopover(
    { left: 1800, top: 0, right: 1912, bottom: 48 },
    { width: 400, height: 300 },
    VIEWPORT
  );
  // Right-aligned would end at 1912 + (400 - 112) past the anchor; the
  // menu is wider than the space, so it clamps to the right margin.
  assert.equal(overflowing.left, 1920 - 400 - 8);
});

test("never starts left of the margin, even with a wide popover", () => {
  const placed = placePopover(
    { left: 0, top: 0, right: 100, bottom: 48 },
    { width: 2000, height: 300 },
    VIEWPORT
  );
  assert.equal(placed.left, 8);
});

test("flips above the anchor when there is no room below", () => {
  const placed = placePopover(
    { left: 1700, top: 900, right: 1860, bottom: 948 },
    { width: 200, height: 300 },
    VIEWPORT
  );
  assert.deepEqual(placed, { top: 900 - 6 - 300, left: 1660 });
});

test("clamps the top inside the viewport when the popover is taller than it", () => {
  const placed = placePopover(
    { left: 1700, top: 0, right: 1860, bottom: 48 },
    { width: 200, height: 2000 },
    VIEWPORT
  );
  assert.equal(placed.top, 8);
});

test("placePopoverAbove puts the popover above the anchor, centered on it", () => {
  const placed = placePopoverAbove(
    { left: 900, top: 500, right: 1080, bottom: 560 },
    { width: 248, height: 300 },
    VIEWPORT
  );
  // Centered on the anchor center (990): 990 - 124 = 866; above:
  // 500 - 6 - 300 = 194.
  assert.deepEqual(placed, { top: 194, left: 866 });
});

test("placePopoverAbove centers on a zero-size point anchor (right-click)", () => {
  const placed = placePopoverAbove(
    { left: 400, top: 300, right: 400, bottom: 300 },
    { width: 248, height: 200 },
    VIEWPORT
  );
  assert.deepEqual(placed, { top: 300 - 6 - 200, left: 400 - 124 });
});

test("placePopoverAbove flips below the anchor when there is no room above", () => {
  const placed = placePopoverAbove(
    { left: 900, top: 100, right: 1080, bottom: 160 },
    { width: 248, height: 300 },
    VIEWPORT
  );
  // Above would start at 100 - 6 - 300 = -206, so it goes below.
  assert.deepEqual(placed, { top: 166, left: 866 });
});

test("placePopoverAbove clamps inside the viewport on every side", () => {
  const leftEdge = placePopoverAbove(
    { left: 10, top: 500, right: 20, bottom: 560 },
    { width: 248, height: 300 },
    VIEWPORT
  );
  assert.equal(leftEdge.left, 8);
  assert.equal(leftEdge.top, 194);

  const rightEdge = placePopoverAbove(
    { left: 1900, top: 500, right: 1912, bottom: 560 },
    { width: 248, height: 300 },
    VIEWPORT
  );
  assert.equal(rightEdge.left, 1920 - 248 - 8);

  const short = placePopoverAbove(
    { left: 900, top: 10, right: 1080, bottom: 20 },
    { width: 248, height: 2000 },
    VIEWPORT
  );
  // No room above (flips below) and taller than the viewport: clamped.
  assert.equal(short.top, 8);
});
