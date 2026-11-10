export interface RainLayout {
  width: number;
  height: number;
  fontSize: number;
  spacing: number;
  columnCount: number;
}
export interface RainColumn {
  x: number;
  head: number;
  speed: number;
  trail: number;
  opacity: number;
  seed: number;
}
export const MATRIX_GLYPHS: string;
export const MAX_COLUMNS: number;
export function rainLayout(width: number, height: number, isSmallScreen?: boolean): RainLayout;
export function createRainColumns(layout: RainLayout, random?: () => number): RainColumn[];
export function advanceRainColumns(columns: RainColumn[], seconds: number, height: number, fontSize: number): RainColumn[];
