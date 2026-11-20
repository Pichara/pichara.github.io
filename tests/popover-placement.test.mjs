import test from "node:test";
import assert from "node:assert/strict";
import { placePopover } from "../src/PicharaStudio/utils/popover-placement.ts";

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
