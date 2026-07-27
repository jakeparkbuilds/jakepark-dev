"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "../lib/use-reduced-motion";

// § 01 hero — the glyph cycle. At rest "Jake Park" is static and legible. On a
// randomized timer one character briefly substitutes through a few glyphs and
// lands back on itself — a plate resettling, not a decode effect. See
// docs/motion-spec.md ("Glyph cycle") and CLAUDE.md. This is the only place on
// the site where type is animated by substitution rather than being drawn.

const WORDS = ["Jake", "Park"] as const;

// Substitutes are drawn from the site's own vocabulary: the other letters of
// "jakeprk" (case-matched to the character being swapped) plus a short set of
// symbols. ∆ (U+2206) from the original set is deliberately omitted — it has no
// glyph in the Bricolage subset, and substituting an absent glyph would fall
// back to another font. Verified the six below are all present.
const SYMBOLS = ["×", "÷", "§", "¶", "ø", "#"];
const LETTER_POOL = "jakeprk";

// Cycle cadence.
const TICK_MIN = 2600;
const TICK_MAX = 4200;
const SWAP_MS = 55; // each substitute holds this long
const SUB_MIN = 5; // 5–6 substitutes -> ~275–330ms per event
const SUB_MAX = 6;

function substitutesFor(ch: string): string[] {
  const lower = ch.toLowerCase();
  const isUpper = ch !== lower && ch === ch.toUpperCase();
  const letters = Array.from(new Set(LETTER_POOL.split(""))).filter((l) => l !== lower);
  const cased = isUpper ? letters.map((l) => l.toUpperCase()) : letters;
  return [...cased, ...SYMBOLS];
}

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// A few distinct substitutes for one event, in random order.
function pickSubs(ch: string): string[] {
  const pool = substitutesFor(ch).slice();
  const n = randInt(SUB_MIN, SUB_MAX);
  const out: string[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

export default function HeroName({ enabled = true }: { enabled?: boolean }) {
  const reducedMotion = useReducedMotion();
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  const getSpans = (): HTMLSpanElement[] =>
    headingRef.current
      ? Array.from(headingRef.current.querySelectorAll<HTMLSpanElement>("span[data-char]"))
      : [];

  // ---- fixed per-character widths (measured, never guessed) ----
  // Each character box is frozen to its own rendered advance width once the
  // real font is ready, so swapping in a wider glyph never reflows the line.
  // Re-measured on resize because the display size is fluid (clamp/vw).
  useEffect(() => {
    const spans = getSpans();
    if (spans.length === 0) return;

    let raf = 0;
    function measure() {
      // Reset to intrinsic width and restore the true glyph before reading.
      for (const el of spans) {
        el.style.width = "";
        el.textContent = el.dataset.char ?? el.textContent;
      }
      // One reflow, then read + freeze.
      raf = requestAnimationFrame(() => {
        for (const el of spans) {
          const w = el.getBoundingClientRect().width;
          el.style.width = `${w}px`;
        }
      });
    }

    let ready = false;
    const start = () => {
      ready = true;
      measure();
    };
    // Fonts-ready or a short timeout, whichever first (a name measured against
    // the fallback font would freeze the wrong widths).
    const timer = window.setTimeout(start, 400);
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!ready) {
          window.clearTimeout(timer);
          start();
        }
      });
    }

    let resizeTimer: number | undefined;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(measure, 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  // ---- the cycle ----
  // setTimeout chaining only — no persistent rAF loop. When paused (offscreen,
  // tab hidden, disabled) every timer is cleared and any mid-swap character is
  // restored, so nothing is left pending and nothing is left substituted.
  useEffect(() => {
    if (reducedMotion || !enabled) return;
    const spans = getSpans();
    if (spans.length === 0) return;

    let timer: number | undefined;
    let activeSpan: HTMLSpanElement | null = null;
    let running = false;

    function restoreActive() {
      if (activeSpan) {
        activeSpan.textContent = activeSpan.dataset.char ?? "";
        activeSpan = null;
      }
    }

    function scheduleTick() {
      timer = window.setTimeout(runEvent, randInt(TICK_MIN, TICK_MAX));
    }

    function runEvent() {
      const span = spans[Math.floor(Math.random() * spans.length)];
      const ch = span.dataset.char ?? "";
      const subs = pickSubs(ch);
      activeSpan = span;
      let i = 0;
      const step = () => {
        if (i < subs.length) {
          span.textContent = subs[i++];
          timer = window.setTimeout(step, SWAP_MS);
        } else {
          span.textContent = ch;
          activeSpan = null;
          scheduleTick();
        }
      };
      step();
    }

    function play() {
      if (running) return;
      running = true;
      scheduleTick();
    }
    function pause() {
      running = false;
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      restoreActive();
    }

    // Only run while on-screen and the tab is visible.
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
  }, [reducedMotion, enabled]);

  return (
    <h1
      id="hero-heading"
      ref={headingRef}
      aria-label="Jake Park"
      className="font-display text-display text-ink"
    >
      {WORDS.map((word) => (
        <span key={word} aria-hidden="true" className="block">
          {word.split("").map((ch, ci) => (
            <span
              key={ci}
              data-char={ch}
              className="inline-block text-center align-baseline"
            >
              {ch}
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
