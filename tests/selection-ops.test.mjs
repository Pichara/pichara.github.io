import test from "node:test";
import assert from "node:assert/strict";
import {
  alignNodes,
  cloneSelection,
  distributeNodes,
  expandToDescendants,
  pruneDanglingEdges,
  removeSelection,
  snapshotSelection,
} from "../src/PicharaStudio/utils/selection-ops.ts";

/** Minimal shape node for the pure helpers (width/height explicit). */
function node(id, x, y, { selected = false, width = 100, height = 60, parentId, type = "shape-rectangle" } = {}) {
  return {
    id,
    type,
    position: { x, y },
    data: { label: id, shape: "rectangle" },
    width,
    height,
    selected,
    parentId,
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

test("snapshotSelection copies a single selected edge on its own", () => {
  // No node selected — only the edge. Before the fix this snapshotted
  // nothing, so Ctrl+C with one edge selected was a no-op.
  const nodes = [node("a", 0, 0), node("b", 100, 0)];
  const snapshot = snapshotSelection(nodes, [edge("e1", "a", "b", { selected: true })]);
  assert.equal(snapshot.nodes.length, 0);
  assert.equal(snapshot.edges.length, 1);
  assert.equal(snapshot.edges[0].id, "e1");
  // The ends were not copied, so the edge keeps its original nodes:
  // pasting duplicates it between those same nodes.
  assert.equal(snapshot.edges[0].source, "a");
  assert.equal(snapshot.edges[0].target, "b");
  assert.equal(snapshot.edges[0].selected, false);
});

test("snapshotSelection copies a selected node with a selected edge to an unselected node", () => {
  const nodes = [node("a", 0, 0, { selected: true }), node("b", 100, 0)];
  const snapshot = snapshotSelection(nodes, [edge("e1", "a", "b", { selected: true })]);
  assert.equal(snapshot.nodes.length, 1);
  assert.equal(snapshot.edges.length, 1);
  assert.equal(snapshot.edges[0].source, "a");
  assert.equal(snapshot.edges[0].target, "b");
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

test("cloneSelection keeps an edge on its original nodes when its ends were not copied", () => {
  // Edge-only snapshot: no nodes to remap, so the clone keeps the
  // original source/target and lands between those same nodes.
  const snapshot = {
    nodes: [],
    edges: [edge("e1", "a", "b")],
  };
  const clones = cloneSelection(snapshot, 20, (oldId) => `${oldId}-copy`);
  assert.equal(clones.nodes.length, 0);
  assert.equal(clones.edges.length, 1);
  assert.equal(clones.edges[0].id, "e1-copy");
  assert.equal(clones.edges[0].source, "a");
  assert.equal(clones.edges[0].target, "b");
  assert.equal(clones.edges[0].selected, true);
});

test("pruneDanglingEdges drops edges whose ends are missing", () => {
  const edges = [
    edge("e1", "a", "b"),
    edge("e2", "a", "gone"),
    edge("e3", "gone", "b"),
  ];
  assert.deepEqual(
    pruneDanglingEdges(edges, new Set(["a", "b"])).map((e) => e.id),
    ["e1"]
  );
  // Nothing survives when no end exists.
  assert.deepEqual(pruneDanglingEdges(edges, new Set()), []);
  // The input is not mutated.
  assert.equal(edges.length, 3);
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

test("removeSelection drops selected nodes and edges attached to them", () => {
  const nodes = [
    node("a", 0, 0, { selected: true }),
    node("b", 100, 0),
    node("c", 200, 0),
  ];
  const edges = [edge("e1", "a", "b"), edge("e2", "b", "c")];
  const result = removeSelection(nodes, edges);
  assert.deepEqual(
    result.nodes.map((n) => n.id),
    ["b", "c"]
  );
  // e1 touched the deleted node "a", so it goes too; e2 survives.
  assert.deepEqual(
    result.edges.map((e) => e.id),
    ["e2"]
  );
});

test("removeSelection drops a selected edge even when its nodes stay", () => {
  const nodes = [node("a", 0, 0), node("b", 100, 0)];
  const edges = [edge("e1", "a", "b", { selected: true })];
  const result = removeSelection(nodes, edges);
  assert.equal(result.nodes.length, 2);
  assert.equal(result.edges.length, 0);
});

test("removeSelection with nothing selected keeps everything", () => {
  const nodes = [node("a", 0, 0), node("b", 100, 0)];
  const edges = [edge("e1", "a", "b")];
  const result = removeSelection(nodes, edges);
  assert.equal(result.nodes.length, 2);
  assert.equal(result.edges.length, 1);
});

test("snapshotSelection brings a selected group's children along", () => {
  const nodes = [
    node("g1", 0, 0, { selected: true, type: "group" }),
    node("a", 24, 24, { parentId: "g1" }),
    node("b", 100, 24, { parentId: "g1" }),
    node("c", 500, 500),
  ];
  const edges = [edge("e1", "a", "b"), edge("e2", "a", "c")];
  const snapshot = snapshotSelection(nodes, edges);
  assert.deepEqual(
    snapshot.nodes.map((n) => n.id),
    ["g1", "a", "b"]
  );
  // e1 is internal to the copied set; e2 reaches the uncopied "c".
  assert.deepEqual(
    snapshot.edges.map((e) => e.id),
    ["e1"]
  );
});

test("cloneSelection remaps a child's parentId to the cloned group", () => {
  const snapshot = {
    nodes: [
      node("g1", 0, 0, { type: "group" }),
      node("a", 24, 24, { parentId: "g1" }),
    ],
    edges: [],
  };
  const clones = cloneSelection(snapshot, 20, (oldId) => `${oldId}-copy`);
  const group = clones.nodes.find((n) => n.id === "g1-copy");
  const child = clones.nodes.find((n) => n.id === "a-copy");
  assert.equal(child.parentId, "g1-copy");
  assert.deepEqual(group.position, { x: 20, y: 20 });
  assert.deepEqual(child.position, { x: 44, y: 44 });
  // The snapshot itself is untouched, so it can be pasted again.
  assert.equal(snapshot.nodes[1].parentId, "g1");
});

test("removeSelection deletes a group together with its children", () => {
  const nodes = [
    node("g1", 0, 0, { selected: true, type: "group" }),
    node("a", 24, 24, { parentId: "g1" }),
    node("b", 100, 24, { parentId: "g1" }),
    node("c", 500, 500),
  ];
  const edges = [edge("e1", "a", "b"), edge("e2", "b", "c")];
  const result = removeSelection(nodes, edges);
  assert.deepEqual(
    result.nodes.map((n) => n.id),
    ["c"]
  );
  assert.deepEqual(result.edges, []);
});

test("expandToDescendants adds children of a grouped node", () => {
  const nodes = [
    node("g", 0, 0, { selected: true, type: "group" }),
    node("a", 10, 10, { parentId: "g" }),
    node("b", 100, 0),
  ];
  assert.deepEqual(
    [...expandToDescendants(nodes, new Set(["g"]))].sort(),
    ["a", "g"]
  );
});

test("expandToDescendants follows nested groups regardless of order", () => {
  const nodes = [
    node("child", 10, 10, { parentId: "inner" }),
    node("inner", 0, 0, { parentId: "outer" }),
    node("outer", 0, 0, { selected: true, type: "group" }),
  ];
  assert.deepEqual(
    [...expandToDescendants(nodes, new Set(["outer"]))].sort(),
    ["child", "inner", "outer"]
  );
});

test("expandToDescendants does not mutate the input set", () => {
  const nodes = [node("a", 0, 0, { parentId: "g" }), node("g", 0, 0)];
  const input = new Set(["g"]);
  assert.deepEqual(
    [...expandToDescendants(nodes, input)].sort(),
    ["a", "g"]
  );
  assert.deepEqual([...input], ["g"]);
});
