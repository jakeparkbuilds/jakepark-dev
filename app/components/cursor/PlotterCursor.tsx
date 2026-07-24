"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "../../lib/use-reduced-motion";
import { useCursorActive, useCursorEngine } from "../../lib/cursor/useCursorState";
import { DC_PROJECTION } from "../dc-paths";
import InkCanvas, { type InkCanvasHandle } from "./InkCanvas";

const CLICK_SCALE_DURATION_MS = 160;
const CLICK_SCALE_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
// "update at most every other frame" — a time threshold reads the same as
// counting frames but doesn't need its own rAF bookkeeping (~2 frames @ 60fps).
const LABEL_MIN_INTERVAL_MS = 32;
// Ignore any inside/outside flip of the DC boundary that reverses within
// this window, so tracing the ragged Potomac edge doesn't strobe the label.
const BOUNDARY_HYSTERESIS_MS = 80;
const SCROLL_END_DEBOUNCE_MS = 150;

function findMapSvg(): SVGSVGElement | null {
  return document.querySelector("[data-dc-map]");
}

function findBoundaryPath(): SVGPathElement | null {
  return document.querySelector("[data-dc-boundary]");
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

  const dotRef = useRef<HTMLDivElement | null>(null);
  const clickAnimRef = useRef<Animation | null>(null);
  const labelWrapRef = useRef<HTMLDivElement | null>(null);
  const labelTextRef = useRef<HTMLSpanElement | null>(null);
  const inkRef = useRef<InkCanvasHandle | null>(null);

  const mapSvgRef = useRef<SVGSVGElement | null>(null);
  const lastLabelUpdateRef = useRef(0);

  // DC boundary hit test: getScreenCTM().inverse() is cached, not recomputed
  // every frame, and only invalidated on scroll end / resize (see effect
  // below).
  const boundaryPathRef = useRef<SVGPathElement | null>(null);
  const inverseCtmRef = useRef<DOMMatrix | null>(null);
  const ctmDirtyRef = useRef(true);

  // Hysteresis around the inside/outside boundary flip.
  const displayedInsideRef = useRef(false);
  const pendingInsideRef = useRef<boolean | null>(null);
  const flipTimerRef = useRef<number | null>(null);

  function getInverseCtm(): DOMMatrix | null {
    if (!boundaryPathRef.current || !boundaryPathRef.current.isConnected) {
      boundaryPathRef.current = findBoundaryPath();
    }
    const path = boundaryPathRef.current;
    if (!path) return null;
    if (ctmDirtyRef.current || !inverseCtmRef.current) {
      const ctm = path.getScreenCTM();
      inverseCtmRef.current = ctm ? ctm.inverse() : null;
      ctmDirtyRef.current = false;
    }
    return inverseCtmRef.current;
  }

  function isInsideDC(clientX: number, clientY: number): boolean {
    const inverse = getInverseCtm();
    const path = boundaryPathRef.current;
    if (!inverse || !path) return false;
    const local = new DOMPoint(clientX, clientY).matrixTransform(inverse);
    return path.isPointInFill(local);
  }

  // Debounced show/hide: a raw inside/outside reading only takes effect once
  // it has held steady for BOUNDARY_HYSTERESIS_MS. Position/text keep
  // tracking every move once shown; only the flip itself is debounced.
  function updateBoundaryState(rawInside: boolean, onSettled: (inside: boolean) => void) {
    if (rawInside === displayedInsideRef.current) {
      if (flipTimerRef.current !== null) {
        window.clearTimeout(flipTimerRef.current);
        flipTimerRef.current = null;
        pendingInsideRef.current = null;
      }
      return;
    }
    if (pendingInsideRef.current === rawInside) return;
    if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
    pendingInsideRef.current = rawInside;
    flipTimerRef.current = window.setTimeout(() => {
      displayedInsideRef.current = rawInside;
      pendingInsideRef.current = null;
      flipTimerRef.current = null;
      onSettled(rawInside);
    }, BOUNDARY_HYSTERESIS_MS);
  }

  useCursorEngine(
    {
      onMove(point, map, dragging) {
        const dot = dotRef.current;
        if (dot) {
          dot.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        }

        if (dragging) {
          inkRef.current?.addPoint(point, map.overMap);
        }

        const labelWrap = labelWrapRef.current;
        if (!labelWrap) return;

        const rawInside = isInsideDC(point.x, point.y);
        updateBoundaryState(rawInside, (inside) => {
          labelWrap.classList.toggle("is-visible", inside);
        });

        if (displayedInsideRef.current) {
          labelWrap.style.transform = `translate3d(${point.x + 14}px, ${point.y + 14}px, 0)`;

          if (!mapSvgRef.current || !mapSvgRef.current.isConnected) {
            mapSvgRef.current = findMapSvg();
          }
          const svg = mapSvgRef.current;
          if (svg) {
            const now = performance.now();
            if (now - lastLabelUpdateRef.current >= LABEL_MIN_INTERVAL_MS) {
              lastLabelUpdateRef.current = now;
              const rect = svg.getBoundingClientRect();
              const { lat, lon } = screenToLatLon(point.x, point.y, svg, rect);
              if (labelTextRef.current) {
                labelTextRef.current.textContent = formatCoord(lat, lon);
              }
            }
          }
        }
      },
      onPenDownChange(penDown) {
        dotRef.current?.classList.toggle("is-pen-down", penDown);
      },
      onPointerDown(point, meta) {
        // Discrete state change, not motion — still fires under reduced
        // motion, it just doesn't animate there.
        if (!reducedMotion && dotRef.current) {
          clickAnimRef.current?.cancel();
          clickAnimRef.current = dotRef.current.animate(
            [{ scale: "1" }, { scale: "0.8", offset: 0.5 }, { scale: "1" }],
            { duration: CLICK_SCALE_DURATION_MS, easing: CLICK_SCALE_EASING }
          );
        }
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

  // Invalidate the cached inverse CTM on resize (immediate) and scroll end
  // (debounced) — never recomputed on every frame.
  useEffect(() => {
    function invalidate() {
      ctmDirtyRef.current = true;
    }
    let scrollTimer: number | undefined;
    function onScroll() {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(invalidate, SCROLL_END_DEBOUNCE_MS);
    }
    window.addEventListener("resize", invalidate);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(scrollTimer);
    };
  }, []);

  useEffect(() => {
    return () => {
      clickAnimRef.current?.cancel();
      if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
    };
  }, []);

  if (!active) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="cursor-dot pointer-events-none fixed left-0 top-0 z-[9999] will-change-transform"
      />

      <div
        ref={labelWrapRef}
        aria-hidden="true"
        className="cursor-readout pointer-events-none fixed left-0 top-0 z-[9999] font-mono text-mono-micro uppercase text-readout"
      >
        <span ref={labelTextRef} className="tabular-nums" />
      </div>

      {!reducedMotion && <InkCanvas ref={inkRef} />}
    </>
  );
}
