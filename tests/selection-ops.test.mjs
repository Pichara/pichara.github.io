import test from "node:test";
import assert from "node:assert/strict";
import {
  alignNodes,
  cloneSelection,
  distributeNodes,
  snapshotSelection,
} from "../src/PicharaStudio/utils/selection-ops.ts";

/** Minimal shape node for the pure helpers (width/height explicit). */
function node(id, x, y, { selected = false, width = 100, height = 60 } = {}) {
  return {
    id,
    type: "shape-rectangle",
    position: { x, y },
    data: { label: id, shape: "rectangle" },
    width,
    height,
    selected,
  };
}

function edge(id, source, target, { selected = false } = {}) {
  return { id, type: "default", source, target, selected };
}

test("snapshotSelection copies selected nodes and only internal edges", () => {
  const nodes = [node("a", 0, 0, { selected: true }), node("b", 100, 0)];
  const edges = [edge("e1", "a", "b"), edge("e2", "b", "b")];
  const snapshot = snapshotSelection(nodes, edges);
  assert.equal(snapshot.nodes.length, 1);
  assert.equal(snapshot.nodes[0].id, "a");
  assert.equal(snapshot.nodes[0].selected, false);
  // Both edges touch the unselected node "b", so neither is internal.
  assert.equal(snapshot.edges.length, 0);
});

test("snapshotSelection keeps edges whose both ends are selected", () => {
  const nodes = [
    node("a", 0, 0, { selected: true }),
    node("b", 100, 0, { selected: true }),
  ];
  const snapshot = snapshotSelection(nodes, [edge("e1", "a", "b")]);
  assert.equal(snapshot.edges.length, 1);
  assert.equal(snapshot.edges[0].id, "e1");
});

test("snapshotSelection deep-copies node style", () => {
  const original = node("a", 0, 0, { selected: true });
  original.data.style = { backgroundColor: "#ff0000" };
  const snapshot = snapshotSelection([original], []);
  snapshot.nodes[0].data.style.backgroundColor = "#00ff00";
  assert.equal(original.data.style.backgroundColor, "#ff0000");
});

test("cloneSelection offsets positions, remaps ids and selects the clones", () => {
  const snapshot = {
    nodes: [node("a", 10, 20), node("b", 100, 20)],
    edges: [edge("e1", "a", "b")],
  };
  const clones = cloneSelection(snapshot, 20, (oldId) => `${oldId}-copy`);
  assert.deepEqual(
    clones.nodes.map((n) => n.id),
    ["a-copy", "b-copy"]
  );
  assert.deepEqual(
    clones.nodes.map((n) => n.position),
    [
      { x: 30, y: 40 },
      { x: 120, y: 40 },
    ]
  );
  assert.ok(clones.nodes.every((n) => n.selected));
  assert.equal(clones.edges[0].id, "e1-copy");
  assert.equal(clones.edges[0].source, "a-copy");
  assert.equal(clones.edges[0].target, "b-copy");
  // The snapshot itself is untouched, so it can be pasted again.
  assert.equal(snapshot.nodes[0].position.x, 10);
});

test("alignNodes aligns left edges", () => {
  const moves = alignNodes(
    [node("a", 10, 0), node("b", 50, 100)],
    "left"
  );
  assert.deepEqual(
    moves.map((move) => [move.id, move.position.x]),
    [
      ["a", 10],
      ["b", 10],
    ]
  );
});

test("alignNodes centers horizontally on the selection midline", () => {
  // A spans 0..100 (center 50), B spans 200..260 (center 230);
  // midline is 130, so A moves to x=80 and B to x=100.
  const moves = alignNodes(
    [node("a", 0, 0, { width: 100 }), node("b", 200, 0, { width: 60 })],
    "center-x"
  );
  assert.deepEqual(
    moves.map((move) => [move.id, move.position.x]),
    [
      ["a", 80],
      ["b", 100],
    ]
  );
});

test("alignNodes aligns right edges", () => {
  const moves = alignNodes(
    [node("a", 0, 0, { width: 100 }), node("b", 200, 0, { width: 60 })],
    "right"
  );
  assert.deepEqual(
    moves.map((move) => [move.id, move.position.x]),
    [
      ["a", 160],
      ["b", 200],
    ]
  );
});

test("alignNodes aligns top, middle and bottom vertically", () => {
  const nodes = [
    node("a", 0, 10, { height: 60 }),
    node("b", 0, 100, { height: 40 }),
  ];
  assert.deepEqual(
    alignNodes(nodes, "top").map((move) => move.position.y),
    [10, 10]
  );
  assert.deepEqual(
    alignNodes(nodes, "bottom").map((move) => move.position.y),
    [80, 100]
  );
  // Midline is (10 + 140) / 2 = 75: A centers at 75 - 30 = 45,
  // B centers at 75 - 20 = 55.
  assert.deepEqual(
    alignNodes(nodes, "center-y").map((move) => move.position.y),
    [45, 55]
  );
});

test("alignNodes returns no moves for fewer than two nodes", () => {
  assert.deepEqual(alignNodes([], "left"), []);
  assert.deepEqual(alignNodes([node("a", 0, 0)], "left"), []);
});

test("distributeNodes spaces centers evenly and keeps the outer nodes put", () => {
  // Centers at 50, 150 and 350; even spacing is 150, so the middle
  // node moves from center 150 to center 200 (x=150).
  const nodes = [
    node("a", 0, 0),
    node("b", 100, 0),
    node("c", 300, 0),
  ];
  const moves = distributeNodes(nodes, "horizontal");
  assert.deepEqual(
    moves.map((move) => [move.id, move.position.x]),
    [
      ["a", 0],
      ["b", 150],
      ["c", 300],
    ]
  );
});

test("distributeNodes works vertically and regardless of input order", () => {
  const nodes = [
    node("c", 0, 300),
    node("a", 0, 0),
    node("b", 0, 100),
  ];
  const moves = distributeNodes(nodes, "vertical");
  assert.deepEqual(
    moves.map((move) => [move.id, move.position.y]),
    [
      ["a", 0],
      ["b", 150],
      ["c", 300],
    ]
  );
});

test("distributeNodes returns no moves for fewer than three nodes", () => {
  assert.deepEqual(distributeNodes([], "horizontal"), []);
  assert.deepEqual(
    distributeNodes([node("a", 0, 0), node("b", 100, 0)], "horizontal"),
    []
  );
});
