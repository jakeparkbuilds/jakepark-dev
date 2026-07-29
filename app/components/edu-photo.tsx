"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

// § 06 education — the contact print and the plate.
//
// The row has no room for a mounted photograph. Measured at 1440px: the body
// column is a locked 620px, the coursework starts 32px after it, and the clear
// space right of the body's ink is 52–74px; the row itself is 260px tall at
// ≥1440px. A photo that fits those numbers is ~119px wide — too small to read
// as a photograph at all. So the photo is shown at two sizes instead of one bad
// one.
//
//   the contact print — the image at 28px, inline, 14px past the school name's
//     last character. It is the affordance: you can see it is a photograph and
//     that there is more of it. It lives inside a zero-growth inline anchor
//     (absolutely positioned, anchor height 0) so it adds NOTHING to the line
//     box and the row's height is byte-identical with and without it.
//
//   the plate — the full photograph. There is exactly ONE of these for the
//     whole section, rendered by Education inside the grid wrapper rather than
//     inside either trigger. That is what makes "both rows stage the photo to
//     the same coordinates" structural rather than a pair of numbers that have
//     to be kept in agreement: there is only one box, and only its image and
//     caption change. It is absolutely positioned against the grid — never
//     fixed, never computed from scroll — and centred on the divider between
//     the two rows, which the equal-height grid puts at exactly 50%.
//
// The stage. Addressing a print does not just open a plate — the row clears
// around it: whichever coursework column is open closes, coursework hover-open
// is suppressed so a pointer crossing the column cannot reopen it, and the
// divider between the two rows retracts so it does not run under the plate.

export type EduPhoto = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

// Above this width the plate can sit clear of all type, so hover may open it.
const HOVER_OPENS = "(hover: hover) and (pointer: fine) and (min-width: 1360px)";
const STAGE_IN_MS = 180; // intent delay, so a pointer crossing the print does nothing
const STAGE_OUT_MS = 260; // grace, so the trigger -> plate journey is one region
const REARM_MS = 200; // extra beat before coursework may hover-open again
const PLATE_ID = "edu-plate";
// The exit's full length: caption 160ms, then the wipe and the corners. The
// photo has to stay mounted for all of it — a conditionally rendered image
// unmounts instantly and there is nothing left for a transition to run on.
// Enter runs to the same 480ms, so the two are symmetrical.
const EXIT_MS = 480;

// ── the shared stage, in module scope ───────────────────────────────────────
// The print and the plate are one hover region and they now live in different
// parts of the tree, so the region counter and the active index have to be
// shared rather than owned by either. A tiny store rather than context: two
// siblings deep in a server-rendered tree, and nothing else needs the state.
let active: number | null = null;
let region = 0;
let inTimer: number | null = null;
let outTimer: number | null = null;
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getActive = () => active;
const getServerActive = () => null;

function setDividerScale() {
  // The divider retracts from its RIGHT end and must stop at least 48px clear
  // of the plate's left crop mark. Measured once per stage entry — never per
  // frame — and applied as a scale, so the retraction animates on transform and
  // never on width.
  //
  // Derived from --plate-w rather than from the image's own rect: the image is
  // swapped by React when the active row changes, so on re-open it may not be
  // in the DOM yet on the next frame and the scale silently kept its previous
  // value (measured: the divider stayed at full length on 4 of 6 stage
  // entries). The plate's right edge and the divider's right edge are the same
  // content edge, so the geometry needs no image to be present.
  const plate = document.querySelector<HTMLElement>(".edu-plate");
  const rows = document.querySelectorAll<HTMLElement>(".edu-row");
  if (!plate || rows.length < 2) return;
  const plateW = plate.getBoundingClientRect().width;
  const rule = rows[1].getBoundingClientRect();
  if (!(plateW > 0) || rule.width <= 0) return;
  // 8px crop-mark offset + the required 48px of clear paper.
  const scale = Math.max(0, Math.min(1, (rule.width - plateW - 56) / rule.width));
  document.documentElement.style.setProperty("--edu-divider-scale", String(scale));
}

function commit(next: number | null) {
  if (active === next) return;
  active = next;
  const el = document.documentElement;
  if (next === null) {
    el.classList.remove("edu-staged");
    // Hold coursework hover-open shut for a further beat, so a pointer sweeping
    // off the plate does not instantly trigger the column underneath it.
    el.classList.add("edu-rearming");
    window.setTimeout(() => {
      if (active === null) el.classList.remove("edu-rearming");
    }, REARM_MS);
  } else {
    el.classList.add("edu-staged");
    el.classList.remove("edu-rearming");
    setDividerScale();
  }
  listeners.forEach((fn) => fn());
}

function clearTimers() {
  if (inTimer) window.clearTimeout(inTimer);
  if (outTimer) window.clearTimeout(outTimer);
  inTimer = null;
  outTimer = null;
}

function regionEnter(i: number) {
  region++;
  clearTimers();
  // The intent delay lives here: a pointer merely crossing a print never
  // reaches commit(), so the row never clears for a passer-by.
  inTimer = window.setTimeout(() => commit(i), STAGE_IN_MS);
}

function regionLeave() {
  region = Math.max(0, region - 1);
  clearTimers();
  // The grace period: the print -> plate journey briefly leaves both, and this
  // is what keeps that one region.
  outTimer = window.setTimeout(() => {
    if (region > 0) return;
    commit(null);
  }, STAGE_OUT_MS);
}

