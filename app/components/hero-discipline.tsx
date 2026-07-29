"use client";

import { useEffect, useRef, useState } from "react";
import { didRoll, resetSchedule, waitFor } from "../lib/roll-scheduler";
import { useReducedMotion } from "../lib/use-reduced-motion";

// § 01 hero — the discipline line, a third line of the name block:
//
//     Jake
//     Park
//     working in machine learning
//
// It is a continuation of the name, not a separate UI element, which is why it
// is Bricolage on one baseline rather than a mono label sitting off to the side.
//
// THE GESTURE IS A WIPE, NOT A ROLL. The name already owns the roll, and giving
// the hero the same gesture twice made the second one read as a copy of the
// first. A 0.5px ink rule travels left to right across the slot: behind it the
// old phrase is gone, in front of it the new one has arrived. A pen bar
// sweeping the line clean and re-inking it. The text itself never moves and
// never fades — it is uncovered and covered.

const PHRASES = ["machine learning", "data science", "software development"] as const;

const HOLD_MS = 3200;
const WIPE_MS = 620;
// Brisk and mechanical, deliberately NOT the name's slow settle. The two
// gestures must not share a curve any more than they share a mechanism.
const WIPE_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
// The rule fades as it exits the right edge rather than vanishing on the frame
// the wipe ends.
const RULE_FADE_MS = 80;

export default function HeroDiscipline() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLParagraphElement | null>(null);
  const slotRef = useRef<HTMLSpanElement | null>(null);
  const outRef = useRef<HTMLSpanElement | null>(null);
  const inRef = useRef<HTMLSpanElement | null>(null);
  const ruleRef = useRef<HTMLSpanElement | null>(null);
  const [width, setWidth] = useState(0);

  // ---- the fixed width ----
  // The slot must fit the WIDEST phrase, not the current one, or the longest
  // clips for its whole time on screen. Two independent guarantees, because
  // this failed once already:
  //
  //   1. Structural. The slot is an inline-grid and all three phrases are laid
  //      into the SAME cell as hidden ghosts, so the browser sizes the cell to
  //      the widest of them. That is true in the server-rendered HTML, before
  //      any script runs, and stays true through a font swap.
  //   2. Measured. The width below is read after document.fonts.ready and
  //      applied as a min-width, rounded UP to a whole pixel — rounding down
  //      shaves a subpixel off the widest phrase permanently.
  //
  // min-width rather than width on purpose: it can only ever prevent a clip,
  // never cause one.
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
      probe.style.fontWeight = "500"; // the phrase's weight, not the lead-in's
      probe.style.letterSpacing = cs.letterSpacing;
      document.body.appendChild(probe);
      let widest = 0;
      for (const p of PHRASES) {
        probe.textContent = p;
        widest = Math.max(widest, probe.getBoundingClientRect().width);
      }
      probe.remove();
      slot.style.minWidth = `${Math.ceil(widest)}px`;
      // The rule travels the slot's real rendered width, which is the greater
      // of the grid's intrinsic size and the measurement above.
      setWidth(Math.ceil(slot.getBoundingClientRect().width));
    }

    const t = window.setTimeout(measure, 400);
    document.fonts?.ready.then(() => {
      window.clearTimeout(t);
      measure();
    });
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
  // setTimeout chaining and four WAAPI animations per wipe, all of which end by
  // themselves. Never a persistent rAF. Paused with every timer cleared and
  // every animation cancelled on viewport exit and on document.hidden.
  useEffect(() => {
    if (reduced || width <= 0) return;
    const root = rootRef.current;
    const out = outRef.current;
    const inc = inRef.current;
    const rule = ruleRef.current;
    if (!root || !out || !inc || !rule) return;

    let i = 0;
    let timer: number | null = null;
    let anims: Animation[] = [];
    let active = false;

    function seat() {
      out!.textContent = PHRASES[i];
      out!.style.clipPath = "inset(0 0 0 0%)";
      inc!.textContent = PHRASES[(i + 1) % PHRASES.length];
      inc!.style.clipPath = "inset(0 100% 0 0)";
      rule!.style.opacity = "0";
      rule!.style.transform = "translate3d(0, 0, 0)";
    }

    function wipe() {
      // The name roll and this must never fire inside the same 400ms window.
      // The shared scheduler answers how long to hold off; the event is
      // deferred rather than dropped, so the cycle keeps its shape.
      const wait = waitFor("discipline");
      if (wait > 0) {
        timer = window.setTimeout(wipe, wait);
        return;
      }
      didRoll("discipline");

      const opts: KeyframeAnimationOptions = {
        duration: WIPE_MS,
        easing: WIPE_EASE,
        fill: "none",
      };
      // Created back to back in one task, so they share a start time on the
      // document timeline and their edges stay at an identical x. The outgoing
      // phrase is eaten from the left, the incoming one is uncovered from the
      // left, and the rule rides the seam between them.
      anims = [
        out!.animate(
          [{ clipPath: "inset(0 0 0 0%)" }, { clipPath: "inset(0 0 0 100%)" }],
          opts
        ),
        inc!.animate(
          [{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }],
          opts
        ),
        rule!.animate(
          [
            { transform: "translate3d(0, 0, 0)" },
            { transform: `translate3d(${width}px, 0, 0)` },
          ],
          opts
        ),
        rule!.animate(
          [
            { opacity: 1, offset: 0 },
            { opacity: 1, offset: (WIPE_MS - RULE_FADE_MS) / WIPE_MS },
            { opacity: 0, offset: 1 },
          ],
          { duration: WIPE_MS, easing: "linear", fill: "none" }
        ),
      ];

      const done = () => {
        anims = [];
        // The incoming phrase is now the one on screen. Advancing the index and
        // re-seating puts that same string back into the outgoing layer, so the
        // reset paints no change.
        i = (i + 1) % PHRASES.length;
        seat();
        if (active) timer = window.setTimeout(wipe, HOLD_MS);
      };
      const last = anims[anims.length - 1];
      last.onfinish = done;
      last.oncancel = done;
    }

    function play() {
      if (active) return;
      active = true;
      timer = window.setTimeout(wipe, HOLD_MS);
    }
    function pause() {
      active = false;
      if (timer !== null) window.clearTimeout(timer);
      timer = null;
      for (const a of anims) {
        a.onfinish = null;
        a.oncancel = null;
        a.cancel();
      }
      anims = [];
      seat();
      resetSchedule();
    }

    seat();

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
    io.observe(root);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      pause();
    };
  }, [reduced, width]);

  return (
    <p ref={rootRef} data-hero-reveal className="hero-discipline font-display">
      <span className="disc-lead">working in</span>{" "}
      <span ref={slotRef} aria-hidden="true" className="disc-slot">
        {/* The ghosts: all three phrases in the same grid cell, hidden. They
            make "sized to the widest" structural rather than a number JS has to
            get right, and the first of them carries the slot's baseline so the
            line sits on ONE baseline with the lead-in. */}
        {PHRASES.map((p) => (
          <span key={p} className="disc-ghost">
            {p}
          </span>
        ))}
        <span ref={outRef} className="disc-layer">
          {PHRASES[0]}
        </span>
        <span ref={inRef} className="disc-layer disc-layer--in">
          {PHRASES[1]}
        </span>
        <span ref={ruleRef} aria-hidden="true" className="disc-rule" />
      </span>
      {/* The content, for anyone who cannot watch the slot turn over. */}
      <span className="sr-only">
        {PHRASES.slice(0, -1).join(", ")}, and {PHRASES[PHRASES.length - 1]}
      </span>
    </p>
  );
}
