/** Deterministic, dependency-free geometry for the digital-rain canvas. */
export const MATRIX_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/{}[]=+*#";
export const MAX_COLUMNS = 76;

export function rainLayout(width, height, isSmallScreen = false) {
  const safeWidth = Math.max(1, Number.isFinite(width) ? width : 1);
  const safeHeight = Math.max(1, Number.isFinite(height) ? height : 1);
  const fontSize = isSmallScreen ? 13 : 15;
  const spacing = isSmallScreen ? 29 : 31;
  return {
    width: safeWidth,
    height: safeHeight,
    fontSize,
    spacing,
    columnCount: Math.min(MAX_COLUMNS, Math.max(1, Math.ceil(safeWidth / spacing)))
  };
}

export function createRainColumns(layout, random = Math.random) {
  const columns = [];
  for (let index = 0; index < layout.columnCount; index++) {
    // Uneven density and speeds make the rain organic, not a uniform grid.
    if (random() < 0.22) continue;
    const trail = 8 + Math.floor(random() * 15);
    columns.push({
      x: index * layout.spacing + layout.spacing / 2,
      head: random() * (layout.height + trail * layout.fontSize) - trail * layout.fontSize,
      speed: 20 + random() * 46,
      trail,
      opacity: 0.35 + random() * 0.65,
      seed: Math.floor(random() * MATRIX_GLYPHS.length)
    });
  }
  return columns;
}

export function advanceRainColumns(columns, seconds, height, fontSize) {
  const elapsed = Math.min(0.1, Math.max(0, Number.isFinite(seconds) ? seconds : 0));
  for (const column of columns) {
    column.head += column.speed * elapsed;
    if (column.head - column.trail * fontSize > height) {
      column.head = -column.trail * fontSize;
    }
  }
  return columns;
}
