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
// IT REPLAYS. An entry animates every time it comes into view, from above or
// from below, and the gesture is the same one either way — never the enter
// reversed. This reverses the earlier once-only rule: the arrival now reads as
// how § 03 draws itself rather than as a thing that happened at first sight.
//
// The reset is keyed to the entry leaving COMPLETELY (ratio 0), not to it
// dropping under the play threshold. Resetting at 0.25 would re-arm an entry
// that is still a quarter on screen, so a slow scroll at the boundary would
// blink it.
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

    const observers: IntersectionObserver[] = [];
    // One live timeline per entry at most. A replay reverts the previous one
    // first, so an entry crossed quickly in both directions can never end up
    // with two timelines writing to the same four elements.
    const live = new Map<HTMLElement, ReturnType<typeof createTimeline>>();

    const stop = (entry: HTMLElement) => {
      const tl = live.get(entry);
      if (tl) {
        tl.revert?.();
        live.delete(entry);
      }
    };

    for (const entry of entries) {
      // `playing` is what makes this idempotent: the observer fires on every
      // threshold crossing, and only a full exit (ratio 0) clears the flag, so
      // an entry cannot restart while it is still on screen.
      let playing = false;

      const io = new IntersectionObserver(
        ([e]) => {
          if (e.intersectionRatio === 0) {
            // Fully gone. Revert the timeline (which drops its inline styles)
            // and remove [data-landed], which hands the entry back to the armed
            // CSS at opacity 0 — ready to arrive again from either direction.
            stop(entry);
            entry.removeAttribute("data-landed");
            playing = false;
            return;
          }
          if (playing || e.intersectionRatio < 0.25) return;
          playing = true;

          const targets = PARTS.map((p) => entry.querySelector<HTMLElement>(p)).filter(
            (el): el is HTMLElement => el !== null
          );
          if (targets.length === 0) return;

          stop(entry);
          const tl = createTimeline({
            defaults: { duration: DURATION, ease: REVEAL },
            // The timeline is killed the moment it lands, so nothing is left
            // carrying a transform or a will-change between plays and there is
            // no rAF running once the visible entries have arrived.
            onComplete: (self2) => {
              entry.setAttribute("data-landed", "");
              self2.revert?.();
              live.delete(entry);
            },
          });
          targets.forEach((el, i) => {
            tl.add(el, { x: [28, 0], opacity: [0, 1] }, i * STAGGER);
          });
          live.set(entry, tl);
        },
        // 0 is the reset edge, 0.25 the play edge. Both are needed: an observer
        // reports crossings of the thresholds it was given and nothing else.
        { threshold: [0, 0.25] }
      );
      io.observe(entry);
      observers.push(io);
    }

    return () => {
      for (const io of observers) io.disconnect();
      for (const tl of live.values()) tl.revert?.();
      live.clear();
      section.removeAttribute("data-motion");
    };
  }, [reduced, sectionId]);

  return null;
}
