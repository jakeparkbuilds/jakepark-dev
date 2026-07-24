"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { CursorPoint } from "../../lib/cursor/useCursorState";

export type InkCanvasHandle = {
  startDrag: () => void;
  addPoint: (point: CursorPoint, suspended: boolean) => void;
  endDrag: () => void;
  registerClick: (point: CursorPoint, suppress: boolean) => void;
};

const INK = "#1A1815";
const MAX_DPR = 2;
const TRAIL_ALPHA = 0.55;
const TRAIL_FADE_MS = 2500;
const TRAIL_FADE_EASING = "cubic-bezier(0.33, 1, 0.68, 1)";
const CLICK_FADE_MS = 900;
const CLICK_ALPHA = 0.5;
const CLICK_RADIUS = 1.5;

function sizeCanvas(canvas: HTMLCanvasElement, dpr: number) {
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}

// Two stacked canvases, not one: the drag trail fades as a single unit via
// the canvas ELEMENT's own opacity (a 2500ms CSS transition, per spec), but
// click dots need independent per-mark 900ms fades that can overlap a trail
// fade in progress. A raster canvas has no per-shape opacity, so giving the
// dots their own layer is what lets both timelines run without one erasing
// or dimming the other. Both layers render the same ink, at the same place,
// so visually it still reads as one drawing surface.
const InkCanvas = forwardRef<InkCanvasHandle>(function InkCanvas(_props, ref) {
  const trailRef = useRef<HTMLCanvasElement | null>(null);
  const marksRef = useRef<HTMLCanvasElement | null>(null);
  const dprRef = useRef(1);

  const pointsRef = useRef<CursorPoint[]>([]);
  const pendingRef = useRef<{ point: CursorPoint; suspended: boolean } | null>(null);
  const draggingRef = useRef(false);
  const fadingRef = useRef(false);
  const trailRafRef = useRef<number | null>(null);

  const dotsRef = useRef<{ x: number; y: number; createdAt: number }[]>([]);
  const dotsRafRef = useRef<number | null>(null);

  useEffect(() => {
    const trail = trailRef.current;
    const marks = marksRef.current;
    if (!trail || !marks) return;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      dprRef.current = dpr;
      sizeCanvas(trail!, dpr);
      sizeCanvas(marks!, dpr);
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  function drawTrailSegment(ctx: CanvasRenderingContext2D, dpr: number) {
    const points = pointsRef.current;
    const n = points.length;
    if (n < 2) return;

    ctx.globalAlpha = TRAIL_ALPHA;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.5 * dpr;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (n === 2) {
      const [a, b] = points;
      ctx.beginPath();
      ctx.moveTo(a.x * dpr, a.y * dpr);
      ctx.lineTo(b.x * dpr, b.y * dpr);
      ctx.stroke();
      return;
    }

    // Quadratic-midpoint smoothing: draw from the midpoint of the last two
    // points, through the middle point as control, to the midpoint of the
    // newest pair — the standard technique for a freehand stroke that reads
    // as drawn, not a polyline of straight segments.
    const [p0, p1, p2] = points;
    const mid1 = { x: ((p0.x + p1.x) / 2) * dpr, y: ((p0.y + p1.y) / 2) * dpr };
    const mid2 = { x: ((p1.x + p2.x) / 2) * dpr, y: ((p1.y + p2.y) / 2) * dpr };
    ctx.beginPath();
    ctx.moveTo(mid1.x, mid1.y);
    ctx.quadraticCurveTo(p1.x * dpr, p1.y * dpr, mid2.x, mid2.y);
    ctx.stroke();
  }

  function trailTick() {
    const trail = trailRef.current;
    const ctx = trail?.getContext("2d");

    if (ctx && draggingRef.current) {
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) {
        if (pending.suspended) {
          // Break the stroke while over the DC map: the next resumed point
          // starts a fresh segment instead of drawing a straight line
          // across it.
          pointsRef.current = [];
        } else {
          const points = pointsRef.current;
          points.push(pending.point);
          if (points.length > 3) points.shift();
          drawTrailSegment(ctx, dprRef.current);
        }
      }
    }

    if (draggingRef.current || fadingRef.current) {
      trailRafRef.current = requestAnimationFrame(trailTick);
    } else {
      trailRafRef.current = null;
    }
  }

  function dotsTick() {
    const marks = marksRef.current;
    const ctx = marks?.getContext("2d");
    const dpr = dprRef.current;
    const now = performance.now();
    const dots = dotsRef.current.filter((dot) => now - dot.createdAt < CLICK_FADE_MS);
    dotsRef.current = dots;

    if (ctx && marks) {
      ctx.clearRect(0, 0, marks.width, marks.height);
      ctx.fillStyle = INK;
      for (const dot of dots) {
        const t = (now - dot.createdAt) / CLICK_FADE_MS;
        ctx.globalAlpha = CLICK_ALPHA * (1 - t);
        ctx.beginPath();
        ctx.arc(dot.x * dpr, dot.y * dpr, CLICK_RADIUS * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (dots.length > 0) {
      dotsRafRef.current = requestAnimationFrame(dotsTick);
    } else {
      dotsRafRef.current = null;
    }
  }

  useImperativeHandle(ref, () => ({
    startDrag() {
      const trail = trailRef.current;
      if (!trail) return;
      // A new drag beats any fade in progress — no stale stroke reappearing
      // at full opacity under the new one.
      trail.style.transition = "none";
      trail.style.opacity = "1";
      fadingRef.current = false;
      trail.getContext("2d")?.clearRect(0, 0, trail.width, trail.height);

      pointsRef.current = [];
      pendingRef.current = null;
      draggingRef.current = true;
      if (trailRafRef.current === null) {
        trailRafRef.current = requestAnimationFrame(trailTick);
      }
    },
    addPoint(point, suspended) {
      if (!draggingRef.current) return;
      pendingRef.current = { point, suspended };
    },
    endDrag() {
      draggingRef.current = false;
      pendingRef.current = null;
      const trail = trailRef.current;
      if (!trail) return;

      fadingRef.current = true;
      // Commit the "none" transition before switching it back on, so the
      // browser actually animates the opacity change that follows.
      void trail.offsetHeight;
      trail.style.transition = `opacity ${TRAIL_FADE_MS}ms ${TRAIL_FADE_EASING}`;
      trail.style.opacity = "0";

      const handleEnd = (event: TransitionEvent) => {
        if (event.propertyName !== "opacity") return;
        trail.removeEventListener("transitionend", handleEnd);
        fadingRef.current = false;
        trail.style.transition = "none";
        trail.getContext("2d")?.clearRect(0, 0, trail.width, trail.height);
        // Bitmap's empty either way, but leave the element at its resting
        // opacity rather than stranded at 0 until the next drag happens to
        // reset it.
        trail.style.opacity = "1";
      };
      trail.addEventListener("transitionend", handleEnd);
    },
    registerClick(point, suppress) {
      // Links get the registration tick only — the navigation itself is
      // the feedback, an extra mark is noise.
      if (suppress) return;
      dotsRef.current.push({ x: point.x, y: point.y, createdAt: performance.now() });
      if (dotsRafRef.current === null) {
        dotsRafRef.current = requestAnimationFrame(dotsTick);
      }
    },
  }));

  useEffect(() => {
    return () => {
      if (trailRafRef.current !== null) cancelAnimationFrame(trailRafRef.current);
      if (dotsRafRef.current !== null) cancelAnimationFrame(dotsRafRef.current);
    };
  }, []);

  return (
    <>
      <canvas ref={trailRef} className="pointer-events-none fixed inset-0 z-[9999]" />
      <canvas ref={marksRef} className="pointer-events-none fixed inset-0 z-[9999]" />
    </>
  );
});

export default InkCanvas;
