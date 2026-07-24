"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../lib/use-reduced-motion";
import { useCursorActive, useCursorEngine } from "../../lib/cursor/useCursorState";
import { DC_PROJECTION } from "../dc-paths";
import InkCanvas, { type InkCanvasHandle } from "./InkCanvas";

const TICK_DURATION_MS = 180;
const TICK_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
// "update at most every other frame" — a time threshold reads the same as
// counting frames but doesn't need its own rAF bookkeeping (~2 frames @ 60fps).
const LABEL_MIN_INTERVAL_MS = 32;

type TickAxis = "left" | "right" | "top" | "bottom";

const TICK_KEYFRAMES: Record<TickAxis, Keyframe[]> = {
  left: [
    { transform: "translateX(0)" },
    { transform: "translateX(-4px)", offset: 0.5 },
    { transform: "translateX(0)" },
  ],
  right: [
    { transform: "translateX(0)" },
    { transform: "translateX(4px)", offset: 0.5 },
    { transform: "translateX(0)" },
  ],
  top: [
    { transform: "translateY(0)" },
    { transform: "translateY(-4px)", offset: 0.5 },
    { transform: "translateY(0)" },
  ],
  bottom: [
    { transform: "translateY(0)" },
    { transform: "translateY(4px)", offset: 0.5 },
    { transform: "translateY(0)" },
  ],
};

function findMapSvg(): SVGSVGElement | null {
  return document.querySelector("[data-dc-map]");
}

// Inverts a screen point through the DC map SVG's own viewBox transform,
// then through the exact affine projection scripts/generate-dc-paths.mjs
// used to build the map (DC_PROJECTION, in dc-paths.ts) — not a second,
// hand-approximated set of bounds.
function screenToLatLon(clientX: number, clientY: number, svg: SVGSVGElement, rect: DOMRect) {
  const vb = svg.viewBox.baseVal;
  const displayScale = Math.min(rect.width / vb.width, rect.height / vb.height);
  const offX = (rect.width - vb.width * displayScale) / 2;
  const offY = (rect.height - vb.height * displayScale) / 2;
  const svgX = (clientX - rect.left - offX) / displayScale + vb.x;
  const svgY = (clientY - rect.top - offY) / displayScale + vb.y;

  const lon = (svgX - DC_PROJECTION.offsetX) / DC_PROJECTION.cosLat / DC_PROJECTION.scale + DC_PROJECTION.lonMin;
  const lat = DC_PROJECTION.latMax - (svgY - DC_PROJECTION.offsetY) / DC_PROJECTION.scale;
  return { lat, lon };
}

function formatCoord(lat: number, lon: number) {
  return `${lat.toFixed(4)}°N ${Math.abs(lon).toFixed(4)}°W`;
}

