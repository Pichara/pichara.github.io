import test from "node:test";
import assert from "node:assert/strict";
import {
  MOUSE_TIPS,
  SHORTCUTS,
} from "../src/PicharaStudio/constants/shortcuts.ts";

// Every shortcut the editor handles must be discoverable in the dialog:
// if a shortcut is added to hooks/useKeyboardShortcuts.ts, add it here
// too (and vice versa).
const HANDLED_SHORTCUTS = [
  "Ctrl+Z",
  "Ctrl+Shift+Z / Ctrl+Y",
  "Ctrl+C",
  "Ctrl+V",
  "Ctrl+D",
  "Ctrl+G",
  "Ctrl+Shift+G",
  "Ctrl+A",
  "Ctrl+0",
  "Delete / Backspace",
  "Esc",
  "F",
  "?",
];

test("SHORTCUTS lists every handled keyboard shortcut, exactly once", () => {
  const keys = SHORTCUTS.map((entry) => entry.keys);
  assert.deepEqual([...keys].sort(), [...HANDLED_SHORTCUTS].sort());
  assert.equal(new Set(keys).size, keys.length);
});

test("SHORTCUTS and MOUSE_TIPS entries are non-empty and unique", () => {
  for (const entry of [...SHORTCUTS, ...MOUSE_TIPS]) {
    assert.ok(entry.keys.trim().length > 0);
    assert.ok(entry.action.trim().length > 0);
  }
  const actions = [...SHORTCUTS, ...MOUSE_TIPS].map((entry) => entry.action);
  assert.equal(new Set(actions).size, actions.length);
});
