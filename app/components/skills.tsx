"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ARC_INSET,
  CLUSTERS,
  keepOutZones,
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
  const [active, setActive] = useState<number | null>(null);
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

  const layout = useCallback((t: number, seeds: NodeSeed[]) => {
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const el = nodeRefs.current[i];
      const ring = ringRefs.current[i];
      if (!el || !ring) continue;
      const { dx, dy, z } = drift(s, t - offsets.current[i]);
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
  // Reduced motion is deliberately NOT consulted here. It is a client-only
  // value, so branching on it during render produces a hydration mismatch that
  // React does not patch up — the arcs would stay at 0 sweep for exactly the
  // people the rule is meant to serve. The full-sweep override lives in CSS
  // instead (see the reduced-motion block for .sk-arc), where it beats the
  // presentation attribute and needs no JS at all.
  const isSwept = (i: number) => visited.has(i);

  const address = useCallback((i: number) => {
    setActive(i);
    setVisited((v) => (v.has(i) ? v : new Set(v).add(i)));
  }, []);

  return (
    <SectionShell number={number} id={id} label={label}>
      <div className="sk-stage">
        {/* ── the readout, cols 1–4. Fixed: it never moves and never drifts. */}
        <div className="sk-readout" aria-live="polite">
          {tool === null ? (
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
            <div className="sk-readout-card" key={tool.name}>
              <p className="sk-readout-name font-display font-medium">{tool.name}</p>
              <p className="sk-readout-cat font-mono text-mono-label uppercase">
                {CLUSTER_LABEL.get(tool.cluster)}
              </p>
              <span aria-hidden="true" className="sk-readout-rule" />
              <p className="sk-readout-ev font-display">{tool.evidence}</p>
            </div>
          )}
        </div>

        {/* ── the field, cols 5–12. Not mounted below 900px — the static
            fallback below takes over there. */}
        <div
          className="sk-field"
          ref={fieldRef}
          data-quiet={active !== null ? "" : undefined}
          data-domain={tool ? tool.cluster : undefined}
        >
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
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              style={nodeStyle(s)}
            >
              <button
                type="button"
                className="sk-node-btn"
                data-cursor="pen-down"
                aria-pressed={active === i}
                onPointerEnter={() => address(i)}
                onPointerLeave={() => setActive((v) => (v === i ? null : v))}
                onFocus={() => address(i)}
                onBlur={() => setActive((v) => (v === i ? null : v))}
                onClick={() => (active === i ? setActive(null) : address(i))}
              >
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
