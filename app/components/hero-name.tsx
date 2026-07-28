"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/use-reduced-motion";

// § 01 hero — the display name roll. At rest "Jake Park" is static and legible.
// On a randomized timer a character rolls and lands on ITSELF: four identical
// copies of the glyph sit in a 2×2 grid inside a clip window, and the grid
// translates by exactly one cell so an identical copy enters one edge as the
// resting copy exits the opposite one. The glyph never changes — transform
// translate only, on two axes (vertical dominant, horizontal the accent). See
// docs/motion-spec.md and CLAUDE.md.

const WORDS = ["Jake", "Park"] as const;

// Cadence: heavy and near-continuous. Every 0.9–1.8s an eligible character
// rolls; a roll is 1150ms on a long-tailed curve (most distance early, the last
// sliver takes a disproportionate share of the time — the dragged-into-place,
// settling quality). Rolls overlap: up to three at once, starts ≥250ms apart.
const TICK_MIN = 900;
const TICK_MAX = 1800;
const ROLL_MS = 1150;
const ROLL_EASE = "cubic-bezier(0.16, 1, 0.3, 1)"; // long tail — dragged, settling
const MAX_CONCURRENT = 3;
const MIN_GAP = 250; // ms between two starts
const HEADROOM = 0.08; // clip slack over the font's ascent+descent
// Horizontal slack over a character's laid-out advance. The cell must hold the
// glyph's INK, and at this display size the ink routinely overruns the advance:
// the h1's -0.03em tracking and pair kerning shrink the laid-out advance while
// the ink itself is unchanged, so e.g. the k in "Jake" lays out at 56px but its
// ink reaches 61.17px. See the box solve in measure().
const H_HEADROOM = 0.08;
const H_MIN_RATIO = 0.55; // advance must be ≥55% of clip height to roll horizontally
const VERTICAL_WEIGHT = 0.6; // 60% vertical (down/up), 40% horizontal (left/right)

