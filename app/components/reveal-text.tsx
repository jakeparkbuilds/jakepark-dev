"use client";

import { useEffect, useRef } from "react";
import { registerSection } from "../lib/scroll-controller";
import { useReducedMotion } from "../lib/use-reduced-motion";

// Per-character scroll reveal for § 02's paragraphs and § 07's blurb.
//
// Reading the page is what reveals it: each character carries its own threshold
// along the paragraph's progress through the viewport, so the copy inks in from
// its first character to its last as it crosses the screen, and re-fades if you
// scroll back up.
//
// COLOUR, NOT OPACITY. The reference fades from 0.2 opacity, which on paper
// would put the unread text at roughly 1.2:1 against the ground — invisible,
// and § 11 does not allow type a reader must read to go below #6B6455. The
// unrevealed value is #C4BDB0, which is quiet but present: the paragraph reads
// as drawn-but-not-yet-inked rather than as missing.
//
// PERFORMANCE. Colours are written straight to the spans through refs. There is
// no state, so there is no re-render — not on scroll, not ever after mount. A
// paragraph that is off screen writes nothing at all, and a paragraph whose
// progress has not moved since the last frame writes nothing either.

const UNREAD = [196, 189, 176]; // #C4BDB0
const READ = [46, 42, 36]; // #2E2A24 — the body token
/** How wide, in progress units, a character's own transition is. */
const RAMP = 0.06;

function mix(t: number) {
  const r = Math.round(UNREAD[0] + (READ[0] - UNREAD[0]) * t);
  const g = Math.round(UNREAD[1] + (READ[1] - UNREAD[1]) * t);
  const b = Math.round(UNREAD[2] + (READ[2] - UNREAD[2]) * t);
  return `rgb(${r},${g},${b})`;
}

export default function RevealText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLParagraphElement | null>(null);
  const spansRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    // Under reduced motion nothing subscribes, so nothing ever repaints the
    // spans — and because they RENDER at the read colour, that leaves the
    // paragraph fully legible with no scroll linkage and no JS. The branch is
    // here, not in render: rendering differently on the client than on the
    // server is a hydration mismatch React does not repair, and § 05 already
    // paid for that lesson once.
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const spans = spansRef.current;
    const total = spans.length;
    if (total === 0) return;

    let last = -1;
    // Paint the unread state before the first frame so the paragraph does not
    // flash fully inked on mount.
    for (const s of spans) s.style.color = mix(0);

    return registerSection(el, (_p, rect) => {
      const vh = window.innerHeight;
      // The reference's ['start 0.8', 'end 0.2']: 0 when the top reaches 80% of
      // the viewport, 1 when the bottom reaches 20%.
      const span = 0.6 * vh + rect.height;
      const progress = span > 0 ? (0.8 * vh - rect.top) / span : 0;

      // Off screen, and already resolved to the end it is off screen past:
      // nothing to write. Note this still runs the two clamped writes as the
      // paragraph leaves, so it never freezes half-revealed.
      const p = progress < 0 ? 0 : progress > 1 ? 1 : progress;
      if (p === last) return;
      last = p;

      // One pass, all characters, no reads.
      //
      // Thresholds are packed into [0, 1 - RAMP], not [0, 1]: a last character
      // whose threshold is (total-1)/total needs progress 1.048 to finish its
      // own ramp, and progress stops at 1. Measured — the paragraph ended its
      // window with its last five characters still part-inked at #A7A095.
      for (let i = 0; i < total; i++) {
        const t = (p - (i / total) * (1 - RAMP)) / RAMP;
        spans[i].style.color = mix(t <= 0 ? 0 : t >= 1 ? 1 : t);
      }
    });
  }, [reduced]);

  const text = children;
  spansRef.current = [];

  return (
    <p ref={ref} className={className}>
      {/* The characters are decoration as far as assistive tech is concerned —
          17 individually-coloured spans would otherwise be announced as 17
          fragments. The real string follows, once, for screen readers. */}
      <span aria-hidden="true">
        {Array.from(text).map((ch, i) =>
          // Whitespace gets no span: it carries no ink, so colouring it is
          // wasted work on every frame.
          ch === " " ? (
            " "
          ) : (
            <span
              key={i}
              ref={(node) => {
                if (node) spansRef.current.push(node);
              }}
            >
              {ch}
            </span>
          )
        )}
      </span>
      <span className="sr-only">{text}</span>
    </p>
  );
}
