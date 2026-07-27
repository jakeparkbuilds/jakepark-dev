"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createTimeline, cubicBezier, stagger, utils } from "animejs";

// § 01 hero — the loader set piece. "The plate is drawn." The page opens as
// empty paper; the DC map draws itself at viewport center, then travels to its
// hero slot as the rest of the hero arrives around it. One continuous event on
// a single DOM node (the real hero map — never a cross-faded copy). See
// docs/motion-spec.md ("Hero / loader") and CLAUDE.md.
//
// This controller only reaches into DOM the server already rendered — the hero
// text is in the SSR HTML and merely masked by html.intro (globals.css), so its
// render is never deferred. It runs only when the pre-paint gate in layout.tsx
// added `html.intro` (first visit of the session, motion allowed); otherwise it
// does nothing and the hero is already in its final state.

const DRAW = cubicBezier(0.22, 1, 0.36, 1); // long, decisive
const REVEAL = cubicBezier(0.33, 1, 0.68, 1); // soft settle

// Choreography (ms from sequence start). Natural end ~2156ms < the 2400ms hard
// cap; a 3000ms failsafe force-finishes regardless of animation state.
const T = {
  boundary: 120,
  hoods: 760,
  star: 1180,
  transit: 1400,
  reveal: 1500,
  finish: 2200,
  failsafe: 3000,
};

function markDone() {
  const w = window as unknown as { __heroIntroDone?: boolean };
  if (w.__heroIntroDone) return;
  w.__heroIntroDone = true;
  document.dispatchEvent(new Event("hero-intro-done"));
}

export default function HeroIntro() {
  const [running, setRunning] = useState(false);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Decide once, after mount: run only if the pre-paint gate marked this a
  // first visit. This is a deliberate two-phase mount — the overlay must be
  // absent in the SSR HTML (server can't read the client-only `intro` class)
  // and appear only after hydration, so it can't be a lazy initial state
  // without a hydration mismatch.
  useLayoutEffect(() => {
    if (document.documentElement.classList.contains("intro")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
      setRunning(true);
    } else {
      markDone(); // nothing to wait for — let the glyph cycle start immediately
    }
  }, []);

  useLayoutEffect(() => {
    if (!running) return;

    const mapSvg = document.querySelector<SVGSVGElement>("[data-dc-map]");
    const boundary = document.querySelector<SVGPathElement>("[data-dc-boundary]");
    const star = document.querySelector<SVGGElement>("[data-georgetown]");
    const overlay = overlayRef.current;
    const hoods = Array.from(
      document.querySelectorAll<SVGPathElement>("[data-dc-hoods] path")
    ).sort((a, b) => {
      // north (smaller y) to south, by vertical centroid, so the fill sweeps
      // down the district rather than appearing at random.
      const ba = a.getBBox();
      const bb = b.getBBox();
      return ba.y + ba.height / 2 - (bb.y + bb.height / 2);
    });
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>("[data-hero-reveal]")
    );

    let done = false;
    let tl: ReturnType<typeof createTimeline> | null = null;
    let finishTimer = 0;
    let failsafeTimer = 0;

    function finish() {
      if (done) return;
      done = true;
      window.clearTimeout(finishTimer);
      window.clearTimeout(failsafeTimer);
      tl?.pause();
      // Stop anime touching these, then strip every inline style so the natural
      // CSS (final, visible) governs. Remove html.intro first so its hiding
      // rules are gone before the inline styles are cleared — no flash.
      const all: (Element | null)[] = [mapSvg, boundary, star, overlay, ...hoods, ...reveals];
      utils.remove(all.filter(Boolean) as Element[]);
      document.documentElement.classList.remove("intro");
      const clear = (el: Element | null, props: string[]) => {
        if (!el) return;
        const s = (el as HTMLElement | SVGElement).style;
        for (const p of props) s.removeProperty(p);
      };
      clear(mapSvg, ["transform", "visibility", "z-index", "position", "will-change"]);
      clear(star, ["opacity"]);
      clear(boundary, ["stroke-dasharray", "stroke-dashoffset"]);
      for (const p of hoods) clear(p, ["stroke-dasharray", "stroke-dashoffset"]);
      for (const r of reveals) clear(r, ["opacity", "transform"]);
      setRunning(false); // unmount the overlay
      markDone(); // release the glyph cycle
    }

    // If the map isn't present for some reason, don't gate the page on it.
    if (!mapSvg || !boundary) {
      finish();
      return;
    }

    // ---- preset the opening frame (before the first animation tick) ----
    const rect = mapSvg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    // Center-based translate: with transform-origin center, the element's
    // center moves by exactly (tx, ty) regardless of scale.
    const tx = window.innerWidth / 2 - cx;
    const ty = window.innerHeight / 2 - cy;

    const boundaryLen = boundary.getTotalLength();
    utils.set(boundary, { strokeDasharray: boundaryLen, strokeDashoffset: boundaryLen });
    for (const p of hoods) {
      const len = p.getTotalLength();
      utils.set(p, { strokeDasharray: len, strokeDashoffset: len });
    }
    if (star) utils.set(star, { opacity: 0 });
    utils.set(mapSvg, {
      position: "relative",
      zIndex: 50, // above the paper overlay (z-40) for the whole draw + transit
      translateX: tx,
      translateY: ty,
      scale: 0.46,
      visibility: "visible", // was hidden by html.intro until now
    });

    // ---- the timeline ----
    tl = createTimeline({ defaults: {} });
    tl.add(
      boundary,
      { strokeDashoffset: [boundaryLen, 0], duration: 900, ease: DRAW },
      T.boundary
    );
    if (hoods.length > 0) {
      tl.add(
        hoods,
        { strokeDashoffset: 0, duration: 340, delay: stagger(14), ease: REVEAL },
        T.hoods
      );
    }
    if (star) {
      tl.add(star, { opacity: [0, 1], duration: 260, ease: "linear" }, T.star);
    }
    // Transit: transform only (translate + scale on the same node), never
    // width/height/left/top.
    tl.add(
      mapSvg,
      { translateX: 0, translateY: 0, scale: 1, duration: 700, ease: DRAW },
      T.transit
    );
    if (overlay) {
      tl.add(overlay, { opacity: [1, 0], duration: 200, ease: "linear" }, T.transit);
    }
    if (reveals.length > 0) {
      tl.add(
        reveals,
        {
          opacity: [0, 1],
          translateY: [12, 0],
          duration: 520,
          delay: stagger(34),
          ease: REVEAL,
        },
        T.reveal
      );
    }

    finishTimer = window.setTimeout(finish, T.finish);
    failsafeTimer = window.setTimeout(finish, T.failsafe);

    // On unmount (incl. React StrictMode's dev double-invoke) stop the timers
    // and this timeline; a re-mount re-presets and replays cleanly.
    return () => {
      window.clearTimeout(finishTimer);
      window.clearTimeout(failsafeTimer);
      tl?.pause();
    };
  }, [running]);

  if (!running) return null;
  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      // The paper field. Above the content and nav (z-10), below the map
      // (z-50) and the cursor (z-9999). Non-interactive; fades to transparent
      // during transit and unmounts on finish.
      className="pointer-events-none fixed inset-0 z-40 bg-paper"
    />
  );
}
