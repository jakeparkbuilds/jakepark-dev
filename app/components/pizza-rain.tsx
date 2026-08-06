"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { subscribeGlobal } from "../lib/scroll-controller";
import { useReducedMotion } from "../lib/use-reduced-motion";
import Button from "./button";

// § 05 — pizza rain. A joke someone left in the code.
//
// It is the site's one sanctioned piece of illustration and its one off-palette
// colour (CLAUDE.md § 8), and it is a supplied file rather than an emoji: an
// emoji is a different picture on every platform and would render at the wrong
// weight beside this type, which is why emoji are banned in the first place.
//
// ONE CANVAS, ONE LOOP, ONE POOL. This was 70 absolutely-positioned <span>s per
// click, each holding an <img>, each carrying `will-change: transform, opacity`
// — so ten clicks meant 1,400 DOM nodes and 700 compositor layers, and the cost
// was never in the script. Measured at 6x throttle over ten rapid clicks:
// UpdateLayoutTree 666ms with a 20.5ms worst case, Commit 1,054ms, Layerize
// 835ms, against Paint's 284ms; JS heap churned 4.4 -> 14.2MB and back. A
// canvas has no style recalc, no layers and no nodes, so all four of those go
// to zero by construction.
//
// SPAM IS THE FEATURE. There is no debounce, no throttle, no cooldown and no
// "already running" early return. A click activates the next BURST slots in a
// fixed pool; when the pool is full the ring cursor recycles the oldest
// particles, which are the ones nearest the bottom of the screen. So clicking
// faster makes the rain DENSER and never makes it slower — the tenth click
// costs exactly what the first did.

/** Allocated once, at mount. Never grows. */
const POOL = 240;
/** Slots a single click activates. */
const BURST = 24;
/**
 * The automatic arrival gets a bigger one. The joke's first landing is the
 * whole point of it and a quarter of a screen of pizza does not read as a
 * downpour; a click is a top-up and 24 is right for that.
 */
const OPENING_BURST = 72;
/** Reduced motion: a still scatter, held and then cleared. */
const SCATTER = 20;
const SCATTER_HOLD_MS = 1200;

const SESSION_KEY = "pizza-rain-fired";
/** Scroll progress that counts as "the bottom of the page". */
const BOTTOM = 0.96;
/** Far enough down to fetch the artwork and build the sprite before it is needed. */
const WARM_AT = 0.8;

/** CSS px the sprite is drawn at, before a particle's own scale. */
const SIZE = 34;
const SCALE_MIN = 0.7;
const SCALE_MAX = 1.3;
/** px/s². */
const GRAVITY = 520;
const VY_MIN = 60;
const VY_MAX = 180;
/** Horizontal drift, px/s, signed. */
const DRIFT = 60;
/** rad/s, signed. */
const SPIN = 3.5;
/** A frame longer than this is a stall (a hidden tab, a blocked main thread);
 *  integrating it whole would teleport every particle. */
const MAX_DT = 0.05;
/** Fraction of the viewport's height over which a particle fades out. */
const FADE = 0.18;

type Particle = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  scale: number;
};

