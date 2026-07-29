"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cubicBezier } from "animejs";
import { subscribeGlobal } from "../lib/scroll-controller";
import { useReducedMotion } from "../lib/use-reduced-motion";

// § 07 — pizza rain. A joke someone left in the code.
//
// It is the site's one sanctioned piece of illustration and its one off-palette
// colour (CLAUDE.md § 8), and it is DRAWN rather than set as an emoji: an emoji
// is a different picture on every platform and would render at the wrong weight
// beside this type, which is why emoji are banned in the first place. Every
// slice is the same SVG; the variety is rotation and scale.
//
// The burst runs on ONE rAF for all 70 slices, not 70 animations. It cancels
// itself when the last slice lands and the whole layer then unmounts — no
// lingering DOM, no lingering timers.

const COUNT = 70;
const SCATTER_COUNT = 20;
const DELAY_MAX = 900;
const DUR_MIN = 1600;
const DUR_MAX = 2800;
/** Longest possible slice: 900 + 2800 = 3700ms, inside the 3.8s budget. */
const BURST_MS = DELAY_MAX + DUR_MAX;
const REPLAY_LOCKOUT = 4000;
const SESSION_KEY = "pizza-rain-fired";
/** Accelerating, like gravity. */
const FALL = cubicBezier(0.45, 0, 0.9, 0.6);
/** Scroll progress that counts as "the bottom of the page". */
const BOTTOM = 0.96;

type Slice = {
  x: number; // vw
  drift: number; // px, signed
  delay: number;
  duration: number;
  spin: number; // deg, signed
  scale: number;
  /** Static scatter only. */
  y: number; // vh
};

function makeSlices(n: number): Slice[] {
  const out: Slice[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x: Math.random() * 100,
      drift: (Math.random() * 2 - 1) * 60,
      delay: Math.random() * DELAY_MAX,
      duration: DUR_MIN + Math.random() * (DUR_MAX - DUR_MIN),
      spin: (Math.random() * 2 - 1) * 540,
      scale: 0.7 + Math.random() * 0.6,
      y: 8 + Math.random() * 78,
    });
  }
  return out;
}

/** One hand-authored slice: crust arc, cheese wedge, three pepperoni, a leaf. */
function PizzaSlice() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      {/* cheese — the wedge body */}
      <path d="M17 2 L31 27 A16 16 0 0 1 3 27 Z" fill="#E8B04B" />
      {/* crust — the baked arc along the bottom */}
      <path
        d="M3 27 A16 16 0 0 0 31 27 A16 16 0 0 1 3 27 Z"
        fill="#C98A3E"
      />
      <circle cx="17" cy="14" r="2.6" fill="#B4432E" />
      <circle cx="11.5" cy="21" r="2.2" fill="#B4432E" />
      <circle cx="22" cy="21.5" r="2.4" fill="#B4432E" />
      {/* one basil leaf, for life */}
      <path d="M19.5 9.5 q3 -1.4 4 1 q-3 1.4 -4 -1 Z" fill="#5A7A47" />
    </svg>
  );
}

