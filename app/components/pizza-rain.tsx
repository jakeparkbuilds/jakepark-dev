"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cubicBezier } from "animejs";
import { subscribeGlobal } from "../lib/scroll-controller";
import { useReducedMotion } from "../lib/use-reduced-motion";
import Button from "./button";

// § 07 — pizza rain. A joke someone left in the code.
//
// It is the site's one sanctioned piece of illustration and its one off-palette
// colour (CLAUDE.md § 8), and it is a supplied file rather than an emoji: an
// emoji is a different picture on every platform and would render at the wrong
// weight beside this type, which is why emoji are banned in the first place.
// Every slice is the same image; the variety is rotation and scale.
//
// CLICKS ACCUMULATE. Each click adds a WAVE of 70 that falls alongside whatever
// is already falling, so spamming the button buries the screen — that is the
// point of it. A wave is dropped the moment its own last slice lands, and when
// the last wave goes the layer unmounts and the rAF cancels: no lingering DOM,
// no lingering timers.
//
// Still ONE rAF for the whole thing, however many waves are in the air. It
// walks the waves and writes transform and opacity, and reads nothing.

const COUNT = 70;
const SCATTER_COUNT = 20;
const DELAY_MAX = 900;
const DUR_MIN = 1600;
const DUR_MAX = 2800;
/** Longest possible slice: 900 + 2800 = 3700ms, inside the 3.8s budget. */
const BURST_MS = DELAY_MAX + DUR_MAX;
/**
 * Concurrent waves. Not a cooldown — every click is honoured immediately and
 * nothing is ever dropped on the floor. At the cap the OLDEST wave retires to
 * make room, which is the one already closest to the bottom of the screen, so
 * what leaves is what the visitor is least looking at. 12 x 70 = 840 slices,
 * measured with all of them in the air: 8.3ms median / 9.0ms worst unthrottled,
 * 16.7ms median / 25.5ms worst under 6x CPU throttle, no frame over 32ms. The
 * screen is thoroughly covered well before the cap.
 */
const MAX_WAVES = 12;
const SESSION_KEY = "pizza-rain-fired";
/** Accelerating, like gravity. */
const FALL = cubicBezier(0.45, 0, 0.9, 0.6);
/** Scroll progress that counts as "the bottom of the page". */
const BOTTOM = 0.96;
/** Far enough down to fetch and decode the slice before it is needed. */
const WARM_AT = 0.8;

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

type Wave = {
  id: number;
  slices: Slice[];
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

/**
 * The slice. One supplied illustration, referenced by every span in every wave,
 * so the browser fetches and decodes it once — a plain <img>, not next/image,
 * because every copy is the same 34px and there is nothing to negotiate.
 */
function PizzaSlice() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/pizza.png"
      alt=""
      width={34}
      height={34}
      decoding="async"
      draggable={false}
    />
  );
}

