"use client";

import { useEffect, useId, useRef } from "react";
import { useReducedMotion } from "../lib/use-reduced-motion";

// The drafting ground — § 02 work's ground, and the site's third register.
//
// Two parts, and only one of them animates:
//
//   the GROUND  — a flat #EDEBE4 fill, full-bleed to the section's own box,
//                 hard-edged. No fade, no feather, no transition band against
//                 the grounds above and below it. It is painted from first
//                 paint and never moves.
//
//   the RULING  — a 32px lattice, heavier every fifth line, inset to the
//                 section CONTENT box rather than full-bleed, with four
//                 registration corners at that box's corners. It is uncovered
//                 top to bottom as the section is reached.
//
// WHY ONE <rect> AND NOT ~185 <line>s. The spec word is "self-drawing", and
// the literal reading is a stroke-dashoffset draw per rule. At 1920 × 4000 that
// is roughly 185 animated elements; the honest version of this effect is one
// element with one animated property. So the lattice is an SVG <pattern>
// painted onto a single <rect>, and the drawing is a clip-path wipe over that
// rect. One property, one element, and it still reads as ruling arriving
// progressively rather than switching on. The visual spec is unchanged.
//
// WHY <rect>s INSIDE THE PATTERN AND NOT <line>s. A 1px stroke is centred on
// its coordinate, so it straddles two device pixels and every rule renders as
// two half-covered columns — grey, soft, and different on either side of the
// tile boundary. A 1px-wide filled rect at an integer x covers exactly one
// device pixel at dpr 1. This is the whole reason the lattice is crisp.
//
// The tile is 160 × 160 — five 32px cells — so the major rule is the tile's own
// leading edge and the minors fall at 32/64/96/128. The "every fifth line is
// heavier" rhythm is therefore structural: it cannot drift out of phase with
// the minor grid, because it is the same grid.
//
// THE ORIGIN IS THE CONTENT BOX'S TOP-LEFT, ROUNDED. `patternUnits` is
// userSpaceOnUse and the <rect> starts at the plate's own 0,0, so the lattice
// is anchored to the content corner by construction rather than to the
// viewport. The rounding is on the plate's inset (see --dg-inset in
// globals.css): `section-pad` is `clamp(24px, 6vw, 96px)`, which resolves to
// 86.4px at 1440 — a fractional origin puts every rule on a half pixel and the
// whole lattice shivers against its own mask on scroll.

const MINORS = [32, 64, 96, 128];
const CORNERS = ["tl", "tr", "bl", "br"] as const;

export default function DraftingGround() {
  const reduced = useReducedMotion();
  const groundRef = useRef<HTMLDivElement | null>(null);
  const plateRef = useRef<HTMLDivElement | null>(null);
  // Unique per instance: two grounds on one page must not share a pattern id.
  const pid = `dg-${useId().replace(/:/g, "")}`;

  // The hidden start state is armed from here and never from the CSS default —
  // the same contract § 02's rows and thumbnails follow. With no JS, failed JS
  // or reduced motion the ruling renders at full extent, because the only thing
  // that ever clips it is an attribute this effect sets.
  //
  // No rAF and no timer: the wipe is a CSS transition and the observer
  // disconnects on its own first crossing.
  //
  // THE OBSERVER WATCHES THE GROUND, NEVER THE PLATE, AND THAT IS STRUCTURAL.
  // Observing the plate deadlocks: `clip-path` is part of what an
  // IntersectionObserver measures, so an armed plate — clipped to zero height —
  // reports `intersectionRatio: 0, isIntersecting: false` at every scroll
  // position, forever. The arming suppresses the very callback that would
  // undo it. Measured: rect top 164px in a 900px viewport, 1232px tall, ratio
  // 0.000. The ground is the same box and is never clipped, so it is the
  // honest thing to watch.
  useEffect(() => {
    const ground = groundRef.current;
    const plate = plateRef.current;
    if (!ground || !plate || reduced) return;

    plate.setAttribute("data-armed", "");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        plate.setAttribute("data-drawn", "");
        io.disconnect();
      },
      { threshold: 0.02 },
    );
    io.observe(ground);

    return () => {
      io.disconnect();
      plate.removeAttribute("data-armed");
      plate.removeAttribute("data-drawn");
    };
  }, [reduced]);

  return (
    <div className="dg" aria-hidden="true" ref={groundRef}>
      <div className="dg-plate" ref={plateRef}>
        <svg className="dg-rules" preserveAspectRatio="none" focusable="false">
          <defs>
            <pattern
              id={pid}
              width="160"
              height="160"
              patternUnits="userSpaceOnUse"
            >
              {MINORS.map((v) => (
                <rect key={`v${v}`} className="dg-minor" x={v} y="0" width="1" height="160" />
              ))}
              {MINORS.map((v) => (
                <rect key={`h${v}`} className="dg-minor" x="0" y={v} width="160" height="1" />
              ))}
              {/* The tile's own leading edges — every fifth line, by
                  construction rather than by a second grid kept in phase. */}
              <rect className="dg-major" x="0" y="0" width="1" height="160" />
              <rect className="dg-major" x="0" y="0" width="160" height="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${pid})`} />
        </svg>

        {/* Four registration corners at the content box's own corners — the
            same vocabulary as § 02's thumbnails, § 04's plates and the index's
            focus state. 0.5px muted, 14px arms, never closing into a
            rectangle. They ride inside the wipe, so they are uncovered by the
            same pass that uncovers the ruling. */}
        {CORNERS.map((c) => (
          <span key={c} className="dg-reg" data-c={c} />
        ))}
      </div>
    </div>
  );
}
