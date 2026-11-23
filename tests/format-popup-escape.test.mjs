import test from "node:test";
import assert from "node:assert/strict";
import {
  COLOR_PICKER_POPOVER_SELECTOR,
  isColorPickerPopoverOpen,
} from "../src/PicharaStudio/utils/popup-escape.ts";

// The Esc-ownership rule (see `utils/popup-escape.ts`): while a
// color-picker popover is open, Escape must close only the picker,
// not the whole format popup. The full listener ordering cannot be
// exercised in this repo's harness — there is no DOM or React test
// renderer and adding one (jsdom) would be a new dependency — so
// these tests cover the guard itself plus a faithful simulation of
// the capture-phase dispatch: same target, same phase, listeners
// firing in registration order (popup first, picker second), with
// `stopPropagation()` cutting off later listeners.

function fakeDocument(popoverOpen) {
  const seen = [];
  return {
    seen,
    querySelector(selector) {
      seen.push(selector);
      return popoverOpen ? {} : null;
    },
  };
}

test("no picker popover open: the popup may close on Escape", () => {
  assert.equal(isColorPickerPopoverOpen(fakeDocument(false)), false);
});

test("picker popover open: the popup must not close on Escape", () => {
  assert.equal(isColorPickerPopoverOpen(fakeDocument(true)), true);
});

test("the guard queries exactly the picker popover selector", () => {
  const doc = fakeDocument(false);
  isColorPickerPopoverOpen(doc);
  assert.deepEqual(doc.seen, [COLOR_PICKER_POPOVER_SELECTOR]);
  assert.equal(COLOR_PICKER_POPOVER_SELECTOR, ".color-picker__popover");
});

// Minimal stand-in for `document` capture-phase dispatch: listeners
// on the same target and phase run in registration order, and
// `stopPropagation()` prevents later listeners from running.
function captureDispatcher() {
  const listeners = [];
  return {
    addEventListener(_type, handler, capture) {
      if (capture) listeners.push(handler);
    },
    dispatchEscape() {
      let stopped = false;
      const event = {
        key: "Escape",
        preventDefault() {},
        stopPropagation() {
          stopped = true;
        },
      };
      for (const handler of listeners) {
        if (stopped) break;
        handler(event);
      }
    },
  };
}

test("regression: with the picker open, Escape closes only the picker", () => {
  const doc = fakeDocument(true);
  const dispatcher = captureDispatcher();
  let popupClosed = false;
  let pickerClosed = false;
  // FormatPopup's handler, registered first (popup mounts first):
  // it must return early — no close, no stopPropagation — while the
  // picker popover is open, so the picker's handler still runs.
  dispatcher.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isColorPickerPopoverOpen(doc)) return;
      event.preventDefault();
      event.stopPropagation();
      popupClosed = true;
    }
  }, true);
  // ColorPicker's handler, registered later (popover opens later).
  dispatcher.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      pickerClosed = true;
    }
  }, true);
  dispatcher.dispatchEscape();
  assert.equal(pickerClosed, true);
  assert.equal(popupClosed, false);
});

test("with the picker closed, Escape still closes the popup", () => {
  const doc = fakeDocument(false);
  const dispatcher = captureDispatcher();
  let popupClosed = false;
  dispatcher.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isColorPickerPopoverOpen(doc)) return;
      event.preventDefault();
      event.stopPropagation();
      popupClosed = true;
    }
  }, true);
  dispatcher.dispatchEscape();
  assert.equal(popupClosed, true);
});
