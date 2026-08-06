"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";
import { createBodies, step, type Body } from "../lib/field-physics";
import { OUTER_R, depthScale, linkEnds } from "../lib/skills-geometry";
import {
  NODE_SEEDS,
  TICK_REACH,
  TIER_OPACITY,
  keepOutZones,
  drift,
  type NodeSeed,
  type Rect,
} from "../lib/skills";

// § 02's index — the field's geometry and its one rAF loop.
//
// Split out of skills.tsx ahead of the § 02 merge. Pure move: every effect,
// every ref and every line of `layout` is the code that was in the component,
// in the same order, with the same dependencies.
//
// This is one of the site's three permitted persistent loops (CLAUDE.md § 6).
// It runs ONLY while the section intersects the viewport, and is cancelled on
// exit, on document.hidden and under reduced motion. It writes transforms and
// opacities straight to refs — there is not one React re-render per frame.
//
// The hook OWNS the refs the loop writes through and returns the ones render
// and keyboard traversal also need. `activeRef` is passed IN rather than owned,
// because the component is its single writer and splitting that would give the
// value two sources.

export function useFieldMotion(
  reduced: boolean,
  activeRef: RefObject<number | null>,
) {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const linksRef = useRef<SVGGElement | null>(null);

  // Per-node time offsets. Pausing a node on hover freezes its own clock, so
  // resuming continues the path from exactly where it stopped rather than
  // jumping to wherever the shared clock has since travelled.
  const offsets = useRef<number[]>(NODE_SEEDS.map(() => 0));

  // The field's geometry, read ONCE per resize and never inside the loop, so
  // "the loop performs zero DOM reads" still holds.
  const sizeRef = useRef<{ w: number; h: number } | null>(null);
  const bodiesRef = useRef<Body[] | null>(null);
  const zonesRef = useRef<Rect[]>([]);
  // A node's CSS base, in px. The transform carries only the delta from it, so
  // the resting layout in the server-rendered HTML is untouched.
  const baseRef = useRef<{ x: number; y: number }[]>([]);
  // This frame's depth scale per node, written by the node pass and read by the
  // linkage pass below it. Allocated once: the linkage needs to know how big
  // both of its endpoints are rendered right now, and the node pass has already
  // computed exactly that.
  const scales = useRef<number[]>(NODE_SEEDS.map(() => 1));

  const layout = useCallback(
    (t: number, seeds: NodeSeed[]) => {
      const bodies = bodiesRef.current;
      const base = baseRef.current;
      for (let i = 0; i < seeds.length; i++) {
        const s = seeds[i];
        const el = nodeRefs.current[i];
        const ring = ringRefs.current[i];
        if (!el || !ring) continue;
        // Position comes from the physics body; only the depth cycle is still a
        // function of time, because depth has nothing to collide with.
        const b = bodies?.[i];
        const p = base[i];
        const dx = b && p ? b.x - p.x : 0;
        const dy = b && p ? b.y - p.y : 0;
        const { z } = drift(s, t - offsets.current[i]);
        const scale = depthScale(z);
        scales.current[i] = scale;
        el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(
          2,
        )}px, 0) scale(${scale.toFixed(4)})`;
        el.style.zIndex = String(Math.round(z * 100));
        // Depth reads on the circle only. The label keeps its full #6B6455 —
        // dimming type that a reader has to read would break CLAUDE.md § 11.
        ring.style.opacity = (
          TIER_OPACITY[s.tool.tier] *
          (0.88 + (z - 0.5) * 0.24)
        ).toFixed(3);
      }

      // ── the linkage endpoints, written in THIS pass and no other.
      //
      // A line between two drifting nodes changes length every frame, so its
      // geometry has to be written by whatever is already writing their
      // positions. A second rAF for it would be a fourth loop on a page whose
      // budget is three (CLAUDE.md § 6, § 12); this rides the one that already
      // exists, in the same pass, reading nothing from the DOM.
      //
      // With no node addressed there is nothing in the group and the whole block
      // is skipped — at rest this costs one null check per frame.
      //
      // Both ends are pushed out of their own node's ink — see linkEnds. The
      // offsets are computed here rather than anywhere else for the same reason
      // the endpoints are: they depend on the depth scale, which changes every
      // frame, and this pass has just written it.
      const g = linksRef.current;
      const a = activeRef.current;
      if (!g || a === null || !bodies) return;
      const from = bodies[a];
      if (!from) return;
      const ar = OUTER_R[a] * scales.current[a];
      for (const el of Array.from(g.children) as SVGLineElement[]) {
        const j = Number(el.dataset.to);
        const to = bodies[j];
        if (!to) continue;
        const e = linkEnds(
          from.x,
          from.y,
          ar,
          to.x,
          to.y,
          OUTER_R[j] * scales.current[j],
        );
        // Too close for both offsets to fit: no line at all, rather than one
        // drawn backwards through both nodes. The pair can separate later, so
        // this is display and not an unmount — the element stays, and the draw
        // runs whenever it first becomes visible.
        if (!e) {
          if (el.style.display !== "none") el.style.display = "none";
          continue;
        }
        if (el.style.display) el.style.display = "";
        el.setAttribute("x1", String(e.x1));
        el.setAttribute("y1", String(e.y1));
        el.setAttribute("x2", String(e.x2));
        el.setAttribute("y2", String(e.y2));
      }
    },
    [activeRef],
  );

  // Measure the field and seed the bodies. Once on mount and again on resize —
  // never in the loop. On resize the bodies are rebuilt from the seeds rather
  // than rescaled: a node's position after a collision is not a fraction of
  // anything, so there is nothing meaningful to rescale.
  // Runs under reduced motion too, and must. The loop below does not, but the
  // LINKAGE still renders — it is content — and its endpoints come from these
  // composed homes. Skipping the measurement here left every line drawn from
  // 0,0 to 0,0, i.e. the wiring silently missing for exactly the people the
  // reduced-motion path serves. Measured that way first.
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const build = () => {
      const w = field.clientWidth;
      const h = field.clientHeight;
      if (!(w > 0 && h > 0)) return;
      sizeRef.current = { w, h };
      zonesRef.current = keepOutZones(w, h);
      baseRef.current = NODE_SEEDS.map((s) => {
        const ix = s.r + TICK_REACH + s.ax;
        const iy = s.r + TICK_REACH + s.ay;
        return { x: ix + s.bx * (w - 2 * ix), y: iy + s.by * (h - 2 * iy) };
      });
      bodiesRef.current = createBodies(NODE_SEEDS, w, h);
    };
    build();

    let rt: number | undefined;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(rt);
      rt = window.setTimeout(build, 200);
    });
    ro.observe(field);
    return () => {
      window.clearTimeout(rt);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    // Reduced motion: NO loop is ever created — not started and cancelled, never
    // created. The server already rendered the seeded t = 0 arrangement, so
    // there is nothing to do here at all; hover and focus still work fully.
    if (reduced) return;

    let raf: number | null = null;
    let start = 0;
    let elapsed = 0;
    let last = 0;
    let onScreen = false;

    const frame = (now: number) => {
      elapsed = now - start;
      const dt = elapsed - last;
      last = elapsed;
      // A held node's own clock stops while every other node keeps drifting, so
      // releasing it resumes the path from exactly where it stopped rather than
      // snapping to wherever the shared clock has since travelled.
      const a = activeRef.current;
      if (a !== null) offsets.current[a] += dt;
      const size = sizeRef.current;
      if (bodiesRef.current && size) {
        step(bodiesRef.current, zonesRef.current, size.w, size.h, dt, a);
      }
      layout(elapsed, NODE_SEEDS);
      raf = requestAnimationFrame(frame);
    };

    const run = () => {
      if (raf !== null || !onScreen || document.hidden) return;
      // Resume the clock where it left off rather than snapping back to 0.
      const resumeAt = elapsed;
      raf = requestAnimationFrame((now) => {
        start = now - resumeAt;
        last = resumeAt;
        frame(now);
      });
    };
    const halt = () => {
      if (raf === null) return;
      cancelAnimationFrame(raf);
      raf = null;
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (onScreen) run();
        else halt();
      },
      { rootMargin: "80px" },
    );
    io.observe(field);

    const onVisibility = () => (document.hidden ? halt() : run());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      halt();
    };
  }, [reduced, layout, activeRef]);

  return { fieldRef, nodeRefs, ringRefs, linksRef, baseRef };
}