export default function PizzaRain() {
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [showButton, setShowButton] = useState(false);
  /** `aria-pressed` — is anything on screen. Set on transitions only, never
   *  per frame: this component must not re-render while the rain is falling. */
  const [raining, setRaining] = useState(false);

  /** `buildSprite` and `scatter` need each other, and one of them has to be
   *  declared first. A ref breaks the cycle without a stale closure. */
  const scatterRef = useRef<(() => void) | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  /** The pre-rendered artwork. Drawn ONCE, then blitted per particle. */
  const spriteRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const poolRef = useRef<Particle[] | null>(null);
  /** Ring cursor. Activating from here and wrapping means an exhausted pool
   *  recycles in allocation order, which is oldest-first, with no scan. */
  const cursorRef = useRef(0);
  const activeRef = useRef(0);

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const dprRef = useRef(1);
  const sizeRef = useRef({ w: 0, h: 0 });
  const scatterTimerRef = useRef<number | null>(null);
  /** Set when a still scatter was asked for before the artwork existed. The
   *  falling path heals itself — its loop is already running and simply starts
   *  drawing when the sprite lands — but a scatter draws ONCE, so without this
   *  a click that beat the image load produced nothing at all. Measured: under
   *  reduced motion the first click drew zero particles. */
  const scatterPendingRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // ---- the pool, allocated once ----
  if (poolRef.current === null) {
    const pool: Particle[] = new Array(POOL);
    for (let i = 0; i < POOL; i++) {
      pool[i] = { active: false, x: 0, y: 0, vx: 0, vy: 0, rot: 0, spin: 0, scale: 1 };
    }
    poolRef.current = pool;
  }

  // ---- the sprite: the artwork rasterised once, at mount-time DPR ----
  //
  // Not at mount, though. The asset is a joke at the bottom of the page and has
  // no business on any section's load, so it is built when the visitor is most
  // of the way down or reaches for the button — whichever comes first.
  const buildSprite = useCallback(() => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return;
    const dpr = dprRef.current;
    // Rasterised at the LARGEST size any particle will draw it, so every
    // particle downsamples and none is ever upscaled.
    const px = Math.ceil(SIZE * SCALE_MAX * dpr);
    const c = document.createElement("canvas");
    c.width = px;
    c.height = px;
    const cx = c.getContext("2d");
    if (!cx) return;
    cx.drawImage(img, 0, 0, px, px);
    spriteRef.current = c;
    if (scatterPendingRef.current) {
      scatterPendingRef.current = false;
      scatterRef.current?.();
    }
  }, []);

  const warm = useCallback(() => {
    if (spriteRef.current || imgRef.current) return;
    const img = new Image();
    imgRef.current = img;
    img.decoding = "async";
    img.onload = buildSprite;
    img.src = "/pizza.png";
  }, [buildSprite]);

  // ---- canvas sizing. On mount and on resize, and nowhere else ----
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    dprRef.current = dpr;
    sizeRef.current = { w, h };
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const cx = canvas.getContext("2d");
    ctxRef.current = cx;
    // The sprite is rasterised against a DPR; a monitor change invalidates it.
    if (spriteRef.current && spriteRef.current.width !== Math.ceil(SIZE * SCALE_MAX * dpr)) {
      buildSprite();
    }
  }, [buildSprite]);

  // ---- the loop. ONE, for every particle, whatever spawned them ----
  const frame = useCallback((now: number) => {
    const cx = ctxRef.current;
    const pool = poolRef.current;
    if (!cx || !pool) {
      rafRef.current = null;
      return;
    }

    const prev = lastRef.current;
    const sprite = spriteRef.current;
    // THE CLOCK WAITS FOR THE ARTWORK. A burst thrown before the sprite is
    // rasterised would otherwise fall invisibly and appear halfway down. The
    // particles simply hold above the top edge until there is something to
    // draw them with; `lastRef` is advanced so the wait is not integrated as
    // one enormous delta the moment it ends.
    lastRef.current = now;
    if (!sprite) {
      rafRef.current = requestAnimationFrame(frame);
      return;
    }

    const dt = Math.min(MAX_DT, (now - prev) / 1000);

    const dpr = dprRef.current;
    const { w, h } = sizeRef.current;

    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, w * dpr, h * dpr);

    const fadeFrom = h * (1 - FADE);
    const half = SIZE / 2;
    let live = 0;

    for (let i = 0; i < POOL; i++) {
      const p = pool[i];
      if (!p.active) continue;

      p.vy += GRAVITY * dt;
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      p.rot += p.spin * dt;

      if (p.y - SIZE > h) {
        p.active = false;
        continue;
      }
      live++;

      // Fades out over the last band of the screen so nothing pops off the
      // bottom edge.
      const alpha = p.y > fadeFrom ? Math.max(0, 1 - (p.y - fadeFrom) / (h * FADE)) : 1;

      // setTransform rather than save/translate/rotate/restore: one call
      // instead of four, and no state stack to push per particle.
      const s = p.scale * dpr;
      const c = Math.cos(p.rot);
      const sn = Math.sin(p.rot);
      cx.setTransform(c * s, sn * s, -sn * s, c * s, p.x * dpr, p.y * dpr);
      cx.globalAlpha = alpha;
      cx.drawImage(sprite, -half, -half, SIZE, SIZE);
    }

    activeRef.current = live;

    if (live === 0) {
      // Nothing left. Clear, stand down, and tell React once.
      cx.setTransform(1, 0, 0, 1, 0, 0);
      cx.globalAlpha = 1;
      cx.clearRect(0, 0, w * dpr, h * dpr);
      rafRef.current = null;
      setRaining(false);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {}
      return;
    }

    rafRef.current = requestAnimationFrame(frame);
  }, []);

  /** Starts the loop if it is not already running. A click NEVER starts a
   *  second one, and there is no early return that would make it a no-op. */
  const wake = useCallback(() => {
    if (rafRef.current !== null || document.hidden) return;
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(frame);
  }, [frame]);

  // ---- a burst. Zero allocation: it writes into slots that already exist ----
  const burst = useCallback(
    (n: number) => {
      const pool = poolRef.current;
      if (!pool) return;
      const { w } = sizeRef.current;
      for (let k = 0; k < n; k++) {
        const p = pool[cursorRef.current];
        cursorRef.current = (cursorRef.current + 1) % POOL;
        p.active = true;
        p.x = Math.random() * w;
        // Staggered above the top edge rather than on a per-particle timer, so
        // a burst arrives over a beat with nothing to schedule or cancel.
        p.y = -SIZE - Math.random() * 420;
        p.vx = (Math.random() * 2 - 1) * DRIFT;
        p.vy = VY_MIN + Math.random() * (VY_MAX - VY_MIN);
        p.rot = Math.random() * Math.PI * 2;
        p.spin = (Math.random() * 2 - 1) * SPIN;
        p.scale = SCALE_MIN + Math.random() * (SCALE_MAX - SCALE_MIN);
      }
      setRaining(true);
      setShowButton(true);
      wake();
    },
    [wake],
  );

  // ---- reduced motion: a still scatter, held, then cleared. No loop ----
  const scatter = useCallback(() => {
    const cx = ctxRef.current;
    const sprite = spriteRef.current;
    const pool = poolRef.current;
    if (!cx || !pool) return;
    if (scatterTimerRef.current) window.clearTimeout(scatterTimerRef.current);

    const dpr = dprRef.current;
    const { w, h } = sizeRef.current;
    cx.setTransform(1, 0, 0, 1, 0, 0);
    cx.clearRect(0, 0, w * dpr, h * dpr);
    cx.globalAlpha = 1;
    if (!sprite) {
      // The artwork is still loading. Remember, and let buildSprite run this
      // again the moment it exists.
      scatterPendingRef.current = true;
      return;
    }
    const half = SIZE / 2;
    for (let k = 0; k < SCATTER; k++) {
      const x = Math.random() * w;
      const y = h * (0.08 + Math.random() * 0.78);
      const rot = Math.random() * Math.PI * 2;
      const s = (SCALE_MIN + Math.random() * (SCALE_MAX - SCALE_MIN)) * dpr;
      const c = Math.cos(rot);
      const sn = Math.sin(rot);
      cx.setTransform(c * s, sn * s, -sn * s, c * s, x * dpr, y * dpr);
      cx.drawImage(sprite, -half, -half, SIZE, SIZE);
    }
    setRaining(true);
    setShowButton(true);
    scatterTimerRef.current = window.setTimeout(() => {
      const c2 = ctxRef.current;
      if (c2) {
        c2.setTransform(1, 0, 0, 1, 0, 0);
        c2.clearRect(0, 0, sizeRef.current.w * dprRef.current, sizeRef.current.h * dprRef.current);
      }
      setRaining(false);
      scatterTimerRef.current = null;
    }, SCATTER_HOLD_MS);
  }, []);

  scatterRef.current = scatter;

  const trigger = useCallback(
    (n: number) => {
      warm();
      if (reduced) scatter();
      else burst(n);
    },
    [burst, reduced, scatter, warm],
  );

  // ---- wiring: sizing, visibility, teardown ----
  useEffect(() => {
    if (!mounted) return;
    resize();
    const onResize = () => resize();
    const onVisibility = () => {
      if (document.hidden) {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (activeRef.current > 0) {
        wake();
      }
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (scatterTimerRef.current) window.clearTimeout(scatterTimerRef.current);
    };
  }, [mounted, resize, wake]);

  // ---- the automatic arrival ----
  useEffect(() => {
    if (!mounted) return;
    if (reduced) {
      // Never rains on its own here. The button is the only way in, and it is
      // present from load rather than earned by a rain that never runs.
      setShowButton(true);
      return;
    }
    let fired = false;
    try {
      fired = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {}
    if (fired) {
      setShowButton(true);
      return;
    }
    // Rides the shared Lenis loop; no second scroll listener. Gated on § 05:
    // both thresholds it watches for are only reachable with the last section
    // on screen.
    const unsubscribe = subscribeGlobal(
      (progress) => {
        if (progress >= WARM_AT) warm();
        if (progress < BOTTOM) return;
        unsubscribe();
        trigger(OPENING_BURST);
      },
      document.getElementById("connect"),
    );
    return unsubscribe;
  }, [mounted, reduced, trigger, warm]);

  const canvas = (
    <canvas
      ref={canvasRef}
      id="pizza-canvas"
      aria-hidden="true"
      className="pizza-canvas"
    />
  );

  return (
    <>
      {mounted ? createPortal(canvas, document.body) : null}
      {showButton ? (
        // `aria-pressed` is "it is raining", which is the only on/off this
        // button has: clicks ACCUMULATE — a second press adds another burst
        // rather than stopping the first — so pressed cannot mean "you pressed
        // it last". It goes true with the first burst and false the frame the
        // last particle leaves.
        <Button
          variant="solid"
          onClick={() => trigger(BURST)}
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
