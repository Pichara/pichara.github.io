import test from "node:test";
import assert from "node:assert/strict";
import {
  boundingBox,
  computeSpawnPositionFromPane,
  snapPosition,
} from "../src/PicharaStudio/utils/geometry.ts";

test("snapPosition rounds each axis to the nearest grid intersection", () => {
  assert.deepEqual(snapPosition({ x: 7, y: 23 }, 15), { x: 0, y: 30 });
  assert.deepEqual(snapPosition({ x: 8, y: 8 }, 15), { x: 15, y: 15 });
});

test("snapPosition leaves exact multiples unchanged", () => {
  assert.deepEqual(snapPosition({ x: 30, y: 0 }, 15), { x: 30, y: 0 });
});

test("snapPosition rounds negative positions the same way", () => {
  assert.deepEqual(snapPosition({ x: -8, y: -22 }, 15), { x: -15, y: -15 });
});

test("boundingBox covers every rect", () => {
  assert.deepEqual(
    boundingBox([
      { x: 10, y: 20, width: 100, height: 60 },
      { x: 50, y: 5, width: 40, height: 40 },
    ]),
    { minX: 10, minY: 5, maxX: 110, maxY: 80 }
  );
});

test("boundingBox handles a single rect with negative positions", () => {
  assert.deepEqual(boundingBox([{ x: -30, y: -10, width: 20, height: 20 }]), {
    minX: -30,
    minY: -10,
    maxX: -10,
    maxY: 10,
  });
});

test("computeSpawnPositionFromPane centers on the pane, not the window", () => {
  // Desktop window 1000x800 with the 200px sidebar open, 48px toolbar
  // and 28px status bar: the pane is 800x724 starting at (200, 48).
  // The old window-based spawn used 1000x752 and landed off-centre.
  const position = computeSpawnPositionFromPane(
    { left: 200, top: 48, width: 800, height: 724 },
    { x: 0, y: 0, zoom: 1 },
    0
  );
  // Node is 180x60, so its top-left sits half a node left/up of center.
  assert.deepEqual(position, { x: 310, y: 332 });
});

test("computeSpawnPositionFromPane centers on a full-width mobile pane", () => {
  // Narrow screen: the library is an overlay drawer, so the pane keeps
  // the full window width (390px) below the 48px toolbar.
  const position = computeSpawnPositionFromPane(
    { left: 0, top: 48, width: 390, height: 700 },
    { x: 0, y: 0, zoom: 1 },
    0
  );
  assert.deepEqual(position, { x: 105, y: 320 });
});

test("computeSpawnPositionFromPane ignores the pane's screen offset", () => {
  // React Flow's viewport offset is relative to the pane's own origin,
  // so two panes of the same size at different screen positions must
  // spawn at the same flow position.
  const viewport = { x: 20, y: 10, zoom: 2 };
  const a = computeSpawnPositionFromPane(
    { left: 200, top: 48, width: 800, height: 600 },
    viewport,
    40
  );
  const b = computeSpawnPositionFromPane(
    { left: 0, top: 0, width: 800, height: 600 },
    viewport,
    40
  );
  assert.deepEqual(a, b);
  // center: ((400 - 20) / 2 - 90, (300 - 10) / 2 - 30) + 40 offset
  assert.deepEqual(a, { x: 140, y: 155 });
});
