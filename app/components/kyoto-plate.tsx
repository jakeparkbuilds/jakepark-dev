"use client";

import Image from "next/image";
import { useState } from "react";

// § 05 connect — the print, and its reverse.
//
// THIS IS A PHOTOGRAPHIC PRINT BEING TURNED OVER, not a flip card. The back of
// a print is where you write what is on it, so the seven interests live there.
// Two things follow from that framing and neither is decorative:
//
//   THE REGISTRATION CORNERS DO NOT TURN. They belong to the MOUNT, not to the
//   print, so they are siblings of the rotating element rather than children of
//   it. A corner that rotates with the plate mirrors itself at 180deg and the
//   illusion dies — it stops being a print on a page and becomes a card.
//
//   THE PROJECTION IS NEAR-ORTHOGRAPHIC. `perspective` sits on the button at
//   2400px against a plate 296–423px wide, so the far edge foreshortens by a
//   few percent instead of lunging at the viewer. A short perspective is
//   exactly what makes this read as a stock component.
//
// Transform only. No shadow at any point in the turn, no radius, no lighting,
// no gradient on the edge, no scale. CSS owns the transform — there is no JS
// tween and no rAF, and the loop inventory stays at three.

const INTERESTS = [
  "long-distance running",
  "golf",
  "dollar slice pizza",
  "country music",
  "sudoku",
  "basketball",
  "weightlifting",
];

const FRONT_CAPTION = "kyoto, japan · 2025";
const BACK_CAPTION = "interests";

export default function KyotoPlate() {
  // `pinned` survives the pointer leaving; `hovered` does not. turned is either.
  // Clicking while hovering unpins but leaves it turned until the pointer goes,
  // which is the only reading that does not fight the hover.
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const turned = pinned || hovered;

  return (
    <figure className="connect-portrait">
      <div className="cn-print" data-turned={turned ? "" : undefined}>
        {/* The one element that rotates. It is a SIBLING of the button, not a
            child of it: a <ul> inside a <button> is invalid content and the
            browser drops the whole list out of the accessibility tree —
            measured, the back face exposed nothing at all. The button is a
            transparent overlay on top instead, which also keeps the corners and
            the focus brackets out of the rotation. */}
        <div className="cn-turn">
          <div className="cn-face cn-face-front" inert={turned} aria-hidden={turned}>
            <Image
              src="/portrait.jpg"
              alt="Jake Park in Kyoto, Japan"
              // 4284x5712, NOT the 5712x4284 the raw pixel matrix reports.
              // The file carries an EXIF rotation, so `sips` reads it
              // landscape while every browser and next/image's own pipeline
              // render it portrait.
              width={4284}
              height={5712}
              quality={72}
              sizes="(min-width: 900px) 45vw, 92vw"
              className="cn-portrait-img saturate-[.85]"
            />
          </div>

          {/* The reverse. Paper with a 0.5px hairline edge, because the back of
              a print is a bounded object — without the edge it reads as a hole
              in the page rather than as the other side of the photograph. See
              CLAUDE.md § 4 for the exception. */}
          <div className="cn-face cn-face-back" inert={!turned} aria-hidden={!turned}>
            <ul className="cn-back-list">
              {INTERESTS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <button
          type="button"
          className="cn-turn-btn"
          aria-pressed={turned}
          aria-label="turn over — interests"
          // Mouse only. A touch fires pointerenter and never the matching
          // leave, which is exactly how a hover state gets stuck on a phone —
          // so a tap goes through `click` and toggles `pinned` instead, and
          // `hovered` is never set on that path at all.
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") setHovered(true);
          }}
          onPointerLeave={() => setHovered(false)}
          onClick={() => setPinned((v) => !v)}
        >
          {/* Focus: four accent registration brackets, the § 02 / § 04 motif.
              On the button, which does not rotate. */}
          <span aria-hidden="true" className="cn-focus" data-c="tl" />
          <span aria-hidden="true" className="cn-focus" data-c="tr" />
          <span aria-hidden="true" className="cn-focus" data-c="bl" />
          <span aria-hidden="true" className="cn-focus" data-c="br" />
        </button>

        {/* The mount's corners. Outside the button entirely — they never turn,
            never move, and are not part of the target. */}
        <span aria-hidden="true" className="cn-plate-reg" data-c="tl" />
        <span aria-hidden="true" className="cn-plate-reg" data-c="tr" />
        <span aria-hidden="true" className="cn-plate-reg" data-c="bl" />
        <span aria-hidden="true" className="cn-plate-reg" data-c="br" />
      </div>

      {/* The two mono elements BRACKET the plate rather than stacking: the
          caption at the left end of the row, the turn mark at the right. */}
      <div className="cn-print-foot">
        {/* The caption belongs to whichever face is showing, and it swaps at
            the exact moment the plate is edge-on and invisible — no fade, no
            wipe, the geometry hides it. Both faces sit in one grid cell so the
            row's height is the taller of the two and nothing shifts. */}
        <figcaption className="cn-cap font-mono" data-face={turned ? "back" : "front"}>
          <span className="cn-cap-face cn-cap-front" aria-hidden={turned}>
            {FRONT_CAPTION}
          </span>
          <span className="cn-cap-face cn-cap-back" aria-hidden={!turned}>
            {BACK_CAPTION}
          </span>
        </figcaption>

        {/* § 04's reference mark, reused exactly: a 12px hollow ink square, a
            0.5px muted leader across a 14px gap, and the word in 13px mono.
            Decorative — the plate itself is the button, so this is not a second
            tab stop; it fills solid when the plate is addressed, the same
            gesture □—PHOTO makes. */}
        <span aria-hidden="true" className="cn-turn-ref">
          <span className="cn-turn-ref-square" />
          <span className="cn-turn-ref-leader" />
          <span className="cn-turn-ref-label font-mono">turn</span>
        </span>
      </div>
    </figure>
  );
}
