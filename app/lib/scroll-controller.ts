"use client";

// Single shared scroll controller for the whole page: one Lenis instance, one
// requestAnimationFrame loop, fed to any number of subscribers. Nothing else
// on the page should run its own rAF or its own Lenis instance.
//
// Two kinds of subscription:
//   - subscribeGlobal(fn, gate?) — fn(progress) called every frame with the
//                             whole page's scroll progress, 0 at top to 1 at
//                             bottom. `gate` is an element; the subscription is
//                             live only while that element intersects the
//                             viewport.
//   - registerSection(el, fn) — fn(progress, rect) called every frame with that
//                             element's own progress through the viewport:
//                             0 as it enters at the bottom, 1 as it exits the top.
//
// EVERY SUBSCRIPTION IS GATED ON VIEWPORT INTERSECTION, AND THE GATE IS IN HERE
// RATHER THAN AT THE CALL SITES. That is the fix for a leak that stood for
// months: `section-mark` registered all five sections permanently and the
// controller only stopped when the last subscriber left, so the loop was alive
// from mount to unload and every frame paid for it. Measured at rest with
// nothing moving — 608 rAF callbacks and **6,000 getBoundingClientRect calls**
// in five seconds, i.e. ~10 forced layouts per frame for a page that was doing
// nothing at all. Gating at the call sites was the original plan and it is the
// wrong shape: five call sites is five chances to forget, and a subscriber that
// forgets is invisible until somebody profiles again.
//
// The loop itself also stops. It has two reasons to run — a live subscriber, or
// Lenis mid-animation — and when neither holds it is cancelled and re-armed by
// the input that could start a scroll. LENIS IS NEVER DESTROYED for this: it
// owns the wheel and touch handling, and tearing it down at rest would take
// smooth scrolling with it, which is the opposite of the point.

import Lenis from "lenis";

type GlobalSubscriber = (progress: number) => void;
// The rect is handed to the subscriber rather than re-read by it. The loop
// already reads it to compute `progress`, and a subscriber that wanted a
// different window (§ 02's per-character reveal, § 07's bands) would otherwise
// call getBoundingClientRect again — a second forced layout per element per
// frame, for a rectangle the loop is holding already.
type SectionSubscriber = (progress: number, rect: DOMRect) => void;

interface SectionEntry {
  el: Element;
  onProgress: SectionSubscriber;
}

let lenis: Lenis | null = null;
let rafId: number | null = null;
let running = false;
let inputArmed = false;
/** Timestamp of the last frame on which the loop had a reason to run. */
let lastActive = 0;
/** How long the loop keeps ticking after its last reason to. One wheel notch
 *  can leave Lenis with 300–400ms of easing left, and a gap between two notches
 *  must not tear the loop down mid-glide. */
const IDLE_GRACE_MS = 600;
/**
 * Milliseconds the loop has spent stood down, subtracted from every timestamp
 * handed to Lenis.
 *
 * LENIS MEASURES A DELTA BETWEEN CONSECUTIVE raf() CALLS. Stop the loop for
 * three seconds and the first tick after it hands Lenis a 3000ms frame, which
 * advances any easing to completion in one step — measured, a wheel notch from
 * a stood-down loop moved the page in ONE jump (2 distinct scrollY values
 * across 800ms) where an awake loop eased over 42 frames. Feeding Lenis a clock
 * with the idle time removed fixes it through the public API alone: Lenis only
 * ever looks at differences, so any monotonic clock is a valid one.
 */
let idleSkew = 0;
let stoppedAt = 0;

/**
 * The last frame's scroll offset and viewport box. EVERY SUBSCRIBER ON THIS
 * PAGE IS A PURE FUNCTION OF THOSE THREE NUMBERS — section-mark's translate,
 * § 05's character reveal, the nav's inversion, pizza rain's trigger — so a
 * frame on which none of them moved has nothing to compute. Without this the
 * loop still read a rect per subscriber per frame for a page standing
 * perfectly still: measured 615 reads in five seconds at § 02 and 4,920 at
 * § 04, for values that could not have changed.
 */
let lastScroll = -1;
let lastW = -1;
let lastH = -1;
/** Forces one full pass regardless — a new subscriber has to get its first
 *  value even if nothing has moved since the frame before it arrived. */
let dirty = true;

const globalSubscribers = new Set<GlobalSubscriber>();
const sections = new Map<symbol, SectionEntry>();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tick(time: number) {
  lenis?.raf(time - idleSkew);

  const scroll = lenis ? lenis.scroll : window.scrollY;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const moved = dirty || scroll !== lastScroll || w !== lastW || h !== lastH;
  lastScroll = scroll;
  lastW = w;
  lastH = h;
  dirty = false;

  if (moved && globalSubscribers.size > 0) {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
    globalSubscribers.forEach((fn) => fn(progress));
  }

  if (moved && sections.size > 0) {
    const viewportHeight = h;
    sections.forEach(({ el, onProgress }) => {
      const rect = el.getBoundingClientRect();
      const span = viewportHeight + rect.height;
      const progress = span > 0 ? clamp((viewportHeight - rect.top) / span, 0, 1) : 0;
      onProgress(progress, rect);
    });
  }

  // Two reasons to keep going: the page is still moving, or Lenis is still
  // easing. Note that HAVING SUBSCRIBERS IS NOT ONE OF THEM — a subscriber
  // with nothing to react to is exactly the case this is here to stop paying
  // for. Every wake path re-arms the loop, and `dirty` guarantees a new
  // subscriber gets a full pass before any of this applies to it.
  if (moved || lenis?.isScrolling) {
    lastActive = time;
  } else if (time - lastActive > IDLE_GRACE_MS) {
    rafId = null;
    running = false;
    stoppedAt = time;
    return;
  }

  rafId = requestAnimationFrame(tick);
}

