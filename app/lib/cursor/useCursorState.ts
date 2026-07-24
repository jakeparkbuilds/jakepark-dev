"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

export type CursorPoint = { x: number; y: number };

// Elements that trigger "pen down". `a`/`button`/[role="button"] cover every
// interactive element that exists in this codebase today (nav links, social
// links, mailto link); `.nav-item` and `[data-cursor="pen-down"]` are hooks
// for anything added later that isn't naturally one of those tags.
const PEN_DOWN_SELECTOR = 'a, button, [role="button"], .nav-item, [data-cursor="pen-down"]';

const CURSOR_ACTIVE_QUERY = "(pointer: fine) and (hover: hover)";

function subscribeCursorActive(callback: () => void) {
  const query = window.matchMedia(CURSOR_ACTIVE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getCursorActiveSnapshot() {
  return window.matchMedia(CURSOR_ACTIVE_QUERY).matches;
}

function getCursorActiveServerSnapshot() {
  return false;
}

// Whether the whole cursor system should exist at all. Touch and coarse
// pointers keep the native cursor and none of this mounts — checked as a
// real media query, not a viewport-width guess, per CLAUDE.md/motion-spec.
// useSyncExternalStore (rather than state-synced-in-an-effect) is what lets
// this read a live browser API without a hydration mismatch: the server
// snapshot is always `false`, and React reconciles the real value safely
// after mount.
export function useCursorActive(): boolean {
  return useSyncExternalStore(
    subscribeCursorActive,
    getCursorActiveSnapshot,
    getCursorActiveServerSnapshot
  );
}

export type CursorCallbacks = {
  // Fires on every pointermove, synchronously, with the live pointer
  // position — this is the zero-lag path. Never gated behind React state.
  onMove?: (point: CursorPoint, dragging: boolean) => void;
  onPenDownChange?: (penDown: boolean) => void;
  onPointerDown?: (point: CursorPoint, meta: { isLink: boolean }) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

// Owns the single document-level pointer listeners: raw position, hover-
// intent delegation via closest() (no per-element listeners), and drag
// state. Everything here is imperative callback dispatch — nothing in this
// hook causes a React re-render on pointermove.
//
// `active` gates whether any listener is attached at all — on a coarse
// pointer this system doesn't just render nothing, it costs nothing either.
export function useCursorEngine(callbacks: CursorCallbacks, active: boolean) {
  const callbacksRef = useRef(callbacks);
  // Keep the ref fresh without writing to it during render — this effect
  // (no deps, runs after every commit) is the sanctioned place for that.
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!active) return;

    let penDown = false;
    let dragging = false;

    function handleMove(event: PointerEvent) {
      const point = { x: event.clientX, y: event.clientY };
      callbacksRef.current.onMove?.(point, dragging);
    }

    function handleOver(event: PointerEvent) {
      const target = event.target as Element | null;
      if (!penDown && target?.closest(PEN_DOWN_SELECTOR)) {
        penDown = true;
        callbacksRef.current.onPenDownChange?.(true);
      }
    }

    function handleOut(event: PointerEvent) {
      const target = event.target as Element | null;
      const related = event.relatedTarget as Element | null;
      if (
        penDown &&
        target?.closest(PEN_DOWN_SELECTOR) &&
        !related?.closest(PEN_DOWN_SELECTOR)
      ) {
        penDown = false;
        callbacksRef.current.onPenDownChange?.(false);
      }
    }

    function handleDown(event: PointerEvent) {
      if (event.button !== 0) return;
      const point = { x: event.clientX, y: event.clientY };
      const target = event.target as Element | null;
      const isLink = !!target?.closest("a");
      // A drag currently selects page text and paints it with the browser's
      // default highlight (visible over the connect section); ::selection
      // is restyled globally (globals.css) but the selection itself still
      // shouldn't happen while drawing. Applied as a class on <html> (which
      // also reserves scrollbar-gutter: stable, see globals.css) rather than
      // an inline style on <body>, so toggling it can never itself change
      // document.documentElement.clientWidth mid-drag.
      document.documentElement.classList.add("cursor-dragging");
      callbacksRef.current.onPointerDown?.(point, { isLink });
      dragging = true;
      callbacksRef.current.onDragStart?.();
    }

    function handleUp() {
      document.documentElement.classList.remove("cursor-dragging");
      if (!dragging) return;
      dragging = false;
      callbacksRef.current.onDragEnd?.();
    }

    document.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerover", handleOver, { passive: true });
    document.addEventListener("pointerout", handleOut, { passive: true });
    document.addEventListener("pointerdown", handleDown, { passive: true });
    document.addEventListener("pointerup", handleUp, { passive: true });
    window.addEventListener("blur", handleUp);

    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerover", handleOver);
      document.removeEventListener("pointerout", handleOut);
      document.removeEventListener("pointerdown", handleDown);
      document.removeEventListener("pointerup", handleUp);
      window.removeEventListener("blur", handleUp);
    };
  }, [active]);
}
