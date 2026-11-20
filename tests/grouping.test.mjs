import test from "node:test";
import assert from "node:assert/strict";
import {
  absoluteNodePosition,
  groupNodes,
  ungroupNodes,
} from "../src/PicharaStudio/utils/grouping.ts";
import { GROUP_PADDING } from "../src/PicharaStudio/constants/defaults.ts";

/** Minimal shape node for the pure helpers (width/height explicit). */
function node(id, x, y, options = {}) {
  return {
    id,
    type: options.type ?? "shape-rectangle",
    position: { x, y },
    data: { label: id, shape: "rectangle" },
    width: options.width ?? 100,
    height: options.height ?? 60,
    selected: options.selected ?? false,
    parentId: options.parentId,
  };
}

test("groupNodes wraps the selection bounds plus padding and relativizes members", () => {
  const nodes = [
    node("a", 0, 0, { selected: true }),
    node("b", 200, 100, { selected: true }),
    node("c", 500, 500),
  ];
  const grouped = groupNodes(nodes, "g1", "Group");
  assert.notEqual(grouped, null);
  const group = grouped.find((candidate) => candidate.id === "g1");
  assert.equal(group.type, "group");
  assert.deepEqual(group.position, {
    x: -GROUP_PADDING,
    y: -GROUP_PADDING,
  });
  assert.equal(group.width, 300 + GROUP_PADDING * 2);
  assert.equal(group.height, 160 + GROUP_PADDING * 2);
  assert.equal(group.selected, true);
  const a = grouped.find((candidate) => candidate.id === "a");
  assert.equal(a.parentId, "g1");
  assert.deepEqual(a.position, { x: GROUP_PADDING, y: GROUP_PADDING });
  assert.equal(a.selected, false);
  const b = grouped.find((candidate) => candidate.id === "b");
  assert.equal(b.parentId, "g1");
  assert.deepEqual(b.position, {
    x: 200 + GROUP_PADDING,
    y: 100 + GROUP_PADDING,
  });
  const c = grouped.find((candidate) => candidate.id === "c");
  assert.equal(c.parentId, undefined);
  assert.deepEqual(c.position, { x: 500, y: 500 });
  assert.equal(c.selected, false);
});

test("groupNodes returns null with fewer than two top-level nodes selected", () => {
  const onlyOne = [node("a", 0, 0, { selected: true }), node("b", 100, 0)];
  assert.equal(groupNodes(onlyOne, "g1", "Group"), null);
  // Two selected, but one already lives inside a group: only one qualifies.
  const childSelected = [
    node("a", 0, 0, { selected: true }),
    node("b", 100, 0, { selected: true, parentId: "g0" }),
    node("g0", -50, -50, { type: "group" }),
  ];
  assert.equal(groupNodes(childSelected, "g1", "Group"), null);
});

test("groupNodes does not mutate its input", () => {
  const nodes = [
    node("a", 0, 0, { selected: true }),
    node("b", 200, 100, { selected: true }),
  ];
  const before = JSON.stringify(nodes);
  groupNodes(nodes, "g1", "Group");
  assert.equal(JSON.stringify(nodes), before);
});

test("ungroupNodes removes the group and absolutizes its children", () => {
  const nodes = [
    node("a", GROUP_PADDING, GROUP_PADDING, { parentId: "g1" }),
    node("b", 200 + GROUP_PADDING, 100 + GROUP_PADDING, {
      parentId: "g1",
    }),
    node("g1", -GROUP_PADDING, -GROUP_PADDING, {
      type: "group",
      width: 300 + GROUP_PADDING * 2,
      height: 160 + GROUP_PADDING * 2,
      selected: true,
    }),
    node("c", 500, 500),
  ];
  const ungrouped = ungroupNodes(nodes, ["g1"]);
  assert.notEqual(ungrouped, null);
  assert.equal(
    ungrouped.some((candidate) => candidate.id === "g1"),
    false
  );
  const a = ungrouped.find((candidate) => candidate.id === "a");
  assert.equal(a.parentId, undefined);
  assert.deepEqual(a.position, { x: 0, y: 0 });
  assert.equal(a.selected, true);
  const b = ungrouped.find((candidate) => candidate.id === "b");
  assert.deepEqual(b.position, { x: 200, y: 100 });
  const c = ungrouped.find((candidate) => candidate.id === "c");
  assert.deepEqual(c.position, { x: 500, y: 500 });
  assert.equal(c.selected, false);
});

test("ungroupNodes returns null for an empty or unknown group list", () => {
  const nodes = [node("a", 0, 0), node("g1", 0, 0, { type: "group" })];
  assert.equal(ungroupNodes(nodes, []), null);
  assert.equal(ungroupNodes(nodes, ["nope"]), null);
});

test("absoluteNodePosition walks the parent chain", () => {
  const nodes = [
    node("a", 10, 20, { parentId: "g1" }),
    node("g1", 100, 200, { type: "group", parentId: "g2" }),
    node("g2", 1000, 2000, { type: "group" }),
  ];
  const byId = new Map(nodes.map((candidate) => [candidate.id, candidate]));
  assert.deepEqual(absoluteNodePosition(nodes[0], byId), {
    x: 1110,
    y: 2220,
  });
  assert.deepEqual(absoluteNodePosition(nodes[2], byId), {
    x: 1000,
    y: 2000,
  });
  // Orphaned child (parent missing) keeps its position as-is.
  const orphan = node("o", 5, 5, { parentId: "gone" });
  assert.deepEqual(absoluteNodePosition(orphan, byId), { x: 5, y: 5 });
});

test("group then ungroup round-trips the members to their exact spots", () => {
  const nodes = [
    node("a", 30, 40, { selected: true }),
    node("b", 250, 90, { selected: true }),
  ];
  const grouped = groupNodes(nodes, "g1", "Group");
  assert.notEqual(grouped, null);
  const selectedGroup = grouped.map((candidate) =>
    candidate.id === "g1"
      ? { ...candidate, selected: true }
      : candidate
  );
  const ungrouped = ungroupNodes(selectedGroup, ["g1"]);
  assert.notEqual(ungrouped, null);
  assert.deepEqual(
    ungrouped.map((candidate) => [candidate.id, candidate.position]),
    [
      ["a", { x: 30, y: 40 }],
      ["b", { x: 250, y: 90 }],
    ]
  );
});
