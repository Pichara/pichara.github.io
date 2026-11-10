export interface RainColumn {
  x: number;
  y: number;
  speed: number;
  length: number;
  glyphOffset: number;
}

export const MATRIX_GLYPHS: string;
export function createRainColumns(
  width: number,
  height: number,
  cellSize?: number,
  random?: () => number
): RainColumn[];
export function advanceRainColumns(
  columns: RainColumn[],
  deltaSeconds: number,
  visibleRows: number,
  random?: () => number
): RainColumn[];
export function glyphAt(column: RainColumn, row: number, tick?: number): string;