type Dir = "down" | "up" | "left" | "right";

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Start/end transforms per direction (px). Cells are one clip-height tall and
// one advance wide; a roll travels exactly one cell, and for the directions
// whose entering neighbour would otherwise be off-grid the stack starts offset
// so an identical copy is always abutting on the entering side.
function transforms(dir: Dir, w: number, h: number) {
  switch (dir) {
    case "down":
      return { start: `translate3d(0, ${-h}px, 0)`, end: "translate3d(0, 0px, 0)" };
    case "up":
      return { start: "translate3d(0, 0px, 0)", end: `translate3d(0, ${-h}px, 0)` };
    case "left":
      return { start: "translate3d(0, 0px, 0)", end: `translate3d(${-w}px, 0, 0)` };
    case "right":
      return { start: `translate3d(${-w}px, 0, 0)`, end: "translate3d(0, 0px, 0)" };
  }
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

  // ---- measurement ----
  // Clip height from the font's ascent+descent (canvas fontBoundingBox) at the
  // rendered display size + 8% headroom — not the ink of any one letter — so the
  // J descender and k/P ascenders never clip. Advance is the measured glyph
  // advance. Both re-measured on resize (the display size is fluid) and after
  // fonts load; measuring against the fallback font would bake in the wrong box.
  // Until this runs the name is plain inline text (CSS, pre-`is-armed`),
  // identical to the static hero and correct in the SSR HTML.
  useLayoutEffect(() => {
    if (reducedMotion) return; // static type: never measured, never armed
    const chars = getChars();
    if (chars.length === 0) return;

    let done = false;
    function measure() {
      // Arm before measuring, not after. Every metric below is read in the state
      // the roll will actually run in: `.char` is an inline-block and
      // `.char__clip` is an absolutely-positioned child of it. Measured
      // unarmed, `.char` is not a containing block, so the clip offset came out
      // as a viewport-relative distance (86px, 121px, …) instead of the couple
      // of pixels of centring compensation it should be. React's own render
      // sets the same class immediately afterwards, so this only brings the
      // switch forward — it never fights the render.
      headingRef.current?.classList.add("is-armed");

      const first = chars[0];
      const cs = window.getComputedStyle(first);
      const fontPx = parseFloat(cs.fontSize);
      const ctx = document.createElement("canvas").getContext("2d");
      let ascent = fontPx * 0.75;
      let descent = fontPx * 0.25;
      let cap = fontPx * 0.7; // cap height (the visible glyph height)
      if (ctx) {
        ctx.font = `${cs.fontWeight} ${fontPx}px ${cs.fontFamily}`;
        const m = ctx.measureText("Hjgpq");
        if (m.fontBoundingBoxAscent && m.fontBoundingBoxDescent) {
          ascent = m.fontBoundingBoxAscent;
          descent = m.fontBoundingBoxDescent;
        }
        const c = ctx.measureText("H");
        if (c.actualBoundingBoxAscent) cap = c.actualBoundingBoxAscent;
      }
      const box = ascent + descent;
      // Whole pixels only. Fractional box dimensions round inconsistently
      // between the clip mask and the travelling stack, so the glyph shivers
      // against its own mask; integer boxes + integer travel keep the two in
      // lockstep and let the roll stay compositor-only.
      const clipH = Math.round(box * (1 + HEADROOM));
      // Natural single-line height of a word (the display line-height). The
      // in-flow `.char__face` keeps this footprint, so the armed line is
      // pixel-identical and no line inflates; the clip is an absolute overlay.
      const block = headingRef.current?.querySelector<HTMLElement>("[data-hero-reveal]");
      const naturalLine = block ? block.getBoundingClientRect().height : fontPx;
      const pad = Math.round((clipH - naturalLine) / 2); // clip sits centred on the char box

      const report: string[] = [];
      for (const el of chars) {
        // Measured advance via a Range over the face glyph's text node (excludes
        // the parent's inter-character letter-spacing, which still applies
        // between the boxes, exactly as in the plain text).
        const face = el.querySelector<HTMLElement>(".char__face");
        const node = face?.firstChild;
        let advance = el.getBoundingClientRect().width;
        if (node) {
          const r = document.createRange();
          r.selectNodeContents(node);
          advance = r.getBoundingClientRect().width || advance;
        }
        advance = Math.round(advance); // whole pixels — see clipH note above

        // ---- horizontal cell box ----
        // The cell used to BE the laid-out advance, which is what sliced the
        // glyph mid-roll: the advance is narrowed by the h1's -0.03em tracking
        // and by pair kerning, but the ink is not. Measured at 129.6px, the ink
        // overran the cell's right edge by 5.17px (k in "Jake"), 2.64px (P),
        // 2.35px (r), 1.25px (k in "Park") and 0.85px (e). At rest that is
        // invisible because the unclipped .char__face is what shows; the slice
        // only appears while the clip is up, i.e. for the whole roll — which is
        // exactly the reported symptom.
        //
        // Solve the box from the ink instead. With the glyph centred in a cell
        // of width W, its origin sits at (W - advance) / 2, so the ink spans
        // [(W-a)/2 + inkStart, (W-a)/2 + inkEnd] and must stay inside [0, W]:
        //     W >= 2*inkEnd - a       (right edge)
        //     W >= a - 2*inkStart     (left edge)
        // taken together with the +8% headroom floor. Rounded up, then nudged so
        // (W - advance) is even — that keeps the centring offset a whole pixel,
        // which the roll needs to stay compositor-only and shiver-free.
        let boxW = Math.ceil(advance * (1 + H_HEADROOM));
        if (ctx) {
          const im = ctx.measureText(el.dataset.char ?? "");
          // actualBoundingBoxLeft is positive to the LEFT of the origin, so a
          // glyph with a positive left side bearing reports it negative.
          const inkStart = -im.actualBoundingBoxLeft;
          const inkEnd = im.actualBoundingBoxRight;
          if (Number.isFinite(inkStart) && Number.isFinite(inkEnd)) {
            boxW = Math.max(
              boxW,
              Math.ceil(2 * inkEnd - advance),
              Math.ceil(advance - 2 * inkStart)
            );
          }
        }
        if ((boxW - advance) % 2 !== 0) boxW += 1;
        // Min-travel guard: a horizontal roll travels one cell width; if that is
        // short relative to the glyph it reads as a twitch, so narrow characters
        // are vertical-only. The rule is about travel vs the visible glyph
        // height, so it is measured against cap height — measuring against the
        // full clip height (which includes descender + headroom, ~168px) would
        // exclude every letter here (widest cell ~73px) and remove the horizontal
        // axis entirely, against the spec's intent that the wide letters qualify.
        // Against cap height the split lands as expected: the narrow J and r stay
        // vertical-only, the rest roll on both axes.
        const horizontal = boxW >= H_MIN_RATIO * cap;

        // Clip box, grid cell and travel distance are now one number per axis:
        // boxW horizontally, clipH vertically. The travel in transforms() reads
        // these same two values off the dataset, so the three cannot drift apart.
        const clip = el.querySelector<HTMLElement>(".char__clip");
        if (clip) {
          clip.style.top = `${-pad}px`;
          clip.style.width = `${boxW}px`;
          clip.style.height = `${clipH}px`;
        }
        const inner = el.querySelector<HTMLElement>(".char__inner");
        if (inner) {
          inner.style.gridTemplateColumns = `${boxW}px ${boxW}px`;
          inner.style.gridTemplateRows = `${clipH}px ${clipH}px`;
          inner.style.transform = "translate3d(0, 0px, 0)";
        }
        for (const c of Array.from(el.querySelectorAll<HTMLElement>(".char__cell"))) {
          c.style.height = `${clipH}px`;
          c.style.lineHeight = `${clipH}px`;
        }

        // Widening the cell moved the glyph right by the centring offset, so the
        // clip is pulled back by the same amount and the rolling copy lands
        // exactly where the resting face sits. Measured rather than derived:
        // letter-spacing applies inside the cell too, so the centring offset is
        // not simply (boxW - advance) / 2.
        if (clip && face) {
          const cell = el.querySelector<HTMLElement>(".char__cell");
          const cellNode = cell?.firstChild;
          if (cell && cellNode && node) {
            const prevVis = clip.style.visibility;
            clip.style.visibility = "visible";
            clip.style.left = "0px";
            const fr = document.createRange();
            fr.selectNodeContents(node);
            const cr = document.createRange();
            cr.selectNodeContents(cellNode);
            const dx = fr.getBoundingClientRect().left - cr.getBoundingClientRect().left;
            clip.style.left = `${Math.round(dx)}px`;
            clip.style.visibility = prevVis;
          }
        }

        el.dataset.w = String(boxW);
        el.dataset.h = String(clipH);
        el.dataset.hq = horizontal ? "1" : "0";
        report.push(
          `${el.dataset.char}: adv=${advance} cell=${boxW}x${clipH} h-roll=${horizontal}`
        );
      }
      if (typeof window !== "undefined" && (window as unknown as { __rollDebug?: boolean }).__rollDebug) {
        console.log("[roll]", report.join(" | "));
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
  // independent WAAPI transform (native rAF, ends with the roll). One character
  // mid-roll never blocks another — a character already animating is skipped,
  // not restarted. When paused (offscreen / hidden) every timer is cleared and
  // every in-flight roll cancelled to rest, so nothing is left pending.
  useEffect(() => {
    if (reducedMotion || !armed || !gateOpen) return;
    const chars = getChars();
    if (chars.length === 0) return;

    type Roll = { anim: Animation | null; raf: number };
    const timers = new Set<number>();
    const running = new Map<HTMLElement, Roll>();
    const recent: number[] = []; // last ≤2 rolled — no repeat within three events
    let lastStart = 0;
    let active = false;

    function restore(el: HTMLElement) {
      const inner = el.querySelector<HTMLElement>(".char__inner");
      const face = el.querySelector<HTMLElement>(".char__face");
      const clip = el.querySelector<HTMLElement>(".char__clip");
      if (clip) clip.style.visibility = "hidden";
      if (face) face.style.visibility = "";
      if (inner) {
        inner.style.transform = "translate3d(0, 0px, 0)";
        inner.style.willChange = "";
      }
    }

    function rollOne() {
      if (running.size >= MAX_CONCURRENT) return;
      const now = performance.now();
      if (now - lastStart < MIN_GAP) return;
      // Eligible: not currently mid-roll (a busy character is skipped, never
      // restarted, so one roll never blocks another) and not one of the last
      // two rolled (random selection over eight letters otherwise visibly
      // repeats and reads as a bug).
      const eligible = chars
        .map((_, i) => i)
        .filter((i) => !running.has(chars[i]) && !recent.includes(i));
      if (eligible.length === 0) return;
      const idx = eligible[Math.floor(Math.random() * eligible.length)];
      const el = chars[idx];
      const inner = el.querySelector<HTMLElement>(".char__inner");
      const face = el.querySelector<HTMLElement>(".char__face");
      const clip = el.querySelector<HTMLElement>(".char__clip");
      const w = parseFloat(el.dataset.w ?? "0");
      const h = parseFloat(el.dataset.h ?? "0");
      if (!inner || !h) return;
      const canH = el.dataset.hq === "1";
      const vertical = Math.random() < VERTICAL_WEIGHT || !canH;
      const dir: Dir = vertical
        ? Math.random() < 0.5
          ? "down"
          : "up"
        : Math.random() < 0.5
          ? "left"
          : "right";
      const { start, end } = transforms(dir, w, h);

      lastStart = now;
      recent.push(idx);
      if (recent.length > 2) recent.shift();

      // Promote to its own layer and seat the entering neighbour, then swap the
      // in-flow glyph for the clip stack (both show the same glyph in the same
      // place — invisible swap). The layer must exist BEFORE the animation
      // starts, or Chrome ticks the first frames on the main thread — so the
      // .animate() call is deferred one frame, long enough for the promotion
      // and the single start-frame paint to land, after which the roll is pure
      // compositor transform.
      inner.style.willChange = "transform";
      inner.style.transform = start;
      if (face) face.style.visibility = "hidden";
      if (clip) clip.style.visibility = "visible";
      const rec: Roll = { anim: null, raf: 0 };
      running.set(el, rec);
      rec.raf = requestAnimationFrame(() => {
        if (running.get(el) !== rec) return; // paused before it started
        const anim = inner.animate(
          [{ transform: start }, { transform: end }],
          { duration: ROLL_MS, easing: ROLL_EASE, fill: "none" }
        );
        rec.anim = anim;
        const clear = () => {
          if (running.get(el) !== rec) return; // superseded by pause()
          running.delete(el);
          // Hand the slot back to the in-flow glyph, then reset the stack and
          // drop the layer on the next frame so the snap-to-rest never paints
          // through an intermediate position.
          if (clip) clip.style.visibility = "hidden";
          if (face) face.style.visibility = "";
          requestAnimationFrame(() => {
            if (running.has(el)) return; // a new roll already claimed it
            inner.style.transform = "translate3d(0, 0px, 0)";
            inner.style.willChange = "";
          });
        };
        anim.onfinish = clear;
        anim.oncancel = clear;
      });
    }

    function tick() {
      rollOne();
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
      const rolling = Array.from(running.keys());
      for (const rec of running.values()) {
        cancelAnimationFrame(rec.raf);
        rec.anim?.cancel();
      }
      running.clear();
      for (const el of rolling) restore(el); // synchronous reset, nothing left mid-roll
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
              {/* The clip window: an absolute overlay the exact size of the
                  character cell, shown only during a roll. Inside, a 2×2 grid of
                  four identical copies; the grid translates one cell so a copy
                  enters one edge as another exits the opposite — same glyph. */}
              <span className="char__clip">
                <span className="char__inner">
                  <span className="char__cell">{ch}</span>
                  <span className="char__cell">{ch}</span>
                  <span className="char__cell">{ch}</span>
                  <span className="char__cell">{ch}</span>
                </span>
              </span>
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}
