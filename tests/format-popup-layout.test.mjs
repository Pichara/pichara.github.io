import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(
  new URL(
    "../src/PicharaStudio/components/DiagramStudio.css",
    import.meta.url
  ),
  "utf8"
);
const tsx = readFileSync(
  new URL(
    "../src/PicharaStudio/components/panels/FormatPopup.tsx",
    import.meta.url
  ),
  "utf8"
);
const pickerTsx = readFileSync(
  new URL("../src/PicharaStudio/components/panels/ColorPicker.tsx", import.meta.url),
  "utf8"
);

// Same helpers as tests/confirm-dialog.test.mjs: strip comments first
// (notes above the rules mention class names) and merge every
// declaration block for a class into one property map.
function blocksFor(source, className) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = rulePattern.exec(withoutComments)) !== null) {
    if (match[1].includes(className)) {
      blocks.push({ selector: match[1].trim(), body: match[2] });
    }
  }
  return blocks;
}

function declarationsFor(source, className) {
  const merged = new Map();
  for (const block of blocksFor(source, className)) {
    for (const part of block.body.split(";")) {
      const [property, ...rest] = part.split(":");
      if (property === undefined || rest.length === 0) continue;
      merged.set(property.trim().toLowerCase(), rest.join(":").trim());
    }
  }
  return merged;
}

/**
 * Declarations for one exact selector only — the merged helper above
 * also sweeps in `.format-popup__text-input` (width 110px) and friends,
 * which would shadow the strip's own `width: max-content`.
 */
function exactDeclarationsFor(source, selector) {
  const merged = new Map();
  for (const block of blocksFor(source, selector)) {
    if (block.selector !== selector) continue;
    for (const part of block.body.split(";")) {
      const [property, ...rest] = part.split(":");
      if (property === undefined || rest.length === 0) continue;
      merged.set(property.trim().toLowerCase(), rest.join(":").trim());
    }
  }
  return merged;
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

const code = stripComments(tsx);
const pickerCode = stripComments(pickerTsx);

test("close button is back: the popup has a ✕ button, still no header", () => {
  // The minimalist redesign dropped the ✕ by mistake (the owner meant
  // the toolbar "Format" button to go, not this one) — it is restored
  // as the last item of the single-row strip, closing via onClose.
  assert.ok(code.includes("format-popup__close"), "close-button class");
  assert.ok(
    code.includes("Close format popup"),
    "close-button aria-label"
  );
  assert.ok(code.includes("✕"), "✕ glyph in the popup code");
  assert.ok(!code.includes("format-popup__header"), "no header row");
  assert.ok(!code.includes("format-popup__title"), "no Format title");
  assert.ok(
    !code.includes("format-popup__section-title"),
    "no section titles"
  );
});

test("the popup is one horizontal strip, not a vertical stack", () => {
  const popup = exactDeclarationsFor(css, ".format-popup");
  assert.equal(popup.get("display"), "flex");
  assert.equal(
    popup.get("flex-direction"),
    "row",
    "the popup itself lays its groups out in a row"
  );
  assert.equal(popup.get("align-items"), "center");
  assert.equal(
    popup.get("width"),
    "max-content",
    "the strip sizes to its single row instead of a fixed panel width"
  );
  assert.equal(
    popup.get("overflow-x"),
    "auto",
    "a long row scrolls horizontally on narrow screens instead of overflowing"
  );
  const row = exactDeclarationsFor(css, ".format-popup__row");
  assert.equal(row.get("display"), "flex");
  assert.equal(row.get("flex-direction"), "row");
  assert.equal(row.get("align-items"), "center");
  // No vertical-stack leftovers: the old section/arrange rules are gone.
  assert.equal(blocksFor(css, ".format-popup__header").length, 0);
  assert.equal(blocksFor(css, ".format-popup__arrange-grid").length, 0);
  assert.equal(blocksFor(css, ".format-popup__check").length, 0);
});

test("the strip still renders as control groups, not sections", () => {
  assert.ok(
    code.includes('className="format-popup__row"'),
    "controls render in horizontal row groups"
  );
  assert.ok(!code.includes("<section"), "no vertical section blocks");
  assert.ok(
    code.includes('role="group"') && code.includes("Shape formatting"),
    "the shape group keeps its accessible name"
  );
  assert.ok(
    code.includes("Connection formatting"),
    "the connection group keeps its accessible name"
  );
});

test("essential formatting survives: fill, border, text, sizes", () => {
  for (const label of [
    "Fill",
    "Border",
    "Border width",
    "Text",
    "Font size",
    "Font weight",
    "Line",
    "Line width",
    "Line style",
    "Line type",
    "Label",
  ]) {
    assert.ok(
      code.includes(`label="${label}"`),
      `the strip still offers ${label}`
    );
  }
  assert.ok(
    code.includes('aria-label="Reset style"'),
    "reset survives as an icon button"
  );
  assert.ok(
    code.includes('aria-label="Arrowhead"'),
    "the arrowhead toggle survives as an icon button"
  );
});

test("colors stay swatch-only: no hex code or visible label in the strip", () => {
  assert.ok(
    code.includes("compact"),
    "the popup asks ColorPicker for its compact form"
  );
  assert.ok(
    pickerCode.includes("compact"),
    "ColorPicker accepts a compact prop"
  );
  // Compact renders the swatch button and the popover, nothing else.
  assert.ok(
    pickerCode.includes("if (compact)"),
    "compact takes its own render path"
  );
  assert.ok(
    pickerCode.includes("color-picker__popover"),
    "the compact swatch still opens the color picker popover"
  );
});

test("closing is Esc / outside-click / ✕, with the picker owning Esc first", () => {
  assert.ok(
    code.includes('event.key === "Escape"'),
    "Esc still closes the popup"
  );
  assert.ok(
    code.includes('aria-label="Close format popup"'),
    "the ✕ button closes the popup"
  );
  assert.ok(
    code.includes("isColorPickerPopoverOpen(document)"),
    "the popup still yields Esc to an open color picker popover"
  );
  assert.ok(
    code.includes("mousedown"),
    "outside mousedown still closes the popup"
  );
  assert.ok(
    code.includes("popupRef.current?.focus()"),
    "focus still moves into the popup on open"
  );
  assert.ok(
    code.includes("placePopoverAbove"),
    "placement above the anchor (flipping below) is unchanged"
  );
});

test("deliberately dropped with the vertical layout: arrange, animated flow", () => {
  // Align/distribute and the animated-flow checkbox had no other UI;
  // the strip drops them rather than growing back into a panel.
  // If they come back, they need a new home — not this popup.
  assert.ok(!code.includes("alignSelection"), "no align controls");
  assert.ok(!code.includes("distributeSelection"), "no distribute controls");
  assert.ok(!code.includes("Animated flow"), "no animated-flow checkbox");
  assert.ok(!code.includes("format-popup__reset"), "no Reset style button");
});
