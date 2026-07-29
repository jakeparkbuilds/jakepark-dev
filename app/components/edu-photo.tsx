"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";

// § 06 education — the contact print and the plate.
//
// The row has no room for a mounted photo. Measured at 1440px: the body column
// is a locked 620px, the coursework starts 32px after it, and the clear space
// right of the body's ink is 52–74px; the row itself is 260px tall at ≥1440.
// A photo that fits those numbers is ~119px wide — too small to read as a
// photograph at all. So the photo is shown at two sizes instead of one bad one.
//
//   the contact print — the image at 28px, inline, 14px past the school name's
//     last character. It is the affordance: you can see it is a photograph and
//     that there is more of it. It lives inside a zero-growth inline anchor
//     (absolutely positioned, anchor height 1em) so it adds NOTHING to the line
//     box and the row's height is byte-identical with and without it.
//
//   the plate — the full photograph, position: fixed, up to 500×667. It
//     reserves no space, contributes nothing to CLS, and cannot move the row.
//     Registration corners at 14px arms sitting 8px outside its corners, the
//     crop-mark language of a plate laid on the sheet — real crop marks stay
//     small whatever the sheet size, so they do not scale with the photo.
//
// At ≥1360px the plate is anchored to the content's right edge and sized so its
// left edge never reaches the body column — it covers the coursework, never
// type you are reading, so hover is safe. Below 1360px the coursework is already
// a full-width row under the body and there is no clear space at all, so the
// plate centres as an explicit lightbox and opens on CLICK rather than hover.

export type EduPhoto = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

// Only one plate at a time. A module-level event rather than context: two
// siblings deep in a server-rendered tree and nothing else needs the state.
const OPEN_EVENT = "edu-plate-open";
// Above this width the plate can sit clear of all type, so hover may open it.
const HOVER_OPENS = "(hover: hover) and (pointer: fine) and (min-width: 1360px)";

export default function EduPhoto({ photo }: { photo: EduPhoto }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const plateId = `edu-plate-${id}`;
  const self = useRef(id);
  const hoverRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(HOVER_OPENS);
    hoverRef.current = mq.matches;
    const onChange = () => (hoverRef.current = mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const show = useCallback(() => {
    document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: self.current }));
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== self.current) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // A tap anywhere else dismisses the lightbox on coarse pointers.
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element)?.closest?.(".edu-plate-anchor")) setOpen(false);
    };
    document.addEventListener(OPEN_EVENT, onOther);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener(OPEN_EVENT, onOther);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <span className="edu-plate-anchor">
      <button
        type="button"
        className="edu-plate-ref"
        aria-expanded={open}
        aria-controls={plateId}
        aria-label={`View photograph: ${photo.alt}`}
        onPointerEnter={() => hoverRef.current && show()}
        onPointerLeave={() => hoverRef.current && setOpen(false)}
        onFocus={show}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          // Hover already owns the fine-pointer case; click is the coarse and
          // narrow-viewport path, where it toggles.
          e.preventDefault();
          if (!hoverRef.current) setOpen((v) => !v);
        }}
      >
        <Image
          src={photo.src}
          alt=""
          width={photo.width}
          height={photo.height}
          sizes="28px"
          className="edu-plate-thumb"
        />
      </button>

      <span
        id={plateId}
        role="group"
        aria-label={photo.alt}
        data-open={open ? "" : undefined}
        className="edu-plate"
        aria-hidden={open ? undefined : "true"}
      >
        <span className="edu-plate-box">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 1800px) 500px, (min-width: 1600px) 430px, (min-width: 1440px) 300px, (min-width: 1360px) 235px, 72vw"
            className="edu-plate-img"
          />
          {/* Four L-shaped crop marks. Each scales out from its own vertex, so
              the arms extend along their length — drawn, not faded. They never
              touch the photo and never close into a rectangle. */}
          <span aria-hidden="true" className="edu-plate-reg" data-c="tl" />
          <span aria-hidden="true" className="edu-plate-reg" data-c="tr" />
          <span aria-hidden="true" className="edu-plate-reg" data-c="bl" />
          <span aria-hidden="true" className="edu-plate-reg" data-c="br" />
          <span className="edu-plate-caption">{photo.caption}</span>
        </span>
      </span>
    </span>
  );
}
