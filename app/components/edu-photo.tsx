"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

// § 06 education — the pinned photo callout. Reuses the hero map's callout
// vocabulary rather than inventing a tooltip: a small mark, a 0.5px leader with
// one hard 90° elbow, and a mono-micro label. The photo sits directly on paper —
// no frame, no panel, no fill, no radius, no shadow. The leader IS the tail.
//
// At ≥900px this is a hover/focus callout anchored to the trigger and absolutely
// positioned, so it never participates in layout and cannot move the coursework
// column. Below 900px there is no hover: the photo renders permanently inline
// (see EduPhotoInline, rendered by Education inside .edu-body) and this trigger
// is not displayed at all.

export type EduPhoto = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

// Only one panel may be open at a time. Opening one broadcasts, and any other
// mounted panel closes — so moving between the two triggers forces the first to
// run its exit. A module-level event rather than context: two siblings deep in a
// server-rendered tree, and nothing else needs the state.
const OPEN_EVENT = "edu-photo-open";

export default function EduPhotoCallout({ photo }: { photo: EduPhoto }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const panelId = `edu-photo-${id}`;
  const selfRef = useRef<string>(id);

  useEffect(() => {
    if (!open) return;
    const onOther = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== selfRef.current) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener(OPEN_EVENT, onOther);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener(OPEN_EVENT, onOther);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const show = () => {
    document.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: selfRef.current }));
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <span className="edu-photo-anchor">
      <button
        type="button"
        className="edu-photo-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {/* The mark: a hollow square, not an icon and not a glyph. */}
        <span aria-hidden="true" className="edu-photo-square" />
        {/* The 0.5px muted leader that ties the mark to its label. */}
        <span aria-hidden="true" className="edu-photo-tie" />
        photo
      </button>

      <span
        id={panelId}
        role="group"
        aria-label={photo.alt}
        data-open={open ? "" : undefined}
        className="edu-photo-panel"
      >
        {/* Leader: down from the mark, one hard 90° elbow, then right to the
            panel's top-left corner. No arrowhead, no curve. Draws along its own
            length via stroke-dashoffset — the line arrives before the photo. */}
        <svg
          aria-hidden="true"
          className="edu-photo-leader"
          viewBox="0 0 20 90"
          width="20"
          height="90"
          fill="none"
        >
          <path
            d="M3.5 9 V90 H20"
            stroke="#1A1815"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <span className="edu-photo-frame">
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="150px"
            loading="lazy"
            className="edu-photo-img"
          />
        </span>
        <span className="edu-photo-caption">{photo.caption}</span>
      </span>
    </span>
  );
}

// Below 900px: no trigger, no leader, no tap-to-reveal. The photo is simply
// there, beneath the location line and above the coursework list.
export function EduPhotoInline({ photo }: { photo: EduPhoto }) {
  return (
    <span className="edu-photo-inline">
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes="150px"
        loading="lazy"
        className="edu-photo-img"
      />
      <span className="edu-photo-caption">{photo.caption}</span>
    </span>
  );
}
