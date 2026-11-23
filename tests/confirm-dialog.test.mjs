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
    "../src/PicharaStudio/components/dialogs/ConfirmDialog.tsx",
    import.meta.url
  ),
  "utf8"
);

/**
 * Every declaration block whose selector mentions `className` — the
 * shared backdrop rule groups the library and confirm selectors, so a
 * class can appear in more than one block.
 */
function blocksFor(source, className) {
  // Strip comments first: notes above the rules mention the class
  // names, which must not leak into the selector text.
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

/** Merge every declaration for a class into one property map. */
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

test("confirm backdrop is vertically centred in the viewport", () => {
  const declarations = declarationsFor(css, ".confirm-dialog__backdrop");
  assert.equal(
    declarations.get("align-items"),
    "center",
    "confirm backdrop must centre the dialog vertically"
  );
  assert.equal(
    declarations.get("justify-content"),
    "center",
    "confirm backdrop must centre the dialog horizontally"
  );
  // Even padding on all sides, so the centring is true to the viewport
  // and not offset towards the top like the library dialog's 64px.
  assert.equal(
    declarations.get("padding"),
    "16px",
    "confirm backdrop padding must be even on all sides"
  );
});

test("confirm backdrop reuses the library dialog's dimming", () => {
  const confirm = declarationsFor(css, ".confirm-dialog__backdrop");
  const library = declarationsFor(css, ".diagram-library-dialog__backdrop");
  for (const [property, value] of [
    ["position", "fixed"],
    ["inset", "0"],
    ["background", "rgba(1, 6, 4, 0.72)"],
    ["z-index", "50"],
  ]) {
    assert.equal(
      confirm.get(property),
      value,
      `confirm backdrop ${property} must match the library dialog`
    );
    assert.equal(
      library.get(property),
      value,
      `library backdrop ${property} must stay ${value}`
    );
  }
});

test("library backdrop stays top-anchored (confirm fix must not move it)", () => {
  const library = declarationsFor(css, ".diagram-library-dialog__backdrop");
  assert.equal(library.get("align-items"), "flex-start");
  assert.equal(library.get("padding"), "64px 16px 16px");
});

test("ConfirmDialog renders on its centred backdrop, in a portal", () => {
  assert.ok(
    tsx.includes('className="confirm-dialog__backdrop"'),
    "ConfirmDialog must use the centred confirm backdrop"
  );
  assert.ok(
    !tsx.includes('className="diagram-library-dialog__backdrop"'),
    "ConfirmDialog must not use the top-anchored library backdrop"
  );
  assert.ok(
    tsx.includes("createPortal(") && tsx.includes("document.body"),
    "ConfirmDialog must stay portaled to document.body"
  );
});

test("ConfirmDialog keeps its cancel behaviour and Cancel initial focus", () => {
  assert.ok(
    tsx.includes('onClick={onCancel}') && tsx.includes('role="presentation"'),
    "backdrop click must still cancel"
  );
  assert.ok(
    tsx.includes('event.key === "Escape"'),
    "Esc must still cancel"
  );
  assert.ok(
    tsx.includes('aria-label="Cancel"'),
    "✕ button must still cancel"
  );
  assert.ok(
    tsx.includes("autoFocus"),
    "Cancel must still start focused, so Enter never confirms by accident"
  );
  assert.ok(
    tsx.includes("trapTab"),
    "Tab must still be trapped inside the dialog"
  );
});
