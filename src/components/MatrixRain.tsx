import { useEffect, useRef } from "react";
import {
  advanceRainColumns,
  createRainColumns,
  glyphAt,
} from "../effects/matrix-core.mjs";

type MatrixRainProps = {
  enabled: boolean;
};

/**
 * Full-viewport background: stays visible as the page scrolls, with no network
 * requests or canvas interaction. Rendering is capped for battery/performance.
 */
export default function MatrixRain({ enabled }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const compact = window.matchMedia("(max-width: 640px)").matches;
    const fontSize = compact ? 19 : 18;
    const frameInterval = compact ? 50 : 33; // 20fps on mobile, 30fps elsewhere.
    const green = ["#00b344", "#00df56", "#21ff72", "#8cffad"];
    let columns = createRainColumns(window.innerWidth, window.innerHeight, fontSize);
    let rows = 0;
    let raf = 0;
    let lastTime = 0;
    let lastPaint = 0;
    let tick = 0;
    let disposed = false;

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = "#030b07";
      context.fillRect(0, 0, width, height);
      context.font = `600 ${fontSize}px "IBM Plex Mono", monospace`;
      context.textBaseline = "top";
      rows = Math.ceil(height / fontSize);
      columns = createRainColumns(width, height, fontSize);
    };

    const paint = (now: number) => {
      if (disposed) return;
      raf = window.requestAnimationFrame(paint);
      if (document.hidden || media.matches) {
        lastTime = now;
        return;
      }
      if (now - lastPaint < frameInterval) return;

      const delta = lastTime ? (now - lastTime) / 1000 : frameInterval / 1000;
      lastPaint = now;
      lastTime = now;
      tick++;

      context.fillStyle = "rgba(3, 11, 7, 0.21)";
      context.fillRect(0, 0, window.innerWidth, window.innerHeight);
      context.font = `600 ${fontSize}px "IBM Plex Mono", monospace`;
      advanceRainColumns(columns, delta, rows);

      for (const column of columns) {
        const head = Math.floor(column.y);
        for (let tail = column.length; tail >= 0; tail--) {
          const row = head - tail;
          if (row < 0 || row > rows) continue;
          const fraction = 1 - tail / (column.length + 1);
          context.globalAlpha = 0.1 + fraction * 0.9;
          context.fillStyle = tail === 0 ? "#ddffe6" : green[(column.x + tail) % green.length];
          context.fillText(
            glyphAt(column, row, Math.floor(tick / 3)),
            column.x * fontSize,
            row * fontSize
          );
        }
      }
      context.globalAlpha = 1;
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    raf = window.requestAnimationFrame(paint);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [enabled]);

  return <canvas ref={canvasRef} className="matrix-rain" aria-hidden="true" />;
}
