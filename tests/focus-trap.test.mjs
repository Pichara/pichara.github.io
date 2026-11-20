import test from "node:test";
import assert from "node:assert/strict";
import { trapTab } from "../src/PicharaStudio/utils/focus-trap.ts";

const ITEMS = ["cancel", "confirm", "close"];

test("Tab on the last element wraps to the first", () => {
  assert.equal(trapTab(ITEMS, "close", false), "cancel");
});

test("Shift+Tab on the first element wraps to the last", () => {
  assert.equal(trapTab(ITEMS, "cancel", true), "close");
});

test("Tab in the middle lets the browser move focus normally", () => {
  assert.equal(trapTab(ITEMS, "cancel", false), null);
  assert.equal(trapTab(ITEMS, "confirm", false), null);
  assert.equal(trapTab(ITEMS, "confirm", true), null);
  assert.equal(trapTab(ITEMS, "close", true), null);
});

test("focus outside the dialog is pulled to the first (or last) element", () => {
  assert.equal(trapTab(ITEMS, null, false), "cancel");
  assert.equal(trapTab(ITEMS, null, true), "close");
  assert.equal(trapTab(ITEMS, "somewhere-else", false), "cancel");
  assert.equal(trapTab(ITEMS, "somewhere-else", true), "close");
});

test("a single focusable element always wraps to itself", () => {
  assert.equal(trapTab(["only"], "only", false), "only");
  assert.equal(trapTab(["only"], "only", true), "only");
});

test("no focusable elements traps nothing", () => {
  assert.equal(trapTab([], null, false), null);
});
