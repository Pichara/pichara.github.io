import test from "node:test";
import assert from "node:assert/strict";
import { toggleMobilePanel } from "../src/PicharaStudio/utils/mobile-panels.ts";

// The format panel used to be a second drawer here; it was removed
// 2026-11-23 (formatting is now a popup), so the shape library is the
// only mobile drawer left.

test("toggleMobilePanel opens the shapes drawer when none is open", () => {
  assert.equal(toggleMobilePanel(null, "shapes"), "shapes");
});

test("toggleMobilePanel closes the drawer when it is already open", () => {
  assert.equal(toggleMobilePanel("shapes", "shapes"), null);
});
