import { useEffect, useRef } from "react";
import { advanceRainColumns, createRainColumns, MATRIX_GLYPHS, rainLayout } from "../lib/rain.mjs";

/**
 * Viewport-sized canvas stays fixed through the full scroll journey: a single
 * inexpensive animation, rather than thousands of DOM elements or scroll handlers.
 */
export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frameId = 0;
    let lastFrame = 0;
    let lastDraw = 0;
    let generation = 0;
    let active = true;
    let reducedMotion = motion.matches;
    let layout = rainLayout(window.innerWidth, window.innerHeight, window.innerWidth < 640);
    let columns = createRainColumns(layout);

    function resize() {
      if (!canvas || !context) return;
      layout = rainLayout(window.innerWidth, window.innerHeight, window.innerWidth < 640);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(layout.width * ratio);
      canvas.height = Math.round(layout.height * ratio);
      canvas.style.width = `${layout.width}px`;
      canvas.style.height = `${layout.height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      columns = createRainColumns(layout);
      lastFrame = 0;
      lastDraw = 0;
      generation = 0;
      paint();
    }

    function paint() {
      if (!context) return;
      context.clearRect(0, 0, layout.width, layout.height);
      context.font = `500 ${layout.fontSize}px "IBM Plex Mono", monospace`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      for (const column of columns) {
        for (let offset = 0; offset < column.trail; offset++) {
          const y = column.head - offset * layout.fontSize;
          if (y < -layout.fontSize || y > layout.height + layout.fontSize) continue;
          const fade = Math.pow(1 - offset / column.trail, 1.7);
          const alpha = (offset === 0 ? 0.64 : 0.26) * fade * column.opacity;
          context.fillStyle = `rgba(${offset === 0 ? "142,247,183" : "64,174,113"},${alpha})`;
          const glyphIndex = (column.seed + offset * 7 + generation) % MATRIX_GLYPHS.length;
          context.fillText(MATRIX_GLYPHS[glyphIndex], column.x, y);
        }
      }
    }

    function animate(timestamp: number) {
      frameId = 0;
      if (!active || document.hidden || reducedMotion) return;
      // 24 FPS desktop / 18 FPS mobile; no wasted intermediate paints.
      const interval = layout.width < 640 ? 1000 / 18 : 1000 / 24;
      if (timestamp - lastDraw >= interval) {
        const elapsed = lastFrame === 0 ? interval / 1000 : (timestamp - lastFrame) / 1000;
        advanceRainColumns(columns, elapsed, layout.height, layout.fontSize);
        generation = Math.floor(timestamp / 180);
        paint();
        lastDraw = timestamp;
        lastFrame = timestamp;
      }
      frameId = requestAnimationFrame(animate);
    }

    function start() {
      if (frameId || reducedMotion || document.hidden) return;
      lastFrame = 0;
      frameId = requestAnimationFrame(animate);
    }
    function stop() {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
    }
    function visibilityChange() {
      if (document.hidden) stop();
      else start();
    }
    function motionChange(event: MediaQueryListEvent) {
      reducedMotion = event.matches;
      if (reducedMotion) {
        stop();
        paint();
      } else start();
    }

    resize();
    start();
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", visibilityChange);
    motion.addEventListener("change", motionChange);

    return () => {
      active = false;
      stop();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibilityChange);
      motion.removeEventListener("change", motionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-canvas" aria-hidden="true" />;
}
