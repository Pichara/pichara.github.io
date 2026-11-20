import test from "node:test";
import assert from "node:assert/strict";
import { TEMPLATES, getTemplate } from "../src/PicharaStudio/services/templates.ts";
import { validateDiagram } from "../src/PicharaStudio/services/persistence.ts";

test("every template builds a valid diagram", () => {
  assert.ok(TEMPLATES.length >= 2, "expected at least two templates");
  for (const template of TEMPLATES) {
    assert.equal(typeof template.id, "string");
    assert.notEqual(template.id, "");
    assert.equal(typeof template.name, "string");
    assert.notEqual(template.name, "");
    assert.equal(typeof template.description, "string");
    assert.notEqual(template.description, "");
    const diagram = template.build();
    assert.notEqual(validateDiagram(diagram), null);
    assert.equal(diagram.name, template.name);
    assert.equal(diagram.diagramType, template.diagramType);
    assert.ok(diagram.nodes.length > 0, `${template.id} has no nodes`);
    assert.ok(diagram.edges.length > 0, `${template.id} has no edges`);
  }
});

test("template edges only connect nodes that exist", () => {
  for (const template of TEMPLATES) {
    const diagram = template.build();
    const nodeIds = new Set(diagram.nodes.map((node) => node.id));
    for (const edge of diagram.edges) {
      assert.ok(nodeIds.has(edge.source), `${template.id}: missing source`);
      assert.ok(nodeIds.has(edge.target), `${template.id}: missing target`);
    }
  }
});

test("template builds get fresh ids every time", () => {
  const first = TEMPLATES[0].build();
  const second = TEMPLATES[0].build();
  assert.notEqual(first.id, second.id);
  const firstNodeIds = new Set(first.nodes.map((node) => node.id));
  for (const node of second.nodes) {
    assert.ok(!firstNodeIds.has(node.id), "node id reused across builds");
  }
});

test("getTemplate finds a template by id and misses unknown ids", () => {
  assert.equal(getTemplate("flowchart")?.name, "Basic flowchart");
  assert.equal(getTemplate("system-design")?.name, "Simple system design");
  assert.equal(getTemplate("no-such-template"), undefined);
});