export default function PizzaRain() {
  const reduced = useReducedMotion();
  const [slices, setSlices] = useState<Slice[] | null>(null);
  const [scatter, setScatter] = useState<Slice[] | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [mounted, setMounted] = useState(false);

  const nodesRef = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  // -Infinity, never 0. The lockout compares against performance.now(), which
  // is milliseconds since page load, so a 0 here means "a rain just happened at
  // load" and silently swallows every trigger in the first 4 seconds — which is
  // exactly when a visitor who lands deep-linked at the bottom would hit it.
  // Measured: the automatic trigger fired at progress 1 and rain() returned
  // immediately.
  const lastRunRef = useRef(-Infinity);
  const runningRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const clearTimers = () => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  };

  // ---- the fall ----
  const rain = useCallback(() => {
    const now = performance.now();
    // Clicking during a rain, or inside the lockout, does nothing — bursts
    // never stack.
    if (runningRef.current || now - lastRunRef.current < REPLAY_LOCKOUT) return;
    runningRef.current = true;
    lastRunRef.current = now;
    nodesRef.current = [];
    setSlices(makeSlices(COUNT));
  }, []);

  useEffect(() => {
    if (!slices) return;
    const nodes = nodesRef.current;
    const start = performance.now();
    const fallTo = window.innerHeight + 120;

    // ONE loop for all 70. Writes transform and opacity, reads nothing.
    const frame = (now: number) => {
      const t = now - start;
      for (let i = 0; i < slices.length; i++) {
        const node = nodes[i];
        const s = slices[i];
        if (!node) continue;
        const local = (t - s.delay) / s.duration;
        if (local <= 0) continue;
        const p = local >= 1 ? 1 : local;
        const eased = FALL(p);
        // The last 20% of each slice's own fall fades it out, so nothing pops
        // out of existence at the edge.
        const o = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1;
        node.style.opacity = `${o}`;
        node.style.transform =
          `translate3d(${s.drift * p}px, ${eased * fallTo}px, 0)` +
          ` rotate(${s.spin * p}deg) scale(${s.scale})`;
      }
      if (t < BURST_MS) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        rafRef.current = null;
        runningRef.current = false;
        // The layer leaves the DOM entirely.
        setSlices(null);
        setShowButton(true);
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}
      }
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      runningRef.current = false;
    };
  }, [slices]);

  // ---- the static scatter, for reduced motion ----
  const showScatter = useCallback(() => {
    const now = performance.now();
    if (runningRef.current || now - lastRunRef.current < REPLAY_LOCKOUT) return;
    runningRef.current = true;
    lastRunRef.current = now;
    setScatter(makeSlices(SCATTER_COUNT));
    // Visible for 1.2s, then a fade, then gone. No falling and no rotation —
    // the joke survives, the motion does not.
    timersRef.current.push(
      window.setTimeout(() => {
        const layer = document.getElementById("pizza-layer");
        if (layer) layer.setAttribute("data-out", "");
        timersRef.current.push(
          window.setTimeout(() => {
            setScatter(null);
            runningRef.current = false;
          }, 320)
        );
      }, 1200)
    );
  }, []);

  // ---- the automatic trigger ----
  useEffect(() => {
    // Never under reduced motion. The button is the only way in there, and it
    // is present from load rather than earned by a rain that never runs.
    if (reduced) {
      setShowButton(true);
      return;
    }
    let fired = false;
    try {
      fired = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {}
    if (fired) {
      // It has already run this session — including before a reload. The
      // button stands in for it.
      setShowButton(true);
      return;
    }
    // Rides the shared Lenis loop; no second scroll listener.
    const unsubscribe = subscribeGlobal((progress) => {
      if (progress < BOTTOM) return;
      unsubscribe();
      rain();
    });
    return unsubscribe;
  }, [reduced, rain]);

  useEffect(() => clearTimers, []);

  const layer =
    slices || scatter ? (
      <div
        id="pizza-layer"
        aria-hidden="true"
        className="pizza-layer"
        data-static={scatter ? "" : undefined}
      >
        {(slices ?? scatter ?? []).map((s, i) => (
          <span
            key={i}
            ref={(node) => {
              if (slices) nodesRef.current[i] = node;
            }}
            className="pizza-slice"
            style={
              scatter
                ? { left: `${s.x}vw`, top: `${s.y}vh`, transform: `scale(${s.scale})` }
                : { left: `${s.x}vw`, top: "-60px", opacity: 0 }
            }
          >
            <PizzaSlice />
          </span>
        ))}
      </div>
    ) : null;

  return (
    <>
      {mounted && layer ? createPortal(layer, document.body) : null}
      {showButton ? (
        <button
          type="button"
          onClick={reduced ? showScatter : rain}
          aria-label="replay pizza rain"
          className="pizza-btn font-mono"
        >
          <span aria-hidden="true" className="pizza-btn-sq" />
          pizza rain
        </button>
      ) : null}
    </>
  );
}
