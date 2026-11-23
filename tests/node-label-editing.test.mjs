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
  new URL("../src/PicharaStudio/nodes/base/BaseShapeNode.tsx", import.meta.url),
  "utf8"
);

/**
 * Every declaration block whose selector mentions
 * `.shape-node__label-input` — the base rule and the `:focus` /
 * `:focus-visible` rule.
 */
function labelInputBlocks(source) {
  // Strip comments first: the note above the rule mentions `:focus`,
  // which must not leak into the selector text.
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = rulePattern.exec(withoutComments)) !== null) {
    if (match[1].includes(".shape-node__label-input")) {
      blocks.push({ selector: match[1].trim(), body: match[2] });
    }
  }
  return blocks;
}

/** Split a rule body into `[property, value]` pairs. */
function declarations(body) {
  return body
    .split(";")
    .map((part) => part.split(":").map((piece) => piece.trim()))
    .filter(([property, value]) => property !== "" && value !== undefined);
}

const BOX_FREE = ["none", "0", "0px"];

test("label editor has no box chrome in any state (base and focus)", () => {
  const blocks = labelInputBlocks(css);
  assert.ok(blocks.length >= 2, "expected a base and a focus rule");
  assert.ok(
    blocks.some((block) => !block.selector.includes(":")),
    "expected a base .shape-node__label-input rule"
  );
  assert.ok(
    blocks.some(
      (block) =>
        block.selector.includes(":focus") ||
        block.selector.includes(":focus-visible")
    ),
    "expected an explicit :focus / :focus-visible rule so focus stays box-free"
  );

  for (const block of blocks) {
    for (const [property, value] of declarations(block.body)) {
      const prop = property.toLowerCase();
      const val = value.toLowerCase();
      if (prop === "border" || prop.startsWith("border-")) {
        // border-radius: 0 is not chrome; any other border-* must be off.
        if (prop === "border-radius") {
          assert.equal(val, "0", `${block.selector} border-radius`);
        } else {
          assert.ok(
            BOX_FREE.includes(val),
            `${block.selector} must not draw a border (${prop}: ${val})`
          );
        }
      } else if (prop === "background" || prop === "background-color") {
        assert.ok(
          val === "transparent" || val === "none",
          `${block.selector} must stay transparent (${prop}: ${val})`
        );
      } else if (prop === "box-shadow") {
        assert.equal(val, "none", `${block.selector} must not cast a shadow`);
      } else if (prop === "outline") {
        assert.equal(val, "none", `${block.selector} must not draw an outline`);
      } else if (prop === "outline-offset") {
        assert.ok(
          BOX_FREE.includes(val),
          `${block.selector} outline-offset must be 0`
        );
      }
    }
  }
});

test("label editor inherits the label's typography from the node style", () => {
  const textarea = tsx.slice(tsx.indexOf("<textarea"), tsx.indexOf("/>", tsx.indexOf("<textarea")));
  assert.ok(textarea.includes("<textarea"), "expected a textarea editor");
  for (const field of ["style.textColor", "style.fontSize", "style.fontWeight"]) {
    assert.ok(
      textarea.includes(field),
      `editor must style itself with ${field}, like the label`
    );
  }
  // The label span must keep using the same fields, so the two stay in sync.
  const label = tsx.slice(tsx.indexOf('className="shape-node__label"'));
  for (const field of ["style.textColor", "style.fontSize", "style.fontWeight"]) {
    assert.ok(label.includes(field), `label must style itself with ${field}`);
  }
});
