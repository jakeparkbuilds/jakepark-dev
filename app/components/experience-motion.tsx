"use client";

import { useLayoutEffect } from "react";
import { createTimeline, cubicBezier } from "animejs";
import { useReducedMotion } from "../lib/use-reduced-motion";

// § 03 — the entries arrive as they are scrolled to.
//
// This wires the data-entry hooks the section has been carrying unused. It
// renders nothing: it arms the section and drives the four parts of each entry.
//
// EACH ENTRY OWNS ITS OWN TRIGGER. One section-level trigger staggering all
// five would mean a visitor landing mid-section sees entries animate that they
// already scrolled past, and entries above the fold arrive pre-animated. Five
// observers, each disconnecting the moment it fires.
//
// It fires ONCE. Scrolling back up neither reverses nor replays — the entry has
// arrived and an arrival that keeps happening is not an arrival.
//
// The SPINE IS NOT PART OF THIS. Its segments belong to the margin trace and
// keep their own scroll-driven draw; nothing here touches [data-role].

const REVEAL = cubicBezier(0.33, 1, 0.68, 1);
const DURATION = 620;
const STAGGER = 60;
/** Order is the reading order: the mark, then who, then what, then the detail.
    The date stamp sits inside .exp-head, so it arrives with the org name. */
const PARTS = [".exp-tile", ".exp-head", ".exp-role", ".exp-desc"];

export default function ExperienceMotion({ sectionId }: { sectionId: string }) {
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    // Under reduced motion nothing is armed and no observer is created, so the
    // section renders its final state — which is also what it renders with no
    // JS at all, because the hidden state is applied by the arming attribute
    // rather than being the CSS default. Content is never hidden by default.
    if (reduced) return;
    const section = document.getElementById(sectionId);
    if (!section) return;
    const entries = Array.from(section.querySelectorAll<HTMLElement>("[data-entry]"));
    if (entries.length === 0) return;

    // Armed in a layout effect, so the hidden state is in place before the
    // browser paints and nothing flashes in at full opacity first.
    section.setAttribute("data-motion", "armed");

    const timelines: ReturnType<typeof createTimeline>[] = [];
    const observers: IntersectionObserver[] = [];

    for (const entry of entries) {
      const io = new IntersectionObserver(
        ([e], self) => {
          if (!e.isIntersecting) {
            // This covers the RELOAD case: a browser that restores a scroll
            // position below § 03 delivers the observer's one initial callback
            // with the entry already above the viewport. Land it with no
            // animation — an entrance for something the reader is already past
            // would be worse than none.
            //
            // It does NOT cover jumping past the section, and cannot: an
            // observer only reports a CHANGE, and a jump from above § 03 to
            // below it is false -> false, so no callback is delivered at all.
            // That case needs no cover — an entry the reader has scrolled past
            // is off screen, and scrolling back up intersects it and animates
            // it normally. Verified: after a jump past, entries 02-05 arrive on
            // the way back, and a reload below the section lands all five.
            if (e.boundingClientRect.bottom < 0) {
              self.disconnect();
              entry.setAttribute("data-landed", "");
            }
            return;
          }
          self.disconnect();

          const targets = PARTS.map((p) => entry.querySelector<HTMLElement>(p)).filter(
            (el): el is HTMLElement => el !== null
          );
          if (targets.length === 0) return;

          const tl = createTimeline({
            defaults: { duration: DURATION, ease: REVEAL },
            // The timeline is killed the moment it lands. Five entries mean five
            // short-lived timelines and zero rAF once the last one finishes.
            onComplete: (self2) => {
              entry.setAttribute("data-landed", "");
              self2.revert?.();
            },
          });
          targets.forEach((el, i) => {
            tl.add(el, { x: [28, 0], opacity: [0, 1] }, i * STAGGER);
          });
          timelines.push(tl);
        },
        { threshold: 0.25 }
      );
      io.observe(entry);
      observers.push(io);
    }

    return () => {
      for (const io of observers) io.disconnect();
      for (const tl of timelines) tl.revert?.();
      section.removeAttribute("data-motion");
    };
  }, [reduced, sectionId]);

  return null;
}
