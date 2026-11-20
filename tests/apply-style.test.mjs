import test from "node:test";
import assert from "node:assert/strict";
import {
  applyEdgeStyle,
  applyNodeStyle,
  asHexColor,
  clearEdgeStyle,
  clearNodeStyle,
  edgePresentation,
  isHexColor,
  normalizeHexInput,
  resolveEdgeStyle,
  resolveNodeStyle,
} from "../src/PicharaStudio/utils/apply-style.ts";

const node = {
  id: "n1",
  type: "shape-rectangle",
  position: { x: 0, y: 0 },
  data: { label: "A", shape: "rectangle" },
};

const edge = {
  id: "e1",
  type: "default",
  source: "n1",
  target: "n2",
};

test("resolveNodeStyle fills missing fields from the defaults", () => {
  const resolved = resolveNodeStyle({ backgroundColor: "#ff0000" });
  assert.equal(resolved.backgroundColor, "#ff0000");
  assert.equal(resolved.borderColor, "#4bcc7b");
  assert.equal(resolved.borderWidth, 1);
  assert.equal(resolved.textColor, "#eafff0");
  assert.equal(resolved.fontSize, 14);
});

test("resolveNodeStyle with no overrides returns the defaults", () => {
  assert.deepEqual(resolveNodeStyle(), {
    backgroundColor: "#071a0e",
    borderColor: "#4bcc7b",
    borderWidth: 1,
    borderRadius: 8,
    textColor: "#eafff0",
    fontSize: 14,
    fontWeight: "500",
    opacity: 1,
  });
});

test("resolveEdgeStyle fills missing fields from the defaults", () => {
  const resolved = resolveEdgeStyle({ strokeWidth: 3 });
  assert.equal(resolved.strokeColor, "#4ade80");
  assert.equal(resolved.strokeWidth, 3);
  assert.equal(resolved.strokeDasharray, "");
  assert.equal(resolved.animated, false);
  assert.equal(resolved.lineType, "curved");
  assert.equal(resolved.arrow, true);
});

test("applyNodeStyle merges into data.style without mutating the node", () => {
  const styled = applyNodeStyle(node, { backgroundColor: "#00ff00" });
  assert.equal(styled.data.style?.backgroundColor, "#00ff00");
  assert.equal(node.data.style, undefined);
  const restyled = applyNodeStyle(styled, { borderWidth: 3 });
  assert.equal(restyled.data.style?.backgroundColor, "#00ff00");
  assert.equal(restyled.data.style?.borderWidth, 3);
});

test("applyEdgeStyle creates a data payload when the edge has none", () => {
  const styled = applyEdgeStyle(edge, { strokeColor: "#0000ff" });
  assert.equal(styled.data?.style?.strokeColor, "#0000ff");
  assert.equal(edge.data, undefined);
});

test("clearNodeStyle and clearEdgeStyle drop overrides but keep the rest", () => {
  const styledNode = applyNodeStyle(node, { backgroundColor: "#00ff00" });
  const clearedNode = clearNodeStyle(styledNode);
  assert.equal(clearedNode.data.style, undefined);
  assert.equal(clearedNode.data.label, "A");

  const styledEdge = applyEdgeStyle(edge, { strokeWidth: 4 });
  const clearedEdge = clearEdgeStyle(styledEdge);
  assert.equal(clearedEdge.data?.style, undefined);
  assert.equal(clearedEdge.source, "n1");
});

test("edgePresentation renders defaults as a solid green curved line with an arrow", () => {
  assert.deepEqual(edgePresentation(edge), {
    type: "default",
    style: { stroke: "#4ade80", strokeWidth: 1.5 },
    animated: false,
    markerEnd: { type: "arrowclosed", color: "#4ade80" },
    labelShowBg: true,
    labelBgStyle: { fill: "#071a0e" },
    labelStyle: { fill: "#4ade80" },
    labelBgPadding: [4, 2],
  });
});

test("edgePresentation maps dash pattern and animation", () => {
  const styled = applyEdgeStyle(edge, {
    strokeColor: "#ff0000",
    strokeWidth: 2,
    strokeDasharray: "6,4",
    animated: true,
  });
  assert.deepEqual(edgePresentation(styled), {
    type: "default",
    style: { stroke: "#ff0000", strokeWidth: 2, strokeDasharray: "6,4" },
    animated: true,
    markerEnd: { type: "arrowclosed", color: "#ff0000" },
    labelShowBg: true,
    labelBgStyle: { fill: "#071a0e" },
    labelStyle: { fill: "#ff0000" },
    labelBgPadding: [4, 2],
  });
});

test("asHexColor passes valid hex through and falls back otherwise", () => {
  assert.equal(asHexColor("#abcdef", "#ffffff"), "#abcdef");
  assert.equal(asHexColor("red", "#ffffff"), "#ffffff");
  assert.equal(asHexColor(undefined, "#ffffff"), "#ffffff");
  assert.equal(asHexColor("#fff", "#ffffff"), "#ffffff");
  assert.equal(isHexColor("#123456"), true);
  assert.equal(isHexColor("#12345"), false);
});

test("normalizeHexInput accepts hex with or without #, and the 3-digit shorthand", () => {
  assert.equal(normalizeHexInput("#06c80f"), "#06c80f");
  assert.equal(normalizeHexInput("06C80F"), "#06c80f");
  assert.equal(normalizeHexInput("  #f00  "), "#ff0000");
  assert.equal(normalizeHexInput("#ABC"), "#aabbcc");
});

test("normalizeHexInput rejects anything that is not a hex color", () => {
  assert.equal(normalizeHexInput("red"), null);
  assert.equal(normalizeHexInput("#12345"), null);
  assert.equal(normalizeHexInput("#1234567"), null);
  assert.equal(normalizeHexInput(""), null);
  assert.equal(normalizeHexInput("#gggggg"), null);
});
