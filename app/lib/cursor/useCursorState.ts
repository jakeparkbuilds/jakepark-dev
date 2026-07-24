"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

export type CursorPoint = { x: number; y: number };

// Elements that trigger "pen down". `a`/`button`/[role="button"] cover every
// interactive element that exists in this codebase today (nav links, social
// links, mailto link); `.nav-item` and `[data-cursor="pen-down"]` are hooks
// for anything added later that isn't naturally one of those tags.
const PEN_DOWN_SELECTOR = 'a, button, [role="button"], .nav-item, [data-cursor="pen-down"]';

// The hero DC map SVG (see hero-figure.tsx's data-dc-map attribute) — the
// one drawing on the site the trail must never scribble across.
const MAP_SELECTOR = "[data-dc-map]";

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

export type MapMeta = {
  overMap: boolean;
  mapRect: DOMRect | null;
};

export type CursorCallbacks = {
  // Fires on every pointermove, synchronously, with the live pointer
  // position — this is the zero-lag path. Never gated behind React state.
  onMove?: (point: CursorPoint, map: MapMeta, dragging: boolean) => void;
  onPenDownChange?: (penDown: boolean) => void;
  onPointerDown?: (point: CursorPoint, meta: { isLink: boolean }) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
};

// Owns the single document-level pointer listeners: raw position, hover-
// intent delegation via closest() (no per-element listeners), drag state,
// and the DC map bounding-box check. Everything here is imperative callback
// dispatch — nothing in this hook causes a React re-render on pointermove.
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
    let mapEl: Element | null = null;

    function getMapEl() {
      if (!mapEl || !mapEl.isConnected) mapEl = document.querySelector(MAP_SELECTOR);
      return mapEl;
    }

    function checkMap(x: number, y: number): MapMeta {
      const el = getMapEl();
      if (!el) return { overMap: false, mapRect: null };
      const rect = el.getBoundingClientRect();
      const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
      return { overMap: inside, mapRect: inside ? rect : null };
    }

    function handleMove(event: PointerEvent) {
      const point = { x: event.clientX, y: event.clientY };
      const map = checkMap(point.x, point.y);
      callbacksRef.current.onMove?.(point, map, dragging);
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
      callbacksRef.current.onPointerDown?.(point, { isLink });
      dragging = true;
      callbacksRef.current.onDragStart?.();
    }

    function handleUp() {
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
