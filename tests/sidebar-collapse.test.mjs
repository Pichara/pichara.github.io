import test from "node:test";
import assert from "node:assert/strict";
import {
  isShapeLibraryVisible,
  toggleShapeLibraryCollapsed,
} from "../src/PicharaStudio/utils/sidebar-collapse.ts";

test("toggleShapeLibraryCollapsed flips the collapsed flag", () => {
  assert.equal(toggleShapeLibraryCollapsed(false), true);
  assert.equal(toggleShapeLibraryCollapsed(true), false);
});

test("isShapeLibraryVisible shows the library when expanded", () => {
  assert.equal(isShapeLibraryVisible(false, null), true);
  assert.equal(isShapeLibraryVisible(false, "shapes"), true);
});

test("isShapeLibraryVisible hides the library when collapsed", () => {
  assert.equal(isShapeLibraryVisible(true, null), false);
});

test("isShapeLibraryVisible still shows the library when its mobile drawer is open", () => {
  // The drawer wins over the desktop collapsed flag: collapsing on
  // desktop must not break opening the library drawer on a phone.
  assert.equal(isShapeLibraryVisible(true, "shapes"), true);
});
