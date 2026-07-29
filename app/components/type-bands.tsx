"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/use-reduced-motion";

// § 07 — the counter-scrolling type bands. Set piece 6.
//
// Two full-bleed rows of outlined display type drifting against each other on a
// continuous loop: band 1 left to right, band 2 right to left, both at 28px/s.
// Slow and steady — a drifting band, not a ticker.
//
// This is the site's ONLY autoplaying motion and a deliberate exception to the
// marquee ban (§ 7). The exemption rests on what the bands are — content, set
// as hairline drawing — not on what moves them. Nothing else on the site may
// acquire an idle animation on the strength of this precedent.
//
// One rAF for both bands, gated on § 07's intersection and on document.hidden,
// cancelled the moment either goes false. This is the third and last sanctioned
// persistent loop.

const BANDS = [
  "software development · machine learning · data science · ",
  "washington d.c. · georgetown · alexandria · seoul · ",
];

/** Copies of each string in the DOM. Three is what makes the wrap seamless: one
    on screen, one entering, one leaving. */
const COPIES = 3;
/** px per second, both bands, opposite directions. */
const SPEED = 28;

// The gate observes the BANDS, not § 07: the bands sit in the section's lower
// third, so § 07 can be intersecting with the bands still well below the fold.
// Observing the thing that actually moves is the tighter of the two.
export default function TypeBands() {
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const repRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [single, setSingle] = useState(false);

  // Below 900px only band 1 renders — two bands at phone width is noise.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const sync = () => setSingle(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const root = rootRef.current;
    if (!root) return;

    let rafId: number | null = null;
    let last = 0;
    // Travel accumulates in seconds-of-motion, not in frames, so the drift is
    // the same speed on a 60Hz and a 120Hz display and does not jump forward
    // after the loop has been parked.
    let travel = 0;
    // One repetition's measured width, per band. Measured, never assumed: the
    // wrap modulo has to be the real laid-out width of one copy or the loop
    // shows a seam every cycle.
    let reps: number[] = [];

    const measure = () => {
      reps = repRefs.current.map((r) => (r ? r.getBoundingClientRect().width : 0));
    };

    const paint = () => {
      for (let i = 0; i < rowRefs.current.length; i++) {
        const row = rowRefs.current[i];
        const rep = reps[i];
        if (!row || !rep) continue;
        // Wrap into one repetition, then sit the row one repetition to the left
        // so all three copies stay in play at either end of the travel. Without
        // the modulo the transform grows without bound and the band eventually
        // runs off its own content.
        const t = ((travel % rep) + rep) % rep;
        const x = i === 0 ? t - rep : -t;
        row.style.transform = `translate3d(${x}px, 0, 0)`;
      }
    };

    const frame = (now: number) => {
      // Clamp the first frame after a pause: a tab restored after a minute
      // hands back an enormous delta, which would teleport the bands.
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      travel += SPEED * dt;
      paint();
      rafId = requestAnimationFrame(frame);
    };

    // § 07 is the last thing on the page, so for most of a visit it is nowhere
    // near the viewport and this loop should not exist at all.
    const attach = () => {
      if (rafId !== null) return;
      measure();
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    };
    const detach = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    };

    let onScreen = false;
    const sync = () => {
      if (onScreen && !document.hidden) attach();
      else detach();
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

    let rt: number | undefined;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => {
        measure();
        paint();
      }, 200);
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      detach();
    };
  }, [reduced, single]);

  const bands = single ? BANDS.slice(0, 1) : BANDS;

  return (
    <div ref={rootRef} aria-hidden="true" className="type-bands">
      {bands.map((text, i) => (
        <div
          key={i}
          className="type-band"
          ref={(node) => {
            rowRefs.current[i] = node;
          }}
        >
          {Array.from({ length: COPIES }, (_, copy) => (
            <span
              key={copy}
              className="type-band-rep"
              ref={
                copy === 0
                  ? (node) => {
                      repRefs.current[i] = node;
                    }
                  : undefined
              }
            >
              {text}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
