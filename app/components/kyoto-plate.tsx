"use client";

import Image from "next/image";
import { useState } from "react";
import Button from "./button";

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
//   THE PROJECTION IS NEAR-ORTHOGRAPHIC. `perspective` sits on the mount at
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
  // `pinned` survives the pointer leaving; `hovered` does not.
  //
  // CLICK IS A FIRST-CLASS TOGGLE: click turns and pins, click again RETURNS,
  // even with the pointer still on the plate. That last clause is what
  // `muteHover` is for. Without it a click-to-return under the pointer is
  // immediately overruled by the hover that is still true, and the plate simply
  // does not come back — which is the same "only hover works" complaint from
  // the other side. Muting is not a lock: it lasts until the pointer leaves,
  // and leaving is also what re-arms hover.
  const [pinned, setPinned] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [muteHover, setMuteHover] = useState(false);
  const turned = pinned || (hovered && !muteHover);

  const toggle = () => {
    if (pinned) setMuteHover(true);
    setPinned(!pinned);
  };
  const leave = () => {
    setHovered(false);
    setMuteHover(false);
  };

  return (
    <figure className="connect-portrait">
      <div className="cn-print" data-turned={turned ? "" : undefined}>
        {/* The one element that rotates. NOTHING INTERACTIVE MAY WRAP IT: a
            <ul> inside a <button> is invalid content and the browser drops the
            whole list out of the accessibility tree — measured, when the
            control was the plate's parent the back face exposed nothing at
            all. The control is a labelled button in the foot row now, so the
            constraint is satisfied by construction rather than by an overlay,
            and the corners and the focus brackets stay out of the rotation. */}
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

        {/* The plate's own pointer target — NOT a tab stop and not the
            control. THE COMPLAINT WAS THAT IT LOOKED LIKE A BUTTON AND ONLY
            HOVER WORKED: the thing that looked like a button was the □—TURN
            mark below, which was decoration, while the actual control was the
            photograph, which does not look like anything. The real button is
            in the foot row now. This layer stays because clicking the
            photograph is the obvious gesture and it costs nothing — it is
            redundant with a labelled control eight pixels away, which is the
            only reason a click target may be aria-hidden. */}
        <div
          aria-hidden="true"
          className="cn-turn-hit"
          // Mouse only. A touch fires pointerenter and never the matching
          // leave, which is exactly how a hover state gets stuck on a phone —
          // so a tap goes through `click` and toggles `pinned` instead, and
          // `hovered` is never set on that path at all.
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") setHovered(true);
          }}
          onPointerLeave={leave}
          onClick={toggle}
        >
          {/* Focus: four accent registration brackets, the § 02 / § 04 motif.
              They are drawn while the TURN button has focus — they say what
              that button acts on. They do not rotate. */}
          <span className="cn-focus" data-c="tl" />
          <span className="cn-focus" data-c="tr" />
          <span className="cn-focus" data-c="bl" />
          <span className="cn-focus" data-c="br" />
        </div>

        {/* The mount's corners. Outside the rotating element entirely — they
            never turn, never move, and are not part of any target. */}
        <span aria-hidden="true" className="cn-plate-reg" data-c="tl" />
        <span aria-hidden="true" className="cn-plate-reg" data-c="tr" />
        <span aria-hidden="true" className="cn-plate-reg" data-c="bl" />
        <span aria-hidden="true" className="cn-plate-reg" data-c="br" />
      </div>

      {/* Caption at the left end of the row, control at the right, so the two
          still BRACKET the plate rather than stacking. */}
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

        {/* THE CONTROL. The outline variant, at the right end of the foot row
            so the two elements still bracket the plate. It replaced the □—TURN
            reference mark, which was aria-hidden decoration that looked like a
            button — the exact failure the mark was supposed to prevent.

            Click is first class: it toggles `pinned`, so a click turns the
            plate and pins it and a second click brings it back, on a mouse and
            on a phone alike. Enter and Space are the same path, because this is
            a real <button>. Hover still turns it, on the plate and on the
            button, and only for a mouse. */}
        <Button
          variant="outline"
          className="cn-turn-btn"
          aria-pressed={turned}
          aria-label="turn over — interests"
          onPointerEnter={(e) => {
            if (e.pointerType === "mouse") setHovered(true);
          }}
          onPointerLeave={leave}
          onClick={toggle}
        >
          {turned ? "back" : "turn"}
        </Button>
      </div>
    </figure>
  );
}
