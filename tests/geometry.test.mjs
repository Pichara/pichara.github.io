import test from "node:test";
import assert from "node:assert/strict";
import { boundingBox, snapPosition } from "../src/PicharaStudio/utils/geometry.ts";

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
