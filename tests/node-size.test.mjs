import test from "node:test";
import assert from "node:assert/strict";
import { resolveNodeSize } from "../src/PicharaStudio/utils/node-size.ts";
import {
  DEFAULT_NODE_HEIGHT,
  DEFAULT_NODE_WIDTH,
} from "../src/PicharaStudio/constants/defaults.ts";

test("resolveNodeSize returns the defaults for undefined props", () => {
  assert.deepEqual(resolveNodeSize(undefined, undefined), {
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  });
});

test("resolveNodeSize returns the defaults for 0 props (fresh unmeasured node)", () => {
  // React Flow v13 passes measured dimensions as the node props, and a
  // freshly added node measures 0x0 — 0 must not render as a 0px node.
  assert.deepEqual(resolveNodeSize(0, 0), {
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  });
  assert.deepEqual(resolveNodeSize(0, 120), {
    width: DEFAULT_NODE_WIDTH,
    height: 120,
  });
  assert.deepEqual(resolveNodeSize(240, 0), {
    width: 240,
    height: DEFAULT_NODE_HEIGHT,
  });
});

test("resolveNodeSize keeps the real size once the node is measured/resized", () => {
  assert.deepEqual(resolveNodeSize(240, 120), { width: 240, height: 120 });
  assert.deepEqual(resolveNodeSize(80, 40), { width: 80, height: 40 });
});

test("resolveNodeSize treats negative sizes as unknown", () => {
  assert.deepEqual(resolveNodeSize(-10, -5), {
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  });
});
