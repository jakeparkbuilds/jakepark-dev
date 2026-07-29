"use client";

import { useEffect, useRef, useState } from "react";
import { getSmoothScroll, registerSection } from "../lib/scroll-controller";
import { useReducedMotion } from "../lib/use-reduced-motion";

// § 07 — the counter-scrolling type bands. Set piece 6.
//
// Two full-bleed rows of outlined display type running against each other,
// driven by scroll position and by nothing else. THIS IS THE WHOLE ARGUMENT: a
// band that moves while the page is still is the marquee the spec bans, and one
// that moves only because the reader moved is a scroll instrument. Never add an
// idle animation here, however slow.
//
// Set in the display face at hairline stroke with no fill, so the type reads as
// drawn rather than printed — the same plotter vocabulary as the map and the
// project figures, at the largest scale on the site.

const BANDS = [
  "software development · machine learning · data science · ",
  "washington d.c. · georgetown · alexandria · seoul · ",
];

/** Copies of each string in the DOM. Three is what makes the wrap seamless: one
    on screen, one entering, one leaving. */
const COPIES = 3;
const SHIFT = 400; // the reference's constant offset

export default function TypeBands({ sectionId }: { sectionId: string }) {
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
    const section = document.getElementById(sectionId);
    if (!section) return;

    let unsubscribe: (() => void) | null = null;
    // One repetition's measured width, per band. Measured, never assumed: the
    // wrap modulo has to be the real laid-out width of one copy or the loop
    // shows a seam every cycle.
    let reps: number[] = [];

    const measure = () => {
      reps = repRefs.current.map((r) => (r ? r.getBoundingClientRect().width : 0));
    };

    const frame = (_p: number, rect: DOMRect) => {
      const scroll = getSmoothScroll();
      const sectionTop = rect.top + scroll;
      const mult = window.innerWidth < 1200 ? 0.18 : 0.22;
      const offset = (scroll - sectionTop + window.innerHeight) * mult;

      for (let i = 0; i < rowRefs.current.length; i++) {
        const row = rowRefs.current[i];
        const rep = reps[i];
        if (!row || !rep) continue;
        // Wrap into one repetition, then sit the row one repetition to the left
        // so all three copies stay in play at either end of the travel. Without
        // the modulo the transform grows without bound and the band eventually
        // runs off its own content.
        const t = (((offset - SHIFT) % rep) + rep) % rep;
        const x = i === 0 ? t - rep : -t;
        row.style.transform = `translate3d(${x}px, 0, 0)`;
      }
    };

    // The loop is gated on the section: § 07 is the last thing on the page, so
    // for most of a visit it is nowhere near the viewport and the subscription
    // should not exist at all.
    const attach = () => {
      if (unsubscribe) return;
      measure();
      unsubscribe = registerSection(section, frame);
    };
    const detach = () => {
      unsubscribe?.();
      unsubscribe = null;
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
      rt = window.setTimeout(measure, 200);
    };
    window.addEventListener("resize", onResize);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(rt);
      detach();
    };
  }, [reduced, sectionId, single]);

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
