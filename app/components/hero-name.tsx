"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/use-reduced-motion";

// § 01 hero — the display name roll. At rest "Jake Park" is static and legible.
// On a randomized timer one character rolls vertically and lands on ITSELF: two
// identical copies of the glyph are stacked inside a clip box and the stack
// translates by exactly one box height, so the outgoing copy exits the bottom
// as the incoming copy arrives from the top. The glyph never changes — the eye
// sees one letter roll and resettle, a plate resettling on the bed. Transform
// translate only: no opacity, blur, scale, rotation, colour, or skew. See
// docs/motion-spec.md and CLAUDE.md. This is the site's one animated-type moment.

const WORDS = ["Jake", "Park"] as const;

// Cadence: every 2.6–4.2s roll one random character. A roll is a single 620ms
// transform on the soft `draw` curve (long, nothing snappy). At most two rolls
// may overlap, their starts ≥400ms apart — a coincidence, never a wave.
const TICK_MIN = 2600;
const TICK_MAX = 4200;
const ROLL_MS = 620;
const ROLL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)"; // the site's `draw` curve
const MAX_CONCURRENT = 2;
const MIN_GAP = 400; // ms between two starts
const DOUBLE_CHANCE = 0.16; // odds a tick fires a coincidental second roll
const HEADROOM = 0.08; // clip-box slack over the font's ascent+descent

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export default function HeroName() {
  const reducedMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const [armed, setArmed] = useState(false);

  // The roll must not begin until the loader intro has finished (its own map
  // draw and content reveal own the opening). If the intro isn't running
  // (reduced motion / return visit) or has already completed, start at once;
  // otherwise wait for the one-shot completion signal HeroIntro dispatches.
  const [gateOpen, setGateOpen] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    const w = window as unknown as { __heroIntroDone?: boolean };
    return !document.documentElement.classList.contains("intro") || !!w.__heroIntroDone;
  });
  useEffect(() => {
    if (gateOpen) return;
    const open = () => setGateOpen(true);
    document.addEventListener("hero-intro-done", open, { once: true });
    return () => document.removeEventListener("hero-intro-done", open);
  }, [gateOpen]);

  const getChars = (): HTMLSpanElement[] =>
    headingRef.current
      ? Array.from(headingRef.current.querySelectorAll<HTMLSpanElement>("span[data-char]"))
      : [];

  // ---- measurement: freeze each clip box to the real font's metrics ----
  // Advance width per character (measured, never guessed) so no glyph reflows;
  // clip height from the font's ascent+descent at the rendered display size plus
  // 8% headroom, so the "J" descender and "k" ascender are never clipped. Both
  // are re-measured on resize (the display size is fluid) and after fonts load —
  // measuring against the fallback font would bake in the wrong box. Until this
  // runs the name renders as plain inline text (CSS, pre-`is-armed`), identical
  // to the static hero and correct in the SSR HTML.
  useLayoutEffect(() => {
    if (reducedMotion) return; // static type: never measured, never armed
    const chars = getChars();
    if (chars.length === 0) return;

    let done = false;
    function measure() {
      const first = chars[0];
      const cs = window.getComputedStyle(first);
      const fontPx = parseFloat(cs.fontSize);
      // Font vertical metrics via canvas (fontBoundingBox = the font's own
      // ascent/descent, not the visible ink of any one letter).
      const ctx = document.createElement("canvas").getContext("2d");
      let ascent = fontPx * 0.75;
      let descent = fontPx * 0.25;
      if (ctx) {
        ctx.font = `${cs.fontWeight} ${fontPx}px ${cs.fontFamily}`;
        const m = ctx.measureText("Hjgpq");
        if (m.fontBoundingBoxAscent && m.fontBoundingBoxDescent) {
          ascent = m.fontBoundingBoxAscent;
          descent = m.fontBoundingBoxDescent;
        }
      }
      // Natural single-line height of a word (the display line-height at this
      // size). The `.char` layout box keeps THIS height, exactly like the plain
      // inline text — so the armed line occupies the identical footprint and the
      // Jake/Park spacing never moves. The taller clip window is decoupled: it
      // is an absolutely-positioned child that bleeds past the layout box without
      // driving the line height.
      const block = headingRef.current?.querySelector<HTMLElement>("[data-hero-reveal]");
      const naturalLine = block ? block.getBoundingClientRect().height : fontPx;
      const box = ascent + descent;
      const windowH = Math.max(naturalLine, box * (1 + HEADROOM));
      const pad = (windowH - naturalLine) / 2; // slack above and below the glyph
      // The stack holds two copies one natural line apart; a roll translates it
      // by exactly one natural line, so the resting copy exits the bottom as its
      // twin arrives from the top. Rest position seats the resting copy in the
      // natural slot (offset `pad` down from the clip's top edge).
      const rest = pad - naturalLine;

      for (const el of chars) {
        const clip = el.querySelector<HTMLElement>(".char__clip");
        if (clip) {
          clip.style.top = `${-pad}px`;
          clip.style.height = `${windowH}px`;
        }
        const inner = el.querySelector<HTMLElement>(".char__inner");
        if (inner) inner.style.transform = `translate3d(0, ${rest}px, 0)`;
        for (const c of Array.from(el.querySelectorAll<HTMLElement>(".char__copy"))) {
          c.style.height = `${naturalLine}px`;
          c.style.lineHeight = `${naturalLine}px`;
        }
        el.dataset.rest = String(rest);
        el.dataset.roll = String(naturalLine);
      }
      if (!done) {
        done = true;
        setArmed(true);
      }
    }

    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };

    let ready = false;
    const start = () => {
      if (ready) return;
      ready = true;
      run();
    };
    const timer = window.setTimeout(start, 400);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        window.clearTimeout(timer);
        start();
      });
    }

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(run, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  // ---- the roll scheduler ----
  // setTimeout chaining only, never a persistent rAF loop; each roll is one
  // WAAPI transform (its own rAF is native and ends when the roll does). When
  // paused (offscreen, tab hidden) every timer is cleared and every in-flight
  // roll cancelled back to rest, so nothing is left pending or mid-roll.
  useEffect(() => {
    if (reducedMotion || !armed || !gateOpen) return;
    const chars = getChars();
    if (chars.length === 0) return;

    const timers = new Set<number>();
    const running = new Map<HTMLElement, Animation>();
    let lastStart = 0;
    let active = false;

    function rollOne() {
      if (running.size >= MAX_CONCURRENT) return;
      const now = performance.now();
      if (now - lastStart < MIN_GAP) return;
      const free = chars.filter((c) => !running.has(c));
      if (free.length === 0) return;
      const el = free[Math.floor(Math.random() * free.length)];
      const inner = el.querySelector<HTMLElement>(".char__inner");
      const face = el.querySelector<HTMLElement>(".char__face");
      const clip = el.querySelector<HTMLElement>(".char__clip");
      const rest = parseFloat(el.dataset.rest ?? "0");
      const roll = parseFloat(el.dataset.roll ?? "0");
      if (!inner || !roll) return;
      lastStart = now;
      // Swap the in-flow resting glyph for the clip stack — both show the same
      // glyph in the same place, so the swap is invisible — then translate the
      // stack down by exactly one natural line: the resting copy exits the
      // bottom as its identical twin arrives from the top.
      if (face) face.style.visibility = "hidden";
      if (clip) clip.style.visibility = "visible";
      const anim = inner.animate(
        [
          { transform: `translate3d(0, ${rest}px, 0)` },
          { transform: `translate3d(0, ${rest + roll}px, 0)` },
        ],
        { duration: ROLL_MS, easing: ROLL_EASE, fill: "none" }
      );
      running.set(el, anim);
      const clear = () => {
        running.delete(el);
        // Back to the in-flow glyph (fill:none has reverted the stack to rest).
        if (clip) clip.style.visibility = "hidden";
        if (face) face.style.visibility = "";
      };
      anim.onfinish = clear;
      anim.oncancel = clear;
    }

    function tick() {
      rollOne();
      // A coincidental second roll now and then — never choreographed.
      if (Math.random() < DOUBLE_CHANCE) {
        const t = window.setTimeout(() => {
          timers.delete(t);
          rollOne();
        }, randInt(MIN_GAP, 720));
        timers.add(t);
      }
      const next = window.setTimeout(() => {
        timers.delete(next);
        tick();
      }, randInt(TICK_MIN, TICK_MAX));
      timers.add(next);
    }

    function play() {
      if (active) return;
      active = true;
      const t = window.setTimeout(() => {
        timers.delete(t);
        tick();
      }, randInt(TICK_MIN, TICK_MAX));
      timers.add(t);
    }
    function pause() {
      active = false;
      for (const t of timers) window.clearTimeout(t);
      timers.clear();
      for (const a of running.values()) a.cancel();
      running.clear();
    }

    let onScreen = false;
    const sync = () => {
      if (onScreen && !document.hidden) play();
      else pause();
    };
    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries[0]?.isIntersecting ?? false;
        sync();
      },
      { threshold: 0 }
    );
    if (headingRef.current) io.observe(headingRef.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      pause();
    };
  }, [reducedMotion, armed, gateOpen]);

  return (
    <h1
      id="hero-heading"
      ref={headingRef}
      aria-label="Jake Park"
      className={`hero-roll font-display text-display text-ink${armed ? " is-armed" : ""}`}
    >
      {WORDS.map((word) => (
        <span key={word} aria-hidden="true" data-hero-reveal className="block">
          {word.split("").map((ch, ci) => (
            <span key={ci} data-char={ch} className="char">
              {/* The in-flow resting glyph: anchors the baseline and is what
                  shows at rest, so the line is pixel-identical to the static
                  hero. Hidden only while this character is mid-roll. */}
              <span className="char__face">{ch}</span>
              {/* The roll window: an absolute overlay (bleeds past the layout
                  box without changing the line's footprint), shown only during
                  a roll. `a` arrives from the top; `b` rests and exits the
                  bottom — same glyph, so it reads as one letter rolling. */}
              <span className="char__clip">
                <span className="char__inner">
                  <span className="char__copy char__copy--a">{ch}</span>
                  <span className="char__copy char__copy--b">{ch}</span>
                </span>
              </span>
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
