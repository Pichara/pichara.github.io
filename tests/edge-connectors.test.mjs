import test from "node:test";
import assert from "node:assert/strict";
import {
  applyEdgeStyle,
  clearEdgeStyle,
  edgePresentation,
} from "../src/PicharaStudio/utils/apply-style.ts";

const edge = {
  id: "e1",
  type: "default",
  source: "n1",
  target: "n2",
};

const labelledEdge = {
  ...edge,
  data: { label: "depends on" },
};

test("edgePresentation maps line types to React Flow edge types", () => {
  assert.equal(edgePresentation(edge).type, "default");
  assert.equal(
    edgePresentation(applyEdgeStyle(edge, { lineType: "curved" })).type,
    "default"
  );
  assert.equal(
    edgePresentation(applyEdgeStyle(edge, { lineType: "straight" })).type,
    "straight"
  );
  assert.equal(
    edgePresentation(applyEdgeStyle(edge, { lineType: "orthogonal" })).type,
    "step"
  );
});

test("edgePresentation adds an arrowhead by default, in the line color", () => {
  assert.deepEqual(edgePresentation(edge).markerEnd, {
    type: "arrowclosed",
    color: "#4ade80",
  });
  const red = applyEdgeStyle(edge, { strokeColor: "#ff0000" });
  assert.deepEqual(edgePresentation(red).markerEnd, {
    type: "arrowclosed",
    color: "#ff0000",
  });
});

test("edgePresentation omits the arrowhead when arrow is false", () => {
  const noArrow = applyEdgeStyle(edge, { arrow: false });
  assert.equal(edgePresentation(noArrow).markerEnd, undefined);
  assert.equal("markerEnd" in edgePresentation(noArrow), false);
});

test("edgePresentation passes the data label through with a readable background", () => {
  const presented = edgePresentation(labelledEdge);
  assert.equal(presented.label, "depends on");
  assert.equal(presented.labelShowBg, true);
  assert.deepEqual(presented.labelBgStyle, { fill: "#071a0e" });
  assert.deepEqual(presented.labelBgPadding, [4, 2]);
});

test("edgePresentation renders no label for an unlabeled or blank edge", () => {
  assert.equal(edgePresentation(edge).label, undefined);
  const blank = { ...edge, data: { label: "   " } };
  assert.equal(edgePresentation(blank).label, undefined);
  assert.equal("label" in edgePresentation(blank), false);
});

test("applyEdgeStyle merges lineType and arrow without touching the label", () => {
  const styled = applyEdgeStyle(labelledEdge, {
    lineType: "orthogonal",
    arrow: false,
  });
  assert.equal(styled.data?.style?.lineType, "orthogonal");
  assert.equal(styled.data?.style?.arrow, false);
  assert.equal(styled.data?.label, "depends on");
});

test("clearEdgeStyle removes lineType and arrow overrides but keeps the label", () => {
  const styled = applyEdgeStyle(labelledEdge, {
    lineType: "straight",
    arrow: false,
  });
  const cleared = clearEdgeStyle(styled);
  assert.equal(cleared.data?.style, undefined);
  assert.equal(cleared.data?.label, "depends on");
  // Back to defaults: curved line with an arrow.
  assert.equal(edgePresentation(cleared).type, "default");
  assert.equal(edgePresentation(cleared).markerEnd?.type, "arrowclosed");
});