export default function PlotterCursor() {
  const active = useCursorActive();
  const reducedMotion = useReducedMotion();

  const rootRef = useRef<HTMLDivElement | null>(null);
  const labelWrapRef = useRef<HTMLDivElement | null>(null);
  const labelTextRef = useRef<HTMLSpanElement | null>(null);
  const inkRef = useRef<InkCanvasHandle | null>(null);

  const tickElsRef = useRef<Record<TickAxis, SVGGElement | null>>({
    left: null,
    right: null,
    top: null,
    bottom: null,
  });
  const tickAnimsRef = useRef<Partial<Record<TickAxis, Animation>>>({});

  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const lastLabelUpdateRef = useRef(0);
  const labelVisibleRef = useRef(false);

  function fireTick() {
    (Object.keys(TICK_KEYFRAMES) as TickAxis[]).forEach((axis) => {
      const el = tickElsRef.current[axis];
      if (!el) return;
      tickAnimsRef.current[axis]?.cancel();
      tickAnimsRef.current[axis] = el.animate(TICK_KEYFRAMES[axis], {
        duration: TICK_DURATION_MS,
        easing: TICK_EASING,
      });
    });
  }

  useCursorEngine(
    {
      onMove(point, map, dragging) {
        const root = rootRef.current;
        if (root) {
          root.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        }

        if (dragging) {
          inkRef.current?.addPoint(point, map.overMap);
        }

        const labelWrap = labelWrapRef.current;
        if (!labelWrap) return;

        if (map.overMap && map.mapRect) {
          if (!mapSvgRef.current || !mapSvgRef.current.isConnected) {
            mapSvgRef.current = findMapSvg();
          }
          const svg = mapSvgRef.current;
          if (svg) {
            labelWrap.style.transform = `translate3d(${point.x + 14}px, ${point.y + 14}px, 0)`;
            if (!labelVisibleRef.current) {
              labelVisibleRef.current = true;
              labelWrap.classList.add("is-visible");
            }
            const now = performance.now();
            if (now - lastLabelUpdateRef.current >= LABEL_MIN_INTERVAL_MS) {
              lastLabelUpdateRef.current = now;
              const { lat, lon } = screenToLatLon(point.x, point.y, svg, map.mapRect);
              if (labelTextRef.current) {
                labelTextRef.current.textContent = formatCoord(lat, lon);
              }
            }
          }
        } else if (labelVisibleRef.current) {
          labelVisibleRef.current = false;
          labelWrap.classList.remove("is-visible");
        }
      },
      onPenDownChange(penDown) {
        rootRef.current?.classList.toggle("is-pen-down", penDown);
      },
      onPointerDown(point, meta) {
        // Discrete state change, not motion — still fires under reduced
        // motion, it just doesn't animate there (see fireTick's guard below
        // via the reducedMotion check).
        if (!reducedMotion) fireTick();
        inkRef.current?.registerClick(point, meta.isLink);
      },
      onDragStart() {
        inkRef.current?.startDrag();
      },
      onDragEnd() {
        inkRef.current?.endDrag();
      },
    },
    active
  );

  useEffect(() => {
    const anims = tickAnimsRef.current;
    return () => {
      for (const anim of Object.values(anims)) anim?.cancel();
    };
  }, []);

  if (!active) return null;

  return (
    <>
      <div
        ref={rootRef}
        aria-hidden="true"
        className="cursor-crosshair pointer-events-none fixed left-0 top-0 z-[9999] opacity-70 will-change-transform"
      >
        <svg width={22} height={22} viewBox="0 0 22 22" focusable="false">
          <g ref={(el) => { tickElsRef.current.left = el; }}>
            <line
              className="cx-line cx-line--h cx-line--left"
              x1={0}
              y1={11}
              x2={9}
              y2={11}
              stroke="#1A1815"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <g ref={(el) => { tickElsRef.current.right = el; }}>
            <line
              className="cx-line cx-line--h cx-line--right"
              x1={13}
              y1={11}
              x2={22}
              y2={11}
              stroke="#1A1815"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <g ref={(el) => { tickElsRef.current.top = el; }}>
            <line
              className="cx-line cx-line--v cx-line--top"
              x1={11}
              y1={0}
              x2={11}
              y2={9}
              stroke="#1A1815"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <g ref={(el) => { tickElsRef.current.bottom = el; }}>
            <line
              className="cx-line cx-line--v cx-line--bottom"
              x1={11}
              y1={13}
              x2={11}
              y2={22}
              stroke="#1A1815"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          </g>
          <circle className="cx-dot" cx={11} cy={11} r={1.75} fill="#22384F" />
        </svg>
      </div>

      <div
        ref={labelWrapRef}
        aria-hidden="true"
        className="cursor-readout pointer-events-none fixed left-0 top-0 z-[9999] font-mono text-mono-micro uppercase text-label"
      >
        <span ref={labelTextRef} className="tabular-nums" />
      </div>

      {!reducedMotion && <InkCanvas ref={inkRef} />}
    </>
  );
}
