"use client";

// § 03 is the site's one inverted section (CLAUDE.md § 2). Two systems paint in
// ink and would therefore vanish over it: the cursor dot (#0A0908) and the ink
// trail (#1A1815, on a #1A1815 ground). Both ask this module whether a given
// viewport point is over the inverted plate, and swap to paper if it is.
//
// The band is cached in DOCUMENT coordinates and compared against
// clientY + scrollY, so the hot path — every pointermove, and every frame of a
// trail — is pure arithmetic. Reading a bounding rect there would force layout
// on the very events that must stay cheap.

export const INVERTED_INK = "#1A1815";
export const INVERTED_PAPER = "#F5F1E8";

let band: { top: number; bottom: number } | null = null;
let bound = false;

function measure() {
  const el = document.getElementById("experience");
  if (!el) {
    band = null;
    return;
  }
  // offsetTop/offsetHeight are static in document space: they change only when
  // the layout does, which is what the invalidation below covers.
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  band = { top, bottom: top + el.offsetHeight };
}

function ensure() {
  if (!bound) {
    bound = true;
    const invalidate = () => {
      band = null;
    };
    window.addEventListener("resize", invalidate);
    // Fonts and images settling can move the section down the page.
    document.fonts?.ready.then(invalidate).catch(() => {});
    window.addEventListener("load", invalidate);
  }
  if (!band) measure();
}

/** True when a viewport-space y sits over the inverted plate. */
export function isOverInverted(clientY: number): boolean {
  if (typeof document === "undefined") return false;
  ensure();
  if (!band) return false;
  const y = clientY + window.scrollY;
  return y >= band.top && y <= band.bottom;
}
