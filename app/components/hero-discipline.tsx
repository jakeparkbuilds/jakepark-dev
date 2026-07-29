"use client";

import { useEffect, useRef, useState } from "react";
import { rollStack } from "../lib/roll";
import { didRoll, resetSchedule, waitFor } from "../lib/roll-scheduler";
import { useReducedMotion } from "../lib/use-reduced-motion";

// § 01 hero — the discipline line, the hero's signature at the base of the text
// column. `working in [ machine learning ]`, the phrase rolling over on a fixed
// hold using the same mechanism as the name (see lib/roll.ts), so the hero has
// one motion vocabulary rather than two.
//
// The single most important detail is that the slot NEVER RESIZES. It is a
// fixed-width clip box measured once against the widest of the three phrases,
// so the line's ink changes and its geometry does not. A slot sized to its
// current word would relayout the line on every roll and make the whole hero
// twitch, which is exactly the failure this is built to avoid.

const PHRASES = ["machine learning", "data science", "software development"] as const;

const HOLD_MS = 2800; // the phrase is readable for this long before it moves

// The slot's height, and therefore the roll's exact travel, in whole pixels.
// Fixed in CSS rather than derived from font metrics: the travel must be an
// integer or the phrase shivers against its own mask, and the type here is a
// fixed 21px (unlike the name, which is fluid and has to be measured).
const SLOT_H = 32;

export default function HeroDiscipline() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLParagraphElement | null>(null);
  const slotRef = useRef<HTMLSpanElement | null>(null);
  const stackRef = useRef<HTMLSpanElement | null>(null);
  const [measured, setMeasured] = useState(false);

  // ---- the fixed width ----
  // Measured after document.fonts.ready — measuring against the fallback face
  // would bake in a width the real face overflows — from a probe that carries
  // the slot's own computed type, so tracking and feature settings are included
  // rather than assumed. Rounded UP to a whole pixel: rounding down clips the
  // widest phrase by a subpixel for its entire life on screen.
  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    let cancelled = false;
    function measure() {
      if (cancelled || !slot) return;
      const probe = document.createElement("span");
      const cs = getComputedStyle(slot);
      probe.style.cssText =
        "position:absolute;visibility:hidden;white-space:pre;left:-9999px;top:0";
      probe.style.font = cs.font;
      probe.style.letterSpacing = cs.letterSpacing;
      document.body.appendChild(probe);
      let widest = 0;
      for (const p of PHRASES) {
        probe.textContent = p;
        widest = Math.max(widest, probe.getBoundingClientRect().width);
      }
      probe.remove();
      slot.style.width = `${Math.ceil(widest)}px`;
      setMeasured(true);
    }

    const t = window.setTimeout(measure, 400);
    document.fonts?.ready.then(() => {
      window.clearTimeout(t);
      measure();
    });

    // The type does not scale with the viewport, so this only has to survive a
    // font swap — but a resize can still change the fallback situation, and
    // re-measuring is cheap and idempotent.
    let rt: number | undefined;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(measure, 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      window.clearTimeout(rt);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // ---- the cycle ----
  // setTimeout chaining, never a persistent rAF: each roll is one WAAPI
  // animation that ends by itself. Paused on viewport exit and on
  // document.hidden, with every timer cleared and any in-flight roll cancelled
  // to rest, so nothing is left pending.
  useEffect(() => {
    if (reduced || !measured) return;
    const stack: HTMLElement | null = stackRef.current;
    const root = rootRef.current;
    if (!stack || !root) return;
    // Narrowed once here; the closures below all run while this effect is
    // mounted, so the element cannot have become null by the time they fire.
    const el = stack;

    const cells = Array.from(stack.querySelectorAll<HTMLElement>(".disc-cell"));
    if (cells.length < 2) return;
    const [incoming, current] = cells;

    const rest = `translate3d(0, ${-SLOT_H}px, 0)`;
    const travelled = "translate3d(0, 0px, 0)";

    let i = 0; // index of the phrase now showing
    let timer: number | null = null;
    let anim: Animation | null = null;
    let active = false;

    const clear = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
    };

    function seat() {
      el.style.transform = rest;
      current.textContent = PHRASES[i];
      incoming.textContent = PHRASES[(i + 1) % PHRASES.length];
    }

    function step() {
      // The name roll and this one must never fire inside the same 400ms
      // window, or the hero reads as two unrelated animations. The shared
      // scheduler answers how long to wait; the event is deferred, never
      // dropped, so the cycle stays intact.
      const wait = waitFor("discipline");
      if (wait > 0) {
        timer = window.setTimeout(step, wait);
        return;
      }
      didRoll("discipline");
      el.style.willChange = "transform";
      anim = rollStack(el, rest, travelled, () => {
        anim = null;
        // The stack has travelled one box, so the incoming phrase is the one on
        // screen. Advance the index and re-seat: both cells briefly carry the
        // same string at the moment the transform snaps back, so the reset is
        // invisible.
        i = (i + 1) % PHRASES.length;
        current.textContent = PHRASES[i];
        el.style.transform = rest;
        el.style.willChange = "";
        incoming.textContent = PHRASES[(i + 1) % PHRASES.length];
        if (active) timer = window.setTimeout(step, HOLD_MS);
      });
    }

    function play() {
      if (active) return;
      active = true;
      timer = window.setTimeout(step, HOLD_MS);
    }
    function pause() {
      active = false;
      clear();
      anim?.cancel();
      anim = null;
      seat();
      resetSchedule();
    }

    seat();

    let onScreen = false;
    const sync = () => {
      if (onScreen && !document.hidden) play();
      else pause();
    };
    const io = new IntersectionObserver((entries) => {
      onScreen = entries[0]?.isIntersecting ?? false;
      sync();
    }, { threshold: 0 });
    io.observe(root);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      pause();
    };
  }, [reduced, measured]);

  return (
    <p ref={rootRef} data-hero-reveal className="hero-discipline">
      <span className="hero-discipline-label font-mono">working in</span>

      {/* The content, for anyone who cannot see the slot turn. The rolling box
          is decoration over this; this is the sentence. */}
      <span className="sr-only">
        {PHRASES.slice(0, -1).join(", ")}, and {PHRASES[PHRASES.length - 1]}
      </span>

      <span ref={slotRef} aria-hidden="true" className="disc-slot font-display">
        <span ref={stackRef} className="disc-stack">
          {/* Order is [incoming, current] and the stack rests pulled UP by one
              box, so `current` is what shows. Rolling to 0 slides the stack
              down: current leaves by the bottom edge as incoming arrives at the
              top. The resting transform is the CSS default, not something JS
              applies, so the server-rendered HTML already shows the first
              phrase and the reduced-motion path needs no script at all. */}
          <span className="disc-cell">{PHRASES[1]}</span>
          <span className="disc-cell">{PHRASES[0]}</span>
        </span>
      </span>
    </p>
  );
}
