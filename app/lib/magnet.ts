"use client";

// § 07 connect — the magnet.
//
// A link inside the field drifts a third of the way toward the pointer. This is
// the one place on the site where magnetism is allowed (§ 7 permits it on the
// outro links and nowhere else), and it is position only: no scale, no colour,
// no glow. The link's own hover treatment is untouched and runs alongside it.
//
// ONE listener for every magnet on the page, not one per element. Each magnet
// needs its element's rect on every pointermove, and a magnet that read its own
// rect and then wrote its own transform would force a layout — four of them in
// a row is four forced layouts per pointer event. The registry reads every rect
// first and writes every transform afterwards, so a move costs one layout no
// matter how many magnets are registered.
//
// The rects are cached and invalidated by scroll and resize rather than re-read
// per event: between two pointermove events with no scroll in between, nothing
// can have moved.

export type MagnetEntry = {
  el: HTMLElement;
  /** Pointer offset is divided by this. 3 is the reference's strength. */
  divisor: number;
  /** How far outside the element's bounds the field reaches, in px. */
  field: number;
};

type Registered = MagnetEntry & {
  rect: DOMRect | null;
  active: boolean;
};

const ENTER = "transform 0.3s ease-out";
const LEAVE = "transform 0.6s ease-in-out";

const entries = new Set<Registered>();
let listening = false;
let dirty = true;

function invalidate() {
  dirty = true;
}

function onPointerMove(e: PointerEvent) {
  // ---- read ----
  if (dirty) {
    for (const m of entries) m.rect = m.el.getBoundingClientRect();
    dirty = false;
  }

  // ---- write ----
  for (const m of entries) {
    const r = m.rect;
    if (!r) continue;
    const inField =
      e.clientX >= r.left - m.field &&
      e.clientX <= r.right + m.field &&
      e.clientY >= r.top - m.field &&
      e.clientY <= r.bottom + m.field;

    if (inField) {
      const dx = (e.clientX - (r.left + r.width / 2)) / m.divisor;
      const dy = (e.clientY - (r.top + r.height / 2)) / m.divisor;
      if (!m.active) {
        m.active = true;
        m.el.style.willChange = "transform";
        m.el.style.transition = ENTER;
      }
      m.el.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    } else if (m.active) {
      release(m);
    }
  }
}

function release(m: Registered) {
  if (!m.active) return;
  m.active = false;
  m.el.style.transition = LEAVE;
  m.el.style.transform = "translate3d(0, 0, 0)";
  // will-change is a standing cost, so it is held only while the element is
  // actually moving — through the leave transition and no longer.
  window.setTimeout(() => {
    if (!m.active) m.el.style.willChange = "";
  }, 600);
}

// A magnet that only ever hears `pointermove` can be left stranded: move the
// pointer out of the window in one gesture and there is no further move event
// to tell it the pointer has gone, so the link stays displaced until the
// pointer comes back. Measured — the email held a 40px offset indefinitely.
// The document's own pointer-leave and the window blur are the two ways the
// pointer can vanish without a move.
function releaseAll() {
  for (const m of entries) release(m);
}

export function registerMagnet(entry: MagnetEntry): () => void {
  const m: Registered = { ...entry, rect: null, active: false };
  entries.add(m);

  if (!listening) {
    listening = true;
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    // The rects move with the page; nothing else can move them.
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });
    document.addEventListener("pointerleave", releaseAll);
    window.addEventListener("blur", releaseAll);
  }
  invalidate();

  return () => {
    entries.delete(m);
    m.el.style.transform = "";
    m.el.style.transition = "";
    m.el.style.willChange = "";
    if (entries.size === 0 && listening) {
      listening = false;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      document.removeEventListener("pointerleave", releaseAll);
      window.removeEventListener("blur", releaseAll);
    }
  };
}