function openNow(i: number) {
  clearTimers();
  commit(i);
}
function closeNow() {
  region = 0;
  clearTimers();
  commit(null);
}

// ── the trigger ─────────────────────────────────────────────────────────────
export default function EduPhotoTrigger({
  photo,
  index,
}: {
  photo: EduPhoto;
  index: number;
}) {
  const current = useSyncExternalStore(subscribe, getActive, getServerActive);
  const open = current === index;
  const [canHover, setCanHover] = useState(false);
  // A pointer press focuses the button BEFORE it clicks it. Without this, focus
  // opened the plate and the click that followed saw it already open and shut
  // it again — one tap, two toggles, nothing on screen. Focus opens only when
  // it did not come from a pointer, which leaves keyboard focus working and
  // gives tap a single clean toggle.
  const pointerFocus = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia(HOVER_OPENS);
    setCanHover(mq.matches);
    const onChange = () => setCanHover(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <span className="edu-plate-anchor">
      <button
        type="button"
        className="edu-plate-ref"
        aria-expanded={open}
        aria-controls={PLATE_ID}
        aria-label={`View photograph: ${photo.alt}`}
        onPointerEnter={() => canHover && regionEnter(index)}
        onPointerLeave={() => canHover && regionLeave()}
        onPointerDown={() => {
          pointerFocus.current = true;
        }}
        onFocus={() => {
          if (!pointerFocus.current) openNow(index);
        }}
        onBlur={() => {
          pointerFocus.current = false;
          closeNow();
        }}
        onClick={(e) => {
          // Hover already owns the fine-pointer case; click is the coarse and
          // narrow-viewport path, where it toggles.
          e.preventDefault();
          pointerFocus.current = false;
          if (!canHover) (open ? closeNow() : openNow(index));
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
    </span>
  );
}

// ── the plate — exactly one, for the whole section ──────────────────────────
export function EduPlate({ photos }: { photos: EduPhoto[] }) {
  const current = useSyncExternalStore(subscribe, getActive, getServerActive);

  // `shown` is the photo in the DOM, `open` is whether it is revealed. They are
  // deliberately separate: the photo must outlive the stage so its exit has
  // something to animate, and it must mount CLOSED so the enter has a state to
  // travel from — mounting with data-open already set gives both values in one
  // frame and the browser transitions nothing.
  const [shown, setShown] = useState<EduPhoto | null>(null);
  const [open, setOpen] = useState(false);
  const swap = useRef<number | null>(null);

  useEffect(() => {
    const want = current === null ? null : photos[current];
    if (swap.current) {
      window.clearTimeout(swap.current);
      swap.current = null;
    }

    if (!want) {
      // Leaving: run the exit, then drop the photo.
      if (shown) {
        setOpen(false);
        swap.current = window.setTimeout(() => setShown(null), EXIT_MS);
      }
      return;
    }
    if (!shown) return; // mount happens below, closed, then opens next frame
    if (shown.src === want.src) {
      // Re-entered — possibly mid-exit. Simply re-opening lets the transition
      // pick up from wherever the clip-path currently is: no snap, no restart.
      setOpen(true);
      return;
    }
    // Switching rows: the outgoing photo finishes its exit BEFORE the incoming
    // one is mounted, so the two are never on screen together.
    setOpen(false);
    swap.current = window.setTimeout(() => setShown(want), EXIT_MS);
  }, [current, shown, photos]);

  // Mount closed, then open on the next frame so the wipe has somewhere to
  // start from.
  useEffect(() => {
    const want = current === null ? null : photos[current];
    if (!want) return;
    if (!shown) {
      setShown(want);
      return;
    }
    if (shown.src !== want.src || open) return;
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, [current, shown, open, photos]);

  useEffect(
    () => () => {
      if (swap.current) window.clearTimeout(swap.current);
    },
    []
  );

  const photo = shown;

  // Escape, and a tap anywhere else, dismiss it.
  useEffect(() => {
    if (current === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeNow();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest?.(".edu-plate-anchor") && !t?.closest?.(".edu-plate")) closeNow();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [current]);

  // Never leave the page staged behind an unmount.
  useEffect(() => () => closeNow(), []);

  const onEnter = useCallback(() => regionEnter(active ?? 0), []);
  const onLeave = useCallback(() => regionLeave(), []);

  return (
    <span
      id={PLATE_ID}
      role="group"
      aria-label={open && photo ? photo.alt : undefined}
      data-open={open ? "" : undefined}
      className="edu-plate"
      aria-hidden={open ? undefined : "true"}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <span className="edu-plate-box">
        {photo && (
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 1800px) 500px, (min-width: 1600px) 430px, (min-width: 1440px) 300px, (min-width: 1360px) 235px, 72vw"
            className="edu-plate-img"
          />
        )}
        {/* Four L-shaped crop marks. Each scales out from its own vertex, so
            the arms extend along their length — drawn, not faded. They never
            touch the photo and never close into a rectangle. */}
        <span aria-hidden="true" className="edu-plate-reg" data-c="tl" />
        <span aria-hidden="true" className="edu-plate-reg" data-c="tr" />
        <span aria-hidden="true" className="edu-plate-reg" data-c="bl" />
        <span aria-hidden="true" className="edu-plate-reg" data-c="br" />
        <span className="edu-plate-caption">{photo?.caption}</span>
      </span>
    </span>
  );
}
