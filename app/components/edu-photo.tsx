"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// § 04 background — the contact print and the plate.
//
// The station has no room for a mounted photograph. A photo that fits the clear
// space beside the 620px body column is ~119px wide — too small to read as a
// photograph at all. So the photo is shown at two sizes instead of one bad one.
//
//   the reference mark — a 12px hollow ink square, a 0.5px muted leader across
//     a 14px gap, and the word PHOTO in mono, 14px past the school name's last
//     character. It lives inside a zero-growth inline anchor (absolutely
//     positioned, anchor height 0) so it adds NOTHING to the line box and the
//     station's height is byte-identical with and without it. This was a 28px
//     crop of the photograph itself; at that size a photograph has no subject,
//     only noise, and it read as a failed image load rather than as an
//     affordance.
//
//   the plate — the full photograph. There is exactly ONE of these for the
//     whole section, rendered by Background inside `.bg-plates` rather than
//     inside either trigger. That is what makes "both stations stage the photo
//     to the same coordinates" structural rather than a pair of numbers that
//     have to be kept in agreement: there is only one box, and only its image
//     and caption change. It is absolutely positioned against that wrapper —
//     never fixed, never computed from scroll — which holds exactly the two
//     stations that carry a school. The wrapper is the last thing in § 04, so
//     what the plate borrows below it is the section's own bottom padding.
//
// IT OPENS ON CLICK, AT EVERY WIDTH, AND THERE IS NO BREAKPOINT.
// Hover used to open it above 1440px, and the argument for that was that the
// plate covered the coursework rather than type being read — the coursework was
// clipped shut until the station was hovered. The coursework is permanently
// visible now, so there is no longer anything on that side of the station that
// a plate may cover unasked. With hover went the intent delay, the grace
// period, the region counter, the re-arm beat, the `edu-staged` / `edu-rearming`
// classes and the whole 1440px derivation. Click to open, click / Escape /
// anywhere else to close.

export type EduPhoto = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

const PLATE_ID = "edu-plate";
// The exit's full length: caption 160ms, then the wipe and the corners. The
// photo has to stay mounted for all of it — a conditionally rendered image
// unmounts instantly and there is nothing left for a transition to run on.
// Enter runs to the same 480ms, so the two are symmetrical.
const EXIT_MS = 480;

// ── the shared stage, in module scope ───────────────────────────────────────
// The trigger and the plate live in different parts of the tree and there is
// one plate for two triggers, so the active index cannot be owned by either. A
// tiny store rather than context: two siblings deep in a server-rendered tree,
// and nothing else needs the state.
let active: number | null = null;
const listeners = new Set<() => void>();

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const getActive = () => active;
const getServerActive = () => null;

function commit(next: number | null) {
  if (active === next) return;
  active = next;
  listeners.forEach((fn) => fn());
}

const openNow = (i: number) => commit(i);
const closeNow = () => commit(null);

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
  // A pointer press focuses the button BEFORE it clicks it. Without this, focus
  // opened the plate and the click that followed saw it already open and shut
  // it again — one tap, two toggles, nothing on screen. Focus opens only when
  // it did not come from a pointer, which leaves keyboard focus working and
  // gives a tap a single clean toggle.
  const pointerFocus = useRef(false);

  return (
    <span className="edu-plate-anchor">
      <button
        type="button"
        className="edu-plate-ref"
        aria-expanded={open}
        aria-controls={PLATE_ID}
        aria-label={`View photograph: ${photo.alt}`}
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
          e.preventDefault();
          pointerFocus.current = false;
          if (open) closeNow();
          else openNow(index);
        }}
      >
        {/* A drawn reference, not a crop of the photograph. A 28px thumbnail
            carries no subject at that size — it reads as a broken image, which
            is the opposite of an affordance. The square, the leader and the
            word are the plate's own vocabulary. */}
        <span aria-hidden="true" className="edu-plate-ref-square" />
        <span aria-hidden="true" className="edu-plate-ref-leader" />
        <span aria-hidden="true" className="edu-plate-ref-label font-mono">
          photo
        </span>
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
    // Switching stations: the outgoing photo finishes its exit BEFORE the
    // incoming one is mounted, so the two are never on screen together.
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
    [],
  );

  const photo = shown;

  // Escape, and a press anywhere else, dismiss it.
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

  return (
    <span
      id={PLATE_ID}
      role="group"
      aria-label={open && photo ? photo.alt : undefined}
      data-open={open ? "" : undefined}
      className="edu-plate"
      aria-hidden={open ? undefined : "true"}
    >
      <span className="edu-plate-box">
        {photo && (
          <Image
            key={photo.src}
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 1800px) 390px, (min-width: 1600px) 360px, (min-width: 1440px) 220px, 72vw"
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
