/**
 * MatrixRainCorners — digital-rain accents in the four corners of the
 * canvas, echoing the portfolio's Matrix rain without importing
 * portfolio code (the Studio module boundary forbids importing from
 * src/components/ or src/effects/).
 *
 * A lightweight canvas overlay (pointer-events none, above the diagram
 * pane but below controls/minimap and the floating selection bar) that
 * draws a few falling katakana columns inside a small patch at each
 * corner, fading toward the center so the work area stays clean. The
 * animation pauses when the tab is hidden and renders nothing under
 * prefers-reduced-motion, matching the portfolio's behavior.
 */

import { useEffect, useRef } from "react";

/** Glyph pool for the falling columns (katakana + digits). */
const GLYPHS = "アイウエオカキクケコサシスセソタチツテト0123456789";

/** Horizontal gap between rain columns, in CSS pixels. */
const COLUMN_GAP = 18;

/** Glyph height, in CSS pixels. */
const FONT_SIZE = 14;

/** Glyphs drawn behind each column head. */
const TRAIL_LENGTH = 9;

/** Corner patch size, in CSS pixels. */
const PATCH_WIDTH = 220;
const PATCH_HEIGHT = 180;

/** Frame interval (~20 fps): slow enough to stay a subtle accent. */
const FRAME_MS = 50;

function randomChar(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

interface RainColumn {
  /** Column x (CSS px, relative to the canvas). */
  x: number;
  /** Head y (CSS px). Falls from patchTop toward patchBottom. */
  y: number;
  /** Fall speed, in CSS px per frame. */
  speed: number;
  /** Glyphs of the trail, head first. */
  chars: string[];
  /** Top of this column's corner patch. */
  patchTop: number;
  /** Bottom of this column's corner patch. */
  patchBottom: number;
  /** Base alpha: brighter near the outer corner, fading inward. */
  alpha: number;
}

/** Build one column per COLUMN_GAP inside the four corner patches. */
function buildColumns(width: number, height: number): RainColumn[] {
  const columns: RainColumn[] = [];
  const patches = [
    { left: 8, top: 8 },
    { left: width - PATCH_WIDTH - 8, top: 8 },
    { left: 8, top: height - PATCH_HEIGHT - 8 },
    { left: width - PATCH_WIDTH - 8, top: height - PATCH_HEIGHT - 8 },
  ];
  for (const patch of patches) {
    const patchTop = patch.top;
    const patchBottom = patch.top + PATCH_HEIGHT;
    for (
      let x = patch.left;
      x < patch.left + PATCH_WIDTH;
      x += COLUMN_GAP
    ) {
      // Fade from the outer edge (bright) toward the canvas center.
      const inward =
        patch.left < width / 2
          ? (x - patch.left) / PATCH_WIDTH
          : (patch.left + PATCH_WIDTH - x) / PATCH_WIDTH;
      columns.push({
        x,
        y: patchTop + Math.random() * PATCH_HEIGHT,
        speed: 1 + Math.random() * 1.6,
        chars: Array.from({ length: TRAIL_LENGTH }, randomChar),
        patchTop,
        patchBottom,
        alpha: 0.75 - inward * 0.5,
      });
    }
  }
  return columns;
}

export default function MatrixRainCorners() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const parent = canvas.parentElement;
    if (parent === null) return;
    const context = canvas.getContext("2d");
    if (context === null) return;

    let columns: RainColumn[] = [];
    let rafId = 0;
    let lastFrame = 0;

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      columns = buildColumns(rect.width, rect.height);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    const draw = (now: number) => {
      rafId = requestAnimationFrame(draw);
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;
      if (document.hidden) return;
      const rect = parent.getBoundingClientRect();
      context.clearRect(0, 0, rect.width, rect.height);
      context.font = `${FONT_SIZE}px "IBM Plex Mono", monospace`;
      context.textAlign = "left";
      context.textBaseline = "top";
      for (const column of columns) {
        column.y += column.speed;
        if (column.y - TRAIL_LENGTH * FONT_SIZE > column.patchBottom) {
          column.y = column.patchTop - Math.random() * 80;
          column.chars = Array.from(
            { length: TRAIL_LENGTH },
            randomChar
          );
        }
        // Occasionally mutate a trail glyph, like the real rain.
        if (Math.random() < 0.1) {
          const index = Math.floor(Math.random() * TRAIL_LENGTH);
          column.chars[index] = randomChar();
        }
        for (let i = 0; i < TRAIL_LENGTH; i += 1) {
          const glyphY = column.y - i * FONT_SIZE;
          if (glyphY < column.patchTop - FONT_SIZE) continue;
          if (glyphY > column.patchBottom) continue;
          const fade = 1 - i / TRAIL_LENGTH;
          context.globalAlpha = column.alpha * fade;
          context.fillStyle = i === 0 ? "#b3ffd2" : "#4ade80";
          context.fillText(column.chars[i], column.x, glyphY);
        }
      }
      context.globalAlpha = 1;
    };
    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, []);

  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return null;
  }

  return (
    <div className="matrix-rain-corners" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