export default function PizzaRain() {
  const reduced = useReducedMotion();
  const [waves, setWaves] = useState<Wave[]>([]);
  const [scatter, setScatter] = useState<Slice[] | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [mounted, setMounted] = useState(false);
  /** Is anything in the air right now — the button's `aria-pressed`. */
  const raining = waves.length > 0 || scatter !== null;

  // Per wave: its nodes, and the timestamp it actually began. The start is
  // taken on the wave's FIRST FRAME, not at click time — the click has to get
  // through a React commit before the spans exist, and dating the wave from the
  // click would skip that much of its fall.
  const nodesRef = useRef(new Map<number, (HTMLSpanElement | null)[]>());
  const startsRef = useRef(new Map<number, number>());
  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const seqRef = useRef(0);
  const scatterRunningRef = useRef(false);
  const warmedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const clearTimers = () => {
    for (const t of timersRef.current) window.clearTimeout(t);
    timersRef.current = [];
  };

  // ---- the fall ----
  //
  // No cooldown and no guard. A click is always another wave, and waves fall
  // independently and concurrently rather than replacing one another.
  const rain = useCallback(() => {
    const id = ++seqRef.current;
    nodesRef.current.set(id, []);
    // The button appears with the FIRST wave, not after it. Waiting for the
    // burst to end meant the first 3.7s of the joke were un-spammable, which is
    // exactly the window in which someone wants to click it again.
    setShowButton(true);
    setWaves((prev) => {
      const next = [...prev, { id, slices: makeSlices(COUNT) }];
      while (next.length > MAX_WAVES) {
        const dropped = next.shift();
        if (dropped) {
          nodesRef.current.delete(dropped.id);
          startsRef.current.delete(dropped.id);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (waves.length === 0) return;
    const fallTo = window.innerHeight + 120;

    // ONE loop for every wave in the air. Writes transform and opacity, reads
    // nothing. Each wave carries its own clock, so a wave thrown three seconds
    // after another is three seconds behind it and they never sync up.
    const frame = (now: number) => {
      const finished: number[] = [];

      for (const wave of waves) {
        let start = startsRef.current.get(wave.id);
        if (start === undefined) {
          start = now;
          startsRef.current.set(wave.id, now);
        }
        const t = now - start;
        const nodes = nodesRef.current.get(wave.id);
        if (nodes) {
          for (let i = 0; i < wave.slices.length; i++) {
            const node = nodes[i];
            const s = wave.slices[i];
            if (!node) continue;
            const local = (t - s.delay) / s.duration;
            if (local <= 0) continue;
            const p = local >= 1 ? 1 : local;
            const eased = FALL(p);
            // The last 20% of each slice's own fall fades it out, so nothing
            // pops out of existence at the edge.
            const o = p > 0.8 ? 1 - (p - 0.8) / 0.2 : 1;
            node.style.opacity = `${o}`;
            node.style.transform =
              `translate3d(${s.drift * p}px, ${eased * fallTo}px, 0)` +
              ` rotate(${s.spin * p}deg) scale(${s.scale})`;
          }
        }
        if (t >= BURST_MS) finished.push(wave.id);
      }

      if (finished.length > 0) {
        for (const id of finished) {
          nodesRef.current.delete(id);
          startsRef.current.delete(id);
        }
        // Retiring a wave re-runs this effect with the shorter list; when the
        // last one goes the layer leaves the DOM entirely and the loop is
        // cancelled by the cleanup below.
        setWaves((prev) => prev.filter((w) => !finished.includes(w.id)));
        setShowButton(true);
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {}
        return;
      }

      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [waves]);

  // ---- the static scatter, for reduced motion ----
  const showScatter = useCallback(() => {
    // The scatter holds still for 1.2s on timers, so re-entry here would stack
    // them against one layer. It is serialised, not rate-limited.
    if (scatterRunningRef.current) return;
    scatterRunningRef.current = true;
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
            scatterRunningRef.current = false;
          }, 320)
        );
      }, 1200)
    );
  }, []);

  // ---- warm the asset ----
  //
  // 70 <img> elements appearing in one frame means one decode, and that decode
  // lands on the burst's very first frame: measured under 6x CPU throttle, that
  // frame cost 122.4ms against a median of 8.3ms. Fetching and decoding ahead
  // of the trigger moves the cost to a frame where nothing is moving. It also
  // covers every later wave, which is why spamming the button is cheap.
  //
  // Not at mount — the asset is a joke at the bottom of the page and should not
  // be on any section's load. It warms when the visitor is most of the way down
  // (well before the 0.96 trigger) or reaches for the button, whichever first.
  const warm = useCallback(() => {
    if (warmedRef.current) return;
    warmedRef.current = true;
    const img = new Image();
    img.src = "/pizza.png";
    img.decode?.().catch(() => {});
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
    // Rides the shared Lenis loop; no second scroll listener. GATED ON § 05:
    // both thresholds it watches for — 0.80 to warm the asset and 0.96 to fire
    // — are only reachable with the last section on screen, so subscribing
    // from the hero is a callback per frame for the whole page that can never
    // do anything.
    const unsubscribe = subscribeGlobal(
      (progress) => {
        if (progress >= WARM_AT) warm();
        if (progress < BOTTOM) return;
        unsubscribe();
        rain();
      },
      document.getElementById("connect"),
    );
    return unsubscribe;
  }, [reduced, rain, warm]);

  useEffect(() => clearTimers, []);

  const layer =
    waves.length > 0 || scatter ? (
      <div
        id="pizza-layer"
        aria-hidden="true"
        className="pizza-layer"
        data-static={scatter ? "" : undefined}
      >
        {scatter
          ? scatter.map((s, i) => (
              <span
                key={i}
                className="pizza-slice"
                style={{
                  left: `${s.x}vw`,
                  top: `${s.y}vh`,
                  transform: `scale(${s.scale})`,
                }}
              >
                <PizzaSlice />
              </span>
            ))
          : waves.map((wave) =>
              wave.slices.map((s, i) => (
                // Keyed by wave, so React never reconciles one wave's spans
                // into another's and hands a node to the wrong clock.
                <span
                  key={`${wave.id}-${i}`}
                  ref={(node) => {
                    const nodes = nodesRef.current.get(wave.id);
                    if (nodes) nodes[i] = node;
                  }}
                  className="pizza-slice"
                  style={{ left: `${s.x}vw`, top: "-60px", opacity: 0 }}
                >
                  <PizzaSlice />
                </span>
              ))
            )}
      </div>
    ) : null;

  return (
    <>
      {mounted && layer ? createPortal(layer, document.body) : null}
      {showButton ? (
        // THE SOLID VARIANT, and it is a real control now rather than a hollow
        // square and a word. What it did was always off-theme; announcing it in
        // the drawing vocabulary made it indistinguishable from the crop marks
        // and the reference plates, which are decoration.
        //
        // `aria-pressed` is "it is raining", which is the only on/off this
        // button has: CLICKS ACCUMULATE (CLAUDE.md § 5) — a second press adds
        // another wave rather than stopping the first — so pressed cannot mean
        // "you pressed it last". It goes true with the first wave and false the
        // frame the last one lands, and the accent fill says so.
        <Button
          variant="solid"
          onClick={reduced ? showScatter : rain}
          onPointerEnter={warm}
          onFocus={warm}
          aria-pressed={raining}
          aria-label="replay pizza rain"
          className="pizza-btn"
        >
          pizza rain
        </Button>
      ) : null}
    </>
  );
}
