"use client";

import { createBodies, step, type Body } from "../lib/field-physics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ARC_INSET,
  CLUSTERS,
  CONTEXT_HREF,
  CONTEXT_LABEL,
  keepOutZones,
  LINKED,
  type Rect,
  NODE_INDEX,
  NODE_SEEDS,
  TICK_COUNT,
  TICK_HOVER,
  TICK_REACH,
  TICK_REST,
  TIER_OPACITY,
  TIER_SWEEP,
  TOOLS,
  drift,
  type NodeSeed,
} from "../lib/skills";
import { scrollToElement } from "../lib/scroll-controller";
import { useReducedMotion } from "../lib/use-reduced-motion";
import SectionShell from "./section-shell";

// § 05 skills — the drifting field.
//
// 17 tools as hairline circles on a slow closed drift, with a fixed readout
// panel on the left that names whichever node is addressed and says what Jake
// actually did with it. The evidence line is the point: it is what makes this
// section content rather than decoration.
//
// The one rAF loop on the page outside the shared scroll controller lives here,
// and CLAUDE.md § 6 carves out exactly this exception: it runs ONLY while the
// section intersects the viewport, and is cancelled on exit, on document.hidden
// and under reduced motion. It writes transforms and opacities straight to refs
// — there is not one React re-render per frame, only one per hover change.

const CLUSTER_LABEL = new Map(CLUSTERS.map((c) => [c.id, c.label]));

// A node is a dial, not a bubble: a hairline ring, 12 circumference ticks, an
// inner arc whose sweep is the value it carries, the tool name, and a plate
// index. Geometry is pure and computed once per node at module scope.
function dial(s: NodeSeed) {
  const box = s.r + TICK_REACH;
  const c = box; // centre, in the node's own viewBox
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    // Tick 0 is 12 o'clock and they run clockwise, which is also the order the
    // hover stagger walks them in.
    const a = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    // Drawn from the ring OUTWARD, so a dash offset shortens it at the far end
    // and the tick always stays attached to the ring.
    const len = i === 0 && s.tool.tier === "primary" ? TICK_REACH : TICK_HOVER;
    // Rounded, not raw: Node and the browser serialise the same double to
    // different decimal strings (17.306424965364812 vs 17.30642496536482), and
    // React reports that as a hydration mismatch. Every generated coordinate on
    // this site is rounded for exactly this reason.
    const n = (v: number) => Math.round(v * 1000) / 1000;
    return {
      x1: n(c + cos * s.r),
      y1: n(c + sin * s.r),
      x2: n(c + cos * (s.r + len)),
      y2: n(c + sin * (s.r + len)),
      len,
      index: i === 0 && s.tool.tier === "primary",
    };
  });
  // The arc: starts at 12 o'clock, sweeps clockwise by its tier's angle.
  const R = s.r - ARC_INSET;
  const deg = TIER_SWEEP[s.tool.tier];
  const rad = (deg * Math.PI) / 180;
  const arc = `M${c},${c - R} A${R},${R} 0 ${deg > 180 ? 1 : 0} 1 ${(
    c + R * Math.sin(rad)
  ).toFixed(3)},${(c - R * Math.cos(rad)).toFixed(3)}`;
  void rad;
  return { box, c, ticks, arc };
}

const DIALS = new Map(NODE_SEEDS.map((s) => [s.tool.name, dial(s)]));

