import test from "node:test";
import assert from "node:assert/strict";
import {
  MATRIX_GLYPHS,
  createRainColumns,
  advanceRainColumns,
  glyphAt,
} from "../src/effects/matrix-core.mjs";

test("creates dense columns sized to the full viewport", () => {
  const columns = createRainColumns(1366, 900, 19, () => 0.5);
  assert.equal(columns.length, 72);
  assert.deepEqual(columns.map(({ x }) => x), Array.from({ length: 72 }, (_, i) => i));
  assert.ok(columns.every(({ y, speed, length }) => y < 0 && speed > 0 && length >= 9));
});

test("caps density and rejects invalid dimensions", () => {
  assert.equal(createRainColumns(-2, 500).length, 0);
  assert.equal(createRainColumns(100, 0).length, 0);
  assert.equal(createRainColumns(100000, 1000).length, 160);
});

test("advances at a bounded speed after a suspended tab resumes", () => {
  const columns = createRainColumns(200, 300, 20, () => 0.5);
  const previous = columns[0].y;
  advanceRainColumns(columns, 120, 20, () => 0.5);
  assert.ok(columns[0].y - previous <= columns[0].speed * 0.101);
  advanceRainColumns(columns, -5, 20);
  assert.ok(columns[0].y >= previous);
});

test("recycles columns after they leave the viewport", () => {
  const columns = createRainColumns(200, 300, 20, () => 0.25);
  columns[0].y = 100;
  advanceRainColumns(columns, 0.04, 15, () => 0.3);
  assert.ok(columns[0].y <= 0);
});

test("produces only valid Matrix glyphs", () => {
  const columns = createRainColumns(300, 300);
  for (let index = -5; index < 60; index++) {
    assert.ok(MATRIX_GLYPHS.includes(glyphAt(columns[0], index, index)));
  }
});
