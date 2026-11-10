import test from "node:test";
import assert from "node:assert/strict";
import { rainLayout, createRainColumns, advanceRainColumns, MATRIX_GLYPHS, MAX_COLUMNS } from "../src/lib/rain.mjs";

test("responsive grid is bounded on mobile and ultra-wide monitors", () => {
  assert.ok(rainLayout(375, 700, true).columnCount < 20);
  assert.equal(rainLayout(100000, 800).columnCount, MAX_COLUMNS);
  assert.equal(rainLayout(-1, NaN).columnCount, 1);
});

test("rain streams have bounded parameters and numeric coordinates", () => {
  const layout = rainLayout(1440, 900);
  const columns = createRainColumns(layout, () => 0.5);
  assert.ok(columns.length > 0);
  for (const column of columns) {
    assert.ok(column.trail >= 8 && column.trail <= 22);
    assert.ok(column.speed >= 20 && column.speed <= 66);
    assert.ok(Number.isFinite(column.head));
    assert.ok(column.x <= layout.width + layout.spacing);
  }
  assert.ok(MATRIX_GLYPHS.includes("A"));
});

test("time steps are clamped so resuming a hidden tab cannot fast-forward", () => {
  const columns = [{ x: 0, head: 0, speed: 60, trail: 10, opacity: 1, seed: 0 }];
  advanceRainColumns(columns, 100, 900, 15);
  assert.equal(columns[0].head, 6);
  advanceRainColumns(columns, -10, 900, 15);
  assert.equal(columns[0].head, 6);
});

test("completed streams reset offscreen instead of growing forever", () => {
  const columns = [{ x: 0, head: 500, speed: 60, trail: 10, opacity: 1, seed: 0 }];
  advanceRainColumns(columns, 0.1, 200, 15);
  assert.equal(columns[0].head, -150);
});