/** Anything that can precede a scroll. Passive, and it only re-arms the loop —
 *  it never reads the scroll position and never moves anything, so it is not
 *  the "second scroll listener" the spec bans. */
const WAKE_EVENTS = [
  "wheel",
  "touchstart",
  "touchmove",
  "keydown",
  "scroll",
  "resize",
  "orientationchange",
] as const;

function wake() {
  const now = performance.now();
  if (running) {
    lastActive = now;
    return;
  }
  if (stoppedAt) {
    idleSkew += now - stoppedAt;
    stoppedAt = 0;
  }
  dirty = true;
  running = true;
  lastActive = now;
  rafId = requestAnimationFrame(tick);
}

function armInput() {
  if (inputArmed) return;
  inputArmed = true;
  for (const type of WAKE_EVENTS) {
    window.addEventListener(type, wake, { passive: true });
  }
}

/**
 * Lenis and the wake listeners come up as soon as ANY component registers,
 * whether or not its gate is open. They are the page's scrolling, not a
 * subscriber's — if they waited for a gate then the hero, which has no live
 * subscriber at all, would scroll natively until the reader reached § 02.
 */
let booted = false;
function boot() {
  if (booted) return;
  booted = true;

  armInput();

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(pointer: coarse)").matches;
  if (!reducedMotion && !touch) {
    lenis = new Lenis({ lerp: 0.09, duration: 1.1 });
  }

  wake();
}

export function subscribeGlobal(
  fn: GlobalSubscriber,
  /** Optional gate: the subscription is live only while this element
   *  intersects the viewport. Without one the subscriber is permanent, which
   *  is almost always a bug — pass the element whose visibility the work is
   *  actually about. */
  gate?: Element | null,
): () => void {
  boot();
  const add = () => {
    globalSubscribers.add(fn);
    dirty = true;
    wake();
  };
  const remove = () => globalSubscribers.delete(fn);
  return gated(gate, add, remove);
}

export function registerSection(el: Element, onProgress: SectionSubscriber): () => void {
  boot();
  const key = Symbol();
  const add = () => {
    sections.set(key, { el, onProgress });
    dirty = true;
    wake();
  };
  const remove = () => {
    if (!sections.has(key)) return;
    sections.delete(key);
    // One last frame at the boundary value. The observer fires as the element
    // crosses the viewport edge, where progress is already 0 or 1 by
    // construction — but a subscriber that eased toward that value rather than
    // jumping to it would otherwise freeze a hair short of it.
    const rect = el.getBoundingClientRect();
    const span = window.innerHeight + rect.height;
    const progress = span > 0 ? clamp((window.innerHeight - rect.top) / span, 0, 1) : 0;
    onProgress(progress, rect);
  };
  return gated(el, add, remove);
}

/**
 * Runs `add` while `gate` intersects the viewport and `remove` while it does
 * not. With no gate, or with no IntersectionObserver, the subscription is
 * permanent — a browser that cannot observe must not silently lose the effect.
 */
function gated(gate: Element | null | undefined, add: () => void, remove: () => void) {
  if (!gate || typeof IntersectionObserver === "undefined") {
    add();
    return remove;
  }

  let live = false;
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting === live) return;
      live = entry.isIntersecting;
      if (live) add();
      else remove();
    },
    // -1px TOP AND BOTTOM, AND IT IS LOAD-BEARING. At threshold 0 Chrome calls
    // an element whose edge exactly touches the root's edge intersecting, with
    // an intersection rect of zero height — § 02 starts at exactly 100svh, so
    // at the top of the page it reported `isIntersecting: true` with 1440x0 of
    // itself on screen.
    //
    // Testing the rect for a non-zero area instead was the obvious fix and it
    // is WRONG, measured: an observer notifies on THRESHOLD CROSSINGS, and
    // `isIntersecting` was already true at zero area, so scrolling § 02 into
    // view crossed nothing and no second callback ever arrived. The gate stayed
    // shut for the life of the page and § 02's mark never moved again. Shrink
    // the root instead and the edge case stops being intersecting at all, so
    // the crossing is real and the notification comes.
    { rootMargin: "-1px 0px" },
  );
  io.observe(gate);

  return () => {
    io.disconnect();
    if (live) remove();
  };
}

/**
 * The SMOOTHED scroll offset — Lenis's animated value, not window.scrollY.
 *
 * Anything positioned against the scroll must read this, or it moves on the raw
 * offset while the page moves on the eased one and the two visibly disagree
 * during a wheel gesture. Falls back to the real offset wherever Lenis is not
 * running, which is exactly the cases where the two are the same number: touch,
 * and reduced motion.
 */
export function getSmoothScroll(): number {
  return lenis ? lenis.scroll : window.scrollY;
}

export function scrollToElement(el: Element) {
  if (lenis) {
    // The loop may be standing down; a scrollTo with nothing ticking would set
    // a target and never animate toward it.
    wake();
    lenis.scrollTo(el as HTMLElement);
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

