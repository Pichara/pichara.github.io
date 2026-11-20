import test from "node:test";
import assert from "node:assert/strict";
import { toggleMobilePanel } from "../src/PicharaStudio/utils/mobile-panels.ts";

test("toggleMobilePanel opens a panel when none is open", () => {
  assert.equal(toggleMobilePanel(null, "shapes"), "shapes");
  assert.equal(toggleMobilePanel(null, "format"), "format");
});

test("toggleMobilePanel closes the panel when it is already open", () => {
  assert.equal(toggleMobilePanel("shapes", "shapes"), null);
  assert.equal(toggleMobilePanel("format", "format"), null);
});

test("toggleMobilePanel switches to the other panel", () => {
  assert.equal(toggleMobilePanel("shapes", "format"), "format");
  assert.equal(toggleMobilePanel("format", "shapes"), "shapes");
});
