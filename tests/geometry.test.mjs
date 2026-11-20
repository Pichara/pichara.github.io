import test from "node:test";
import assert from "node:assert/strict";
import { snapPosition } from "../src/PicharaStudio/utils/geometry.ts";

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
