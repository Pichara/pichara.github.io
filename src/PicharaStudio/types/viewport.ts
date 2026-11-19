/**
 * Viewport — Camera position and zoom level for the diagram canvas.
 */

export interface Viewport {
  /** Horizontal pan offset in canvas units. */
  x: number;

  /** Vertical pan offset in canvas units. */
  y: number;

  /**
   * Zoom level.
   * 1.0 = 100% (actual size).
   * Values > 1.0 zoom in, < 1.0 zoom out.
   */
  zoom: number;
}