// The resting frame, computed once at module scope from the same seeds and the
// same drift() the loop uses — so the server-rendered HTML *is* frame t = 0,
// hydration matches byte for byte, and the reduced-motion path needs no JS at
// all. The base position is expressed in CSS as `inset + fraction × (100% −
// 2·inset)`, where inset = radius + amplitude: base ± drift therefore cannot
// reach an edge at any field size. Bounds are structural. There is no boundary
// test, no bounce, and no collision resolution anywhere in this section.
function nodeStyle(s: NodeSeed): React.CSSProperties {
  const { dx, dy, z } = drift(s, 0);
  const box = s.r + TICK_REACH;
  const ix = box + s.ax;
  const iy = box + s.ay;
  return {
    width: box * 2,
    height: box * 2,
    left: `calc(${(ix - box).toFixed(2)}px + ${s.bx.toFixed(4)} * (100% - ${(
      ix * 2
    ).toFixed(2)}px))`,
    top: `calc(${(iy - box).toFixed(2)}px + ${s.by.toFixed(4)} * (100% - ${(
      iy * 2
    ).toFixed(2)}px))`,
    transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${(
      0.88 + z * 0.24
    ).toFixed(4)})`,
    zIndex: Math.round(z * 100),
  };
}

export default function Skills({
  number,
  id,
  label,
}: {
  number: string;
  id: string;
  label: string;
}) {
  const reduced = useReducedMotion();
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const ringRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const linksRef = useRef<SVGGElement | null>(null);
  // Two sources, one verdict. `hover` is transient and `pinned` survives the
  // pointer leaving — that is the whole difference between the two, and keeping
  // them apart is what makes a pin actually hold: a single `active` would be
  // cleared by the pointerleave that immediately follows any click.
  const [hover, setHover] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const active = pinned ?? hover;
  const setActive = useCallback((v: number | null) => {
    setHover(v);
    if (v === null) setPinned(null);
  }, []);
  // The one thing the field accumulates. An arc sweeps on first visit and stays
  // swept, so a visitor who has explored can see which dials they opened.
  const [visited, setVisited] = useState<Set<number>>(() => new Set());
  // Dev-only, for the keep-out overlay below.
  const [zones, setZones] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!new URLSearchParams(location.search).has("keepout")) return;
    const f = fieldRef.current;
    if (f) setZones({ w: f.clientWidth, h: f.clientHeight });
  }, []);
  // The loop reads the active index without re-subscribing every hover.
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;

  // Per-node time offsets. Pausing a node on hover freezes its own clock, so
  // resuming continues the path from exactly where it stopped rather than
  // jumping to wherever the shared clock has since travelled.
  const offsets = useRef<number[]>(NODE_SEEDS.map(() => 0));

  // The loop performs ZERO DOM reads. A node's resting position is expressed in
  // CSS (see nodeStyle) as `inset + fraction * (100% - 2*inset)`, so the field's
  // own width and height never need measuring — the transform carries only the
  // drift delta and the depth scale.
  // Touch: a tap selects, a tap anywhere else deselects. Only mounted while
  // something is selected, so nothing is listening at rest.
  useEffect(() => {
    if (active === null) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element)?.closest?.(".sk-node-btn")) setActive(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);

  // The field's geometry, read ONCE per resize and never inside the loop, so
  // "the loop performs zero DOM reads" still holds.
  const sizeRef = useRef<{ w: number; h: number } | null>(null);
  const bodiesRef = useRef<Body[] | null>(null);
  const zonesRef = useRef<Rect[]>([]);
  // A node's CSS base, in px. The transform carries only the delta from it, so
  // the resting layout in the server-rendered HTML is untouched.
  const baseRef = useRef<{ x: number; y: number }[]>([]);

  const layout = useCallback((t: number, seeds: NodeSeed[]) => {
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
      el.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(
        2
      )}px, 0) scale(${(0.88 + z * 0.24).toFixed(4)})`;
      el.style.zIndex = String(Math.round(z * 100));
      // Depth reads on the circle only. The label keeps its full #6B6455 —
      // dimming type that a reader has to read would break CLAUDE.md § 11.
      ring.style.opacity = (
        TIER_OPACITY[s.tool.tier] * (0.88 + (z - 0.5) * 0.24)
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
    const g = linksRef.current;
    const a = activeRef.current;
    if (!g || a === null || !bodies) return;
    const from = bodies[a];
    if (!from) return;
    // Integers. Sub-pixel endpoints make a 0.5px hairline shiver against its
    // own antialiasing as the nodes drift.
    const x1 = String(Math.round(from.x));
    const y1 = String(Math.round(from.y));
    for (const el of Array.from(g.children) as SVGLineElement[]) {
      const to = bodies[Number(el.dataset.to)];
      if (!to) continue;
      el.setAttribute("x1", x1);
      el.setAttribute("y1", y1);
      el.setAttribute("x2", String(Math.round(to.x)));
      el.setAttribute("y2", String(Math.round(to.y)));
    }
  }, []);

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
      { rootMargin: "80px" }
    );
    io.observe(field);

    const onVisibility = () => (document.hidden ? halt() : run());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      halt();
    };
  }, [reduced, layout]);

  const tool = active === null ? null : NODE_SEEDS[active].tool;

  // The readout outlives the selection by one exit. A conditionally rendered
  // card unmounts the instant `active` goes null, leaving nothing for the
  // 180ms fade to animate — the same `shown` vs `open` split § 06's plate
  // already uses. The timer is created only by a deselection and cleared on
  // every change, so nothing is pending once the page settles.
  const [shown, setShown] = useState<typeof tool>(null);
  useEffect(() => {
    if (tool) {
      setShown(tool);
      return;
    }
    if (!shown) return;
    const t = window.setTimeout(() => setShown(null), 180);
    return () => window.clearTimeout(t);
  }, [tool, shown]);
  // Reduced motion is deliberately NOT consulted here. It is a client-only
  // value, so branching on it during render produces a hydration mismatch that
  // React does not patch up — the arcs would stay at 0 sweep for exactly the
  // people the rule is meant to serve. The full-sweep override lives in CSS
  // instead (see the reduced-motion block for .sk-arc), where it beats the
  // presentation attribute and needs no JS at all.
  const isSwept = (i: number) => visited.has(i);

  const address = useCallback((i: number) => {
    setHover(i);
    setVisited((v) => (v.has(i) ? v : new Set(v).add(i)));
  }, []);

  // The nodes this one shipped something with. Derived once per selection, not
  // per frame — the wiring is data and never changes.
  const linked = active === null ? null : LINKED.get(NODE_SEEDS[active].tool.name)!;
  const linkedSet = linked ? new Set(linked) : null;

  // Nearest first, by straight-line distance from the addressed node. Ordering
  // here is what makes the 40ms stagger read as the wiring propagating outward
  // rather than as an arbitrary sequence. Positions come from the composed
  // homes rather than from the live bodies so the order is stable for the whole
  // time a node is held; the physics only moves the endpoints, never the story.
  const drawOrder = useMemo(() => {
    if (!linked || active === null) return [];
    const base = baseRef.current;
    if (!base.length) return linked;
    const from = base[active];
    return [...linked].sort(
      (i, j) =>
        Math.hypot(base[i].x - from.x, base[i].y - from.y) -
        Math.hypot(base[j].x - from.x, base[j].y - from.y),
    );
    // baseRef is a ref by design: it is re-measured only on mount and resize,
    // and re-sorting on every hover would be the same answer every time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, linked]);

  // Arrow-key traversal, by ANGLE-WEIGHTED distance rather than raw distance:
  // a node 300px to the right beats one 200px away but 70° off the axis, which
  // is what makes "right" mean right. Candidates more than ~70° off-axis are
  // not candidates at all.
  const onFieldKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        setPinned(null);
        setHover(null);
        fieldRef.current?.focus();
        e.preventDefault();
        return;
      }
      const dir = (
        {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        } as Record<string, [number, number]>
      )[e.key];
      if (!dir) return;
      const buttons = Array.from(
        fieldRef.current?.querySelectorAll<HTMLButtonElement>(".sk-node-btn") ??
          [],
      );
      const current = buttons.indexOf(
        document.activeElement as HTMLButtonElement,
      );
      if (current < 0) return;
      e.preventDefault();
      const base = baseRef.current;
      if (!base.length) return;
      const from = base[current];
      let best = -1;
      let bestScore = Infinity;
      for (let j = 0; j < base.length; j++) {
        if (j === current) continue;
        const dx = base[j].x - from.x;
        const dy = base[j].y - from.y;
        const d = Math.hypot(dx, dy);
        if (d < 1) continue;
        const cos = (dx * dir[0] + dy * dir[1]) / d;
        if (cos < 0.35) continue; // more than ~70 degrees off-axis
        const score = d / cos;
        if (score < bestScore) {
          bestScore = score;
          best = j;
        }
      }
      if (best >= 0) buttons[best]?.focus();
    },
    [],
  );

  return (
    <SectionShell number={number} id={id} label={label}>
      <div className="sk-stage">
        {/* ── the readout, cols 1–4. Fixed: it never moves and never drifts. */}
        <div className="sk-readout" aria-live="polite">
          {shown === null ? (
            <>
              <p className="sk-readout-rest font-mono text-mono-label uppercase">
                select a node
              </p>
              <p className="sk-readout-count font-mono text-mono-micro uppercase">
                {TOOLS.length} tools · {CLUSTERS.length} domains
              </p>
            </>
          ) : (
            // Keyed on the tool, so switching nodes remounts and the wipe
            // replays from the start instead of interpolating mid-transition.
            <div
              className="sk-readout-card"
              key={shown.name}
              data-out={tool === null ? "" : undefined}
            >
              <p className="sk-readout-name font-display font-medium">{shown.name}</p>
              <p className="sk-readout-cat font-mono text-mono-label uppercase">
                {CLUSTER_LABEL.get(shown.cluster)}
              </p>
              <span aria-hidden="true" className="sk-readout-rule" />
              <p className="sk-readout-ev font-display">{shown.evidence}</p>
              {/* The fourth line is the linkage in words. The two contexts that
                  are § 04 rows link into the register; the transit API and
                  coursework do not, because there is nothing on this page for
                  them to land on and a link that scrolls nowhere is worse than
                  no link. */}
              <p className="sk-readout-ctx font-mono">
                appears in —{" "}
                {shown.contexts.map((c, k) => {
                  const href = CONTEXT_HREF.get(c);
                  const label = CONTEXT_LABEL.get(c);
                  return (
                    <span key={c}>
                      {k > 0 && ", "}
                      {href ? (
                        <a
                          href={href}
                          className="sk-readout-link"
                          data-cursor="pen-down"
                          onClick={(e) => {
                            const el = document.querySelector(href);
                            if (!el) return;
                            e.preventDefault();
                            scrollToElement(el as HTMLElement);
                          }}
                        >
                          {label}
                        </a>
                      ) : (
                        label
                      )}
                    </span>
                  );
                })}
              </p>
            </div>
          )}
        </div>

        {/* ── the field, cols 5–12. Not mounted below 900px — the static
            fallback below takes over there. */}
        <div
          className="sk-field"
          ref={fieldRef}
          tabIndex={-1}
          onKeyDown={onFieldKeyDown}
          data-quiet={active !== null ? "" : undefined}
          data-domain={tool ? tool.cluster : undefined}
        >
          {/* ── the wiring. Behind every ring, so a line terminates UNDER the
              dial it points at rather than crossing its label. Rendered only
              while a node is addressed: a permanent web between 17 nodes is
              noise, and the whole claim this section makes is that the
              structure is there to be revealed, not to be displayed.

              pathLength="1" is load-bearing. The nodes drift, so a line's real
              length changes every frame; a dasharray computed from its initial
              length would break the moment it grew. Normalised, the fraction
              stays correct whatever the geometry does. */}
          <svg className="sk-links" aria-hidden="true">
            <g
              ref={linksRef}
              onAnimationEnd={(e) => {
                // Clear the dash geometry the instant the draw is over. A path
                // still carrying a dasharray re-evaluates it against any later
                // scale change, and this exact omission has caused three
                // separate visible regressions on this site.
                const el = e.target as SVGLineElement;
                el.removeAttribute("stroke-dasharray");
                el.removeAttribute("stroke-dashoffset");
                el.setAttribute("data-drawn", "");
              }}
            >
              {active !== null &&
                drawOrder.map((j, k) => {
                  const base = baseRef.current;
                  const a = base[active];
                  const b = base[j];
                  return (
                    // Keyed on the pair, so switching nodes remounts every line
                    // and the draw replays from the start — a line reused
                    // across two selections would keep its finished state.
                    <line
                      key={`${active}-${j}`}
                      data-to={j}
                      x1={a ? Math.round(a.x) : 0}
                      y1={a ? Math.round(a.y) : 0}
                      x2={b ? Math.round(b.x) : 0}
                      y2={b ? Math.round(b.y) : 0}
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1}
                      style={{ animationDelay: `${k * 40}ms` }}
                    />
                  );
                })}
            </g>
          </svg>

          {/* Dev-only: outlines the four keep-out zones so the amplitude clamp
              can be checked by eye against the drifting field. Gated on
              NODE_ENV, so it is eliminated from the production bundle. */}
          {process.env.NODE_ENV === "development" && zones && (
            <>
              {keepOutZones(zones.w, zones.h).map((z, k) => (
                <span
                  key={k}
                  aria-hidden="true"
                  data-keepout=""
                  style={{
                    position: "absolute",
                    left: z.x0,
                    top: z.y0,
                    width: z.x1 - z.x0,
                    height: z.y1 - z.y0,
                    outline: "0.5px dashed #22384F",
                    pointerEvents: "none",
                    zIndex: 300,
                  }}
                />
              ))}
            </>
          )}

          {CLUSTERS.map((c) => (
            <span
              key={c.id}
              aria-hidden="true"
              className="sk-cluster-label font-mono uppercase"
              data-cluster={c.id}
            >
              <span aria-hidden="true" className="sk-cluster-mark" />
              <span aria-hidden="true" className="sk-cluster-leader" />
              {c.label}
            </span>
          ))}

          {NODE_SEEDS.map((s, i) => {
            const swept = isSwept(i);
            return (
            <div
              key={s.tool.name}
              className="sk-node"
              data-tier={s.tool.tier}
              data-active={active === i ? "" : undefined}
              data-linked={linkedSet?.has(i) ? "" : undefined}
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              style={nodeStyle(s)}
            >
              <button
                type="button"
                className="sk-node-btn"
                data-cursor="pen-down"
                aria-pressed={pinned === i}
                aria-label={`${s.tool.name} — ${CLUSTER_LABEL.get(s.tool.cluster)}`}
                // Hover is for pointers that hover. A touch fires
                // pointerenter too and never fires the matching leave, which
                // is exactly how a "hover" state gets stuck on a phone; the
                // pointerType gate is what stops it, and the tap goes through
                // onClick like any other press.
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") address(i);
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse")
                    setHover((v) => (v === i ? null : v));
                }}
                onFocus={() => address(i)}
                onBlur={() => setHover((v) => (v === i ? null : v))}
                // A click PINS: the selection survives the pointer leaving, so
                // the readout's links can actually be walked to. Clicking the
                // pinned node again, or anywhere off a node, unpins.
                onClick={() => {
                  setPinned((v) => (v === i ? null : i));
                  address(i);
                }}
              >
                {/* The focus bracket — four registration corners, the same
                    motif as § 04's thumbnails and § 06's plates, in accent.
                    The browser default is suppressed only because this
                    replaces it: a round outline on a dial read as a second
                    ring, which is the one thing this section cannot afford. */}
                {(["tl", "tr", "bl", "br"] as const).map((c) => (
                  <span
                    key={c}
                    aria-hidden="true"
                    className="sk-node-focus"
                    data-c={c}
                  />
                ))}

                <span
                  className="sk-node-ring"
                  aria-hidden="true"
                  style={{
                    opacity:
                      TIER_OPACITY[s.tool.tier] *
                      (0.88 + (drift(s, 0).z - 0.5) * 0.24),
                  }}
                  ref={(el) => {
                    ringRefs.current[i] = el;
                  }}
                >
                  {(() => {
                    const d = DIALS.get(s.tool.name)!;
                    return (
                      <svg viewBox={`0 0 ${d.box * 2} ${d.box * 2}`} focusable="false">
                        <circle
                          cx={d.c}
                          cy={d.c}
                          r={s.r - 0.5}
                          fill="none"
                          stroke="#1A1815"
                          strokeWidth={0.5}
                          vectorEffect="non-scaling-stroke"
                        />
                        {/* The ticks live in their own group so the settle can
                            rotate them. That group is a CHILD of the node the
                            drift loop writes transform to, so the two never
                            touch the same element's transform — the separation
                            is structural, not a convention. Origin is the
                            viewBox's centre, which is the dial's centre
                            exactly; fill-box would take the group's bounding
                            box, and a primary's longer index tick makes that
                            box asymmetric. */}
                        <g className="sk-ticks">
                        {d.ticks.map((t, k) => (
                          <line
                            key={k}
                            className="sk-tick"
                            x1={t.x1}
                            y1={t.y1}
                            x2={t.x2}
                            y2={t.y2}
                            stroke="#1A1815"
                            strokeWidth={0.5}
                            vectorEffect="non-scaling-stroke"
                            pathLength={TICK_HOVER}
                            /* Shown short at rest, full on hover: the offset
                               trims the FAR end, so the tick never detaches
                               from the ring. The index mark at 12 o'clock on a
                               primary is drawn at its full 9px and never
                               animates — it is a fixed reference. */
                            strokeDasharray={TICK_HOVER}
                            style={
                              t.index
                                ? { strokeDashoffset: 0 }
                                : { transitionDelay: `${k * 12}ms` }
                            }
                          />
                        ))}
                        </g>
                        {/* The value the dial carries. Swept on first visit and
                            kept — pathLength normalises it so no measurement is
                            needed and the server can render it at 0. */}
                        <path
                          className="sk-arc"
                          d={d.arc}
                          fill="none"
                          stroke="#1A1815"
                          strokeWidth={0.5}
                          vectorEffect="non-scaling-stroke"
                          pathLength={100}
                          strokeDasharray={100}
                          strokeDashoffset={swept ? 0 : 100}
                        />
                      </svg>
                    );
                  })()}
                </span>
                <span
                  className="sk-node-label font-mono"
                  style={{ fontSize: `${s.fontSize}px` }}
                >
                  {s.tool.name}
                </span>
                {/* Plate annotation, not a caption: small enough to read as an
                    index into the field rather than as content. */}
                <span aria-hidden="true" className="sk-node-idx font-mono">
                  {NODE_INDEX.get(s.tool.name)}
                </span>
              </button>
            </div>
            );
          })}
        </div>

        {/* ── below 900px the field does not mount at all. This is the section,
            not a degraded copy of it: the four domains as headings with their
            tools beneath. */}
        <div className="sk-static">
          {CLUSTERS.map((c) => (
            <div key={c.id} className="sk-static-group">
              <h3 className="sk-static-head font-mono text-mono-label uppercase">
                {c.label}
              </h3>
              <ul className="sk-static-list font-mono">
                {TOOLS.filter((t) => t.cluster === c.id).map((t) => (
                  <li key={t.name} data-tier={t.tier}>
                    {t.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* The content, independent of the field. A screen reader gets every
            tool, its domain and its evidence without touching a node. */}
        <ul className="sr-only">
          {TOOLS.map((t) => (
            <li key={t.name}>
              {t.name} — {CLUSTER_LABEL.get(t.cluster)} — {t.evidence}
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  );
}
