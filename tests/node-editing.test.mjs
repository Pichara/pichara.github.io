import test from "node:test";
import assert from "node:assert/strict";
import { commitLabelEdit } from "../src/PicharaStudio/utils/node-editing.ts";

test("commitLabelEdit returns the trimmed draft when it differs", () => {
  assert.equal(commitLabelEdit("Old", "  New label  "), "New label");
});

test("commitLabelEdit returns null when the draft matches the current label", () => {
  assert.equal(commitLabelEdit("Same", "Same"), null);
  assert.equal(commitLabelEdit("Same", "  Same  "), null);
});

test("commitLabelEdit returns null for an empty or whitespace-only draft", () => {
  assert.equal(commitLabelEdit("Keep me", ""), null);
  assert.equal(commitLabelEdit("Keep me", "   "), null);
});

test("commitLabelEdit keeps inner spacing and newlines, trimming only the ends", () => {
  assert.equal(
    commitLabelEdit("A", "  first\nsecond  "),
    "first\nsecond"
  );
});
