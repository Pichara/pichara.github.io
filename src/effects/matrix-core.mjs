/**
 * Framework-independent model for the Matrix rain effect.
 * Each column advances in CSS-pixel cell units; only the canvas draws pixels.
 */
export const MATRIX_GLYPHS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン#$%&*+-=<>";

function clampRandom(random) {
  const value = Number(random());
  return Number.isFinite(value) ? Math.min(0.999999, Math.max(0, value)) : 0.5;
}

function speed(random) {
  return 7 + clampRandom(random) * 19;
}

export function createRainColumns(width, height, cellSize = 19, random = Math.random) {
  if (!Number.isFinite(width) || !Number.isFinite(height) ||
      !Number.isFinite(cellSize) || width <= 0 || height <= 0 || cellSize < 8) return [];

  const count = Math.min(160, Math.ceil(width / cellSize));
  const rows = Math.ceil(height / cellSize);
  return Array.from({ length: count }, (_, x) => ({
    x,
    // Populate the viewport immediately rather than waiting for heads to arrive.
    y: clampRandom(random) * (rows + 25) - 12,
    speed: speed(random),
    length: 9 + Math.floor(clampRandom(random) * 19),
    glyphOffset: Math.floor(clampRandom(random) * MATRIX_GLYPHS.length),
  }));
}

export function advanceRainColumns(columns, deltaSeconds, visibleRows, random = Math.random) {
  // Cap the elapsed time when returning from a background tab.
  const delta = Number.isFinite(deltaSeconds)
    ? Math.min(0.1, Math.max(0, deltaSeconds))
    : 0;

  for (const column of columns) {
    column.y += column.speed * delta;
    if (column.y - column.length > visibleRows) {
      column.y = -clampRandom(random) * Math.max(12, visibleRows * 0.4);
      column.speed = speed(random);
      column.length = 9 + Math.floor(clampRandom(random) * 19);
      column.glyphOffset = Math.floor(clampRandom(random) * MATRIX_GLYPHS.length);
    }
  }
  return columns;
}

export function glyphAt(column, row, tick = 0) {
  const index = Math.abs((column.glyphOffset + row * 7 + column.x * 13 + tick) | 0) %
    MATRIX_GLYPHS.length;
  return MATRIX_GLYPHS[index];
}
