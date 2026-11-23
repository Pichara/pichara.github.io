import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const toolbar = readFileSync(
  new URL("../src/PicharaStudio/components/toolbar/Toolbar.tsx", import.meta.url),
  "utf8"
);
const studio = readFileSync(
  new URL("../src/PicharaStudio/components/DiagramStudio.tsx", import.meta.url),
  "utf8"
);
const canvas = readFileSync(
  new URL("../src/PicharaStudio/components/canvas/DiagramCanvas.tsx", import.meta.url),
  "utf8"
);
const shortcuts = readFileSync(
  new URL("../src/PicharaStudio/hooks/useKeyboardShortcuts.ts", import.meta.url),
  "utf8"
);
const popup = readFileSync(
  new URL("../src/PicharaStudio/components/panels/FormatPopup.tsx", import.meta.url),
  "utf8"
);
const css = readFileSync(
  new URL(
    "../src/PicharaStudio/components/DiagramStudio.css",
    import.meta.url
  ),
  "utf8"
);

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

const toolbarCode = stripComments(toolbar);
const studioCode = stripComments(studio);
const popupCode = stripComments(popup);

test("the toolbar no longer has a Format button", () => {
  assert.ok(!toolbarCode.includes('label="Format"'), "no Format group");
  assert.ok(!toolbarCode.includes("studio-toolbar__format"), "no Format group class");
  assert.ok(!toolbarCode.includes("Format the selection"), "no Format tooltip");
  assert.ok(!toolbarCode.includes("Format selection"), "no Format aria-label");
  assert.ok(!toolbarCode.includes("onOpenFormat"), "no onOpenFormat prop");
  assert.ok(!toolbarCode.includes("hasSelection"), "no now-unused selection selector");
  assert.ok(
    !css.includes(".studio-toolbar__format"),
    "the dead Format group CSS rule is gone too"
  );
});

test("DiagramStudio no longer passes a format opener to the toolbar", () => {
  assert.ok(
    !studioCode.includes("onOpenFormat={"),
    "no onOpenFormat prop passed to Toolbar"
  );
  assert.ok(
    studioCode.includes("openFormatForSelection"),
    "the selection opener still exists for the F key"
  );
});

test("the popup still opens via the F key", () => {
  assert.ok(
    studioCode.includes("useKeyboardShortcuts(openShortcuts, openFormatForSelection)"),
    "DiagramStudio still wires the F-key opener into the shortcuts hook"
  );
  assert.ok(
    shortcuts.includes("onOpenFormat?.()"),
    "the shortcuts hook still calls its format opener on F"
  );
});

test("the popup still opens via right-click", () => {
  assert.ok(
    canvas.includes("onOpenFormatAtPoint"),
    "the canvas still opens the popup at the click point"
  );
  assert.ok(
    canvas.includes("handleNodeContextMenu") &&
      canvas.includes("handleEdgeContextMenu"),
    "node and edge right-click handlers still open it"
  );
  assert.ok(
    studioCode.includes("openFormatAtPoint"),
    "DiagramStudio still provides the point opener"
  );
});

test("the restored ✕ closes the popup and sits at the end of the strip", () => {
  const closeIndex = popupCode.indexOf("format-popup__close");
  assert.ok(closeIndex !== -1, "the ✕ button renders");
  const closeButton = popupCode.slice(closeIndex);
  assert.ok(
    closeButton.includes('aria-label="Close format popup"'),
    "✕ has the close aria-label"
  );
  assert.ok(closeButton.includes("onClick={onClose}"), "✕ calls onClose");
  assert.ok(closeButton.includes("✕"), "✕ glyph");
  // It is the last control in the popup: after it comes only the
  // closing of the portal div, not another row or control group.
  assert.ok(
    !closeButton.includes("format-popup__row"),
    "no control row follows the ✕ — it is the last item in the strip"
  );
});
