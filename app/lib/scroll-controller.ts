"use client";

// Single shared scroll controller for the whole page: one Lenis instance, one
// requestAnimationFrame loop, fed to any number of subscribers. Nothing else
// on the page should run its own rAF or its own Lenis instance.
//
// Two kinds of subscription:
//   - subscribeGlobal(fn)   — fn(progress) called every frame with the whole
//                             page's scroll progress, 0 at top to 1 at bottom.
//   - registerSection(el, fn) — fn(progress) called every frame with that
//                             element's own progress through the viewport:
//                             0 as it enters at the bottom, 1 as it exits the top.
//
// The rAF loop starts on the first subscriber/section and stops the moment
// the last one unregisters — there is never a persistent loop with nothing
// listening to it.

import Lenis from "lenis";

type GlobalSubscriber = (progress: number) => void;
type SectionSubscriber = (progress: number) => void;

interface SectionEntry {
  el: Element;
  onProgress: SectionSubscriber;
}

let lenis: Lenis | null = null;
let rafId: number | null = null;
let running = false;

const globalSubscribers = new Set<GlobalSubscriber>();
const sections = new Map<symbol, SectionEntry>();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function tick(time: number) {
  lenis?.raf(time);

  if (globalSubscribers.size > 0) {
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? clamp(window.scrollY / maxScroll, 0, 1) : 0;
    globalSubscribers.forEach((fn) => fn(progress));
  }

  if (sections.size > 0) {
    const viewportHeight = window.innerHeight;
    sections.forEach(({ el, onProgress }) => {
      const rect = el.getBoundingClientRect();
      const span = viewportHeight + rect.height;
      const progress = span > 0 ? clamp((viewportHeight - rect.top) / span, 0, 1) : 0;
      onProgress(progress);
    });
  }

  rafId = requestAnimationFrame(tick);
}

function start() {
  if (running) return;
  running = true;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const touch = window.matchMedia("(pointer: coarse)").matches;

  if (!reducedMotion && !touch) {
    lenis = new Lenis({ lerp: 0.09, duration: 1.1 });
  }

  rafId = requestAnimationFrame(tick);
}

function stopIfIdle() {
  if (globalSubscribers.size > 0 || sections.size > 0) return;

  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = null;
  running = false;
  lenis?.destroy();
  lenis = null;
}

export function subscribeGlobal(fn: GlobalSubscriber): () => void {
  globalSubscribers.add(fn);
  start();
  return () => {
    globalSubscribers.delete(fn);
    stopIfIdle();
  };
}

export function registerSection(el: Element, onProgress: SectionSubscriber): () => void {
  const key = Symbol();
  sections.set(key, { el, onProgress });
  start();
  return () => {
    sections.delete(key);
    stopIfIdle();
  };
}

export function scrollToElement(el: Element) {
  if (lenis) {
    lenis.scrollTo(el as HTMLElement);
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
