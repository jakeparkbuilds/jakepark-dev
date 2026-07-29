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
// The two boundary halves ONLY. Near-linear through the middle so the pen speed
// stays roughly constant: the west half is a ragged 24-vertex shoreline and the
// east half is two straight survey lines, so they cover very different path
// lengths per unit of visual distance. An ease-out curve here would visibly
// stall the straight edge while the shoreline was still running.
const BOUNDARY_EASE = cubicBezier(0.4, 0, 0.6, 1);
const BOUNDARY_MS = 1000;

// Choreography (ms from sequence start). Natural end ~2256ms < the 2400ms hard
// cap; a 3000ms failsafe force-finishes regardless of animation state.
const T = {
  boundary: 120,
  hoods: 1000,
  star: 1280,
  transit: 1500,
  reveal: 1600,
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
    // The two visible halves. [data-dc-boundary] is the unpainted hit-test ring
    // and is never animated.
    const halves = [
      document.querySelector<SVGPathElement>("[data-dc-boundary-west]"),
      document.querySelector<SVGPathElement>("[data-dc-boundary-east]"),
    ].filter(Boolean) as SVGPathElement[];
    const star = document.querySelector<SVGGElement>("[data-georgetown]");
    const overlay = overlayRef.current;
    // Scope cut: the 46 clusters fade in together as ONE group (a single
    // opacity animation), not 46 staggered stroke draws — cheaper on bundle and
    // CPU, and the first thing to trim.
    const hoodGroup = document.querySelector<SVGGElement>("[data-dc-hoods]");
    // Document order is not the arrival order. <Nav /> precedes <Hero /> in the
    // document, so the nav's name would lead the stagger; it belongs second,
    // after the mono label. `data-hero-reveal` therefore carries an optional
    // rank. Array.prototype.sort is stable, so anything unranked (value "",
    // which is 0) keeps its document order ahead of the ranked elements.
    const reveals = Array.from(
      document.querySelectorAll<HTMLElement>("[data-hero-reveal]")
    ).sort(
      (a, b) => Number(a.dataset.heroReveal || 0) - Number(b.dataset.heroReveal || 0)
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
      const all: (Element | null)[] = [mapSvg, ...halves, star, overlay, hoodGroup, ...reveals];
      utils.remove(all.filter(Boolean) as Element[]);
      document.documentElement.classList.remove("intro");
      const clear = (el: Element | null, props: string[]) => {
        if (!el) return;
        const s = (el as HTMLElement | SVGElement).style;
        for (const p of props) s.removeProperty(p);
      };
      clear(mapSvg, ["transform", "visibility", "z-index", "position", "will-change"]);
      clear(star, ["opacity"]);
      // Normally already done by undashHalves() when the draw completed; this is
      // the failsafe path (a forced finish mid-draw).
      for (const h of halves) clear(h, ["stroke-dasharray", "stroke-dashoffset"]);
      clear(hoodGroup, ["opacity"]);
      for (const r of reveals) clear(r, ["opacity", "transform"]);
      setRunning(false); // unmount the overlay
      markDone(); // release the glyph cycle
    }

    // If the map isn't present for some reason, don't gate the page on it.
    if (!mapSvg || halves.length === 0) {
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

    // Dash length is measured in CSS px, not user units, and BEFORE the opening
    // transform below is applied. Both halves of that are load-bearing.
    //
    // These paths carry vector-effect="non-scaling-stroke". That makes the
    // browser resolve the dash pattern in the SVG's viewBox-to-CSS space —
    // NOT in user units, and (measured, not assumed) NOT including the CSS
    // transform applied to the <svg> element itself, even though getScreenCTM()
    // reports that transform. So the correct dash length is the path's length in
    // the space it occupies at scale 1.0, which is exactly what getScreenCTM()
    // returns while the map is still untransformed.
    //
    // Both errors are observable:
    //   - The old code used getTotalLength() alone (user units, 1098 for the
    //     ring) against a real dash space length of 1655px. The pattern is
    //     "dash 1098 / gap 1098", so the last 34% of the ring — exactly the two
    //     north edges, which are the tail of DC_OUTLINE — fell in the gap. The
    //     boundary appeared to vanish after the transit and popped back in when
    //     finish() finally cleared the dash.
    //   - Measuring after the 0.46 transform (dash 385 against a 838px dash
    //     space) makes the pattern REPEAT inside the path, so a second
    //     disconnected run paints near the south point while the first is still
    //     descending from the north.
    const dashLen = new Map<SVGPathElement, number>();
    for (const h of halves) {
      const len = h.getTotalLength() * (h.getScreenCTM()?.a ?? 1);
      dashLen.set(h, len);
      utils.set(h, { strokeDasharray: len, strokeDashoffset: len });
    }

    if (hoodGroup) utils.set(hoodGroup, { opacity: 0 });
    if (star) utils.set(star, { opacity: 0 });
    utils.set(mapSvg, {
      position: "relative",
      zIndex: 50, // above the paper overlay (z-40) for the whole draw + transit
      translateX: tx,
      translateY: ty,
      scale: 0.46,
      visibility: "visible", // was hidden by html.intro until now
    });
    // Strip the dash properties outright when the draw completes — before the
    // transit begins. After this the path is an ordinary stroke with no dash
    // geometry at all, so the transit's scale change has nothing to recompute
    // against and no later re-render can resurrect the gaps.
    //
    // Safe to strip the inline styles directly: this runs from the draw's own
    // onComplete, so that animation has ticked for the last time and anime will
    // not write to these properties again.
    const undashHalves = (el: SVGPathElement) => {
      el.style.removeProperty("stroke-dasharray");
      el.style.removeProperty("stroke-dashoffset");
    };

    // ---- the timeline ----
    tl = createTimeline({ defaults: {} });
    // Both halves start in the SAME frame and run the same duration, so the
    // outline unzips from the north corner and the two pens meet at the south
    // point together.
    for (const h of halves) {
      const len = dashLen.get(h) ?? 0;
      tl.add(
        h,
        {
          strokeDashoffset: [len, 0],
          duration: BOUNDARY_MS,
          ease: BOUNDARY_EASE,
          onComplete: () => undashHalves(h),
        },
        T.boundary
      );
    }
    if (hoodGroup) {
      // Fade the whole cluster group in as one unit. Ends at opacity 1 — the
      // settled hero's state (each path already carries strokeOpacity 0.34) —
      // so finishing hands off with no pop.
      tl.add(hoodGroup, { opacity: [0, 1], duration: 420, ease: REVEAL }, T.hoods);
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
