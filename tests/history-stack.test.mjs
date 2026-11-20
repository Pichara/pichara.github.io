import test from "node:test";
import assert from "node:assert/strict";
import {
  createHistoryStack,
  pushHistoryEntry,
  redoHistoryEntry,
  restoreContentSnapshot,
  undoHistoryEntry,
} from "../src/PicharaStudio/utils/history-stack.ts";

test("push records a snapshot and clears the redo stack", () => {
  let stack = createHistoryStack();
  stack = pushHistoryEntry(stack, "a", 3);
  stack = pushHistoryEntry(stack, "b", 3);
  assert.deepEqual(stack.past, ["a", "b"]);
  assert.deepEqual(stack.future, []);
});

test("push drops the oldest entry past the size limit", () => {
  let stack = createHistoryStack();
  stack = pushHistoryEntry(stack, "a", 2);
  stack = pushHistoryEntry(stack, "b", 2);
  stack = pushHistoryEntry(stack, "c", 2);
  assert.deepEqual(stack.past, ["b", "c"]);
});

test("pushing the same snapshot twice in a row records one entry", () => {
  const snapshot = { id: "same" };
  let stack = createHistoryStack();
  stack = pushHistoryEntry(stack, snapshot, 3);
  stack = pushHistoryEntry(stack, snapshot, 3);
  assert.equal(stack.past.length, 1);
});

test("undo returns the latest snapshot and moves current to redo", () => {
  let stack = createHistoryStack();
  stack = pushHistoryEntry(stack, "a", 3);
  stack = pushHistoryEntry(stack, "b", 3);
  const result = undoHistoryEntry(stack, "current");
  assert.equal(result?.snapshot, "b");
  assert.deepEqual(result?.stack.past, ["a"]);
  assert.deepEqual(result?.stack.future, ["current"]);
});

test("redo returns the undone snapshot and restores it to past", () => {
  let stack = createHistoryStack();
  stack = pushHistoryEntry(stack, "a", 3);
  stack = pushHistoryEntry(stack, "b", 3);
  const undone = undoHistoryEntry(stack, "current");
  assert.ok(undone !== null);
  const redone = redoHistoryEntry(undone.stack, undone.snapshot);
  assert.equal(redone?.snapshot, "current");
  assert.deepEqual(redone?.stack.past, ["a", "b"]);
  assert.deepEqual(redone?.stack.future, []);
});

test("undo and redo on empty stacks return null", () => {
  const stack = createHistoryStack();
  assert.equal(undoHistoryEntry(stack, "current"), null);
  assert.equal(redoHistoryEntry(stack, "current"), null);
});

test("a new push after undo discards the redo stack", () => {
  let stack = createHistoryStack();
  stack = pushHistoryEntry(stack, "a", 3);
  const undone = undoHistoryEntry(stack, "current");
  assert.ok(undone !== null);
  stack = pushHistoryEntry(undone.stack, "new", 3);
  assert.deepEqual(stack.future, []);
  assert.deepEqual(stack.past, ["new"]);
});

test("restoreContentSnapshot restores nodes/edges but keeps the current viewport", () => {
  const current = {
    nodes: ["new-node"],
    edges: [],
    viewport: { x: 10, y: 20, zoom: 2.46 },
    name: "Current",
  };
  const snapshot = {
    nodes: ["old-node"],
    edges: ["old-edge"],
    viewport: { x: 0, y: 0, zoom: 1 },
    name: "Old",
  };
  const restored = restoreContentSnapshot(current, snapshot);
  // Content comes from the snapshot; camera and identity stay current,
  // so undo never jumps the zoom.
  assert.deepEqual(restored.nodes, ["old-node"]);
  assert.deepEqual(restored.edges, ["old-edge"]);
  assert.deepEqual(restored.viewport, { x: 10, y: 20, zoom: 2.46 });
  assert.equal(restored.name, "Current");
});
