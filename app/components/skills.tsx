"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CLUSTERS,
  LINKED,
  NODE_SEEDS,
  TOOLS,
  keepOutZones,
} from "../lib/skills";
import { CLUSTER_LABEL } from "../lib/skills-geometry";
import { useReducedMotion } from "../lib/use-reduced-motion";
import SectionShell from "./section-shell";
import SkillsNode from "./skills-node";
import SkillsReadout from "./skills-readout";
import { useFieldMotion } from "./skills-field-motion";

// § 02's index — the drifting field. Selection state and composition.
//
// 17 tools as hairline dials on a slow drift, with a fixed readout rail that
// names whichever node is addressed and says what Jake actually did with it.
// The evidence line is the point: it is what makes this content rather than
// decoration.
//
// This file was 811 lines and was split ahead of the § 02 merge, into:
//   ../lib/skills-geometry.ts  — dial geometry, DIALS, nodeStyle. No React.
//   ./skills-field-motion.ts   — the refs, `layout`, the measurement effect and
//                                the one rAF loop.
//   ./skills-node.tsx          — one node.
//   ./skills-readout.tsx       — the readout rail.
// What is left here is selection state, the derived wiring, keyboard traversal
// and the composition. The split is a pure move: no renamed props, no changed
// logic, no improvements.

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

  // The loop reads the active index without re-subscribing every hover. This
  // component is its ONLY writer, which is why the ref is owned here and handed
  // to the motion hook rather than the other way round.
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;

  const { fieldRef, nodeRefs, ringRefs, linksRef, baseRef } = useFieldMotion(
    reduced,
    activeRef,
  );

  // Dev-only, for the keep-out overlay below.
  const [zones, setZones] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!new URLSearchParams(location.search).has("keepout")) return;
    const f = fieldRef.current;
    if (f) setZones({ w: f.clientWidth, h: f.clientHeight });
  }, [fieldRef]);

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
  }, [active, setActive]);

  const tool = active === null ? null : NODE_SEEDS[active].tool;

  // The readout outlives the selection by one exit. The timer is created only
  // by a deselection and cleared on every change, so nothing is pending once
  // the page settles.
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
  const leave = useCallback((i: number) => {
    setHover((v) => (v === i ? null : v));
  }, []);
  const pin = useCallback(
    (i: number) => {
      setPinned((v) => (v === i ? null : i));
      address(i);
    },
    [address],
  );

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
    [fieldRef, baseRef],
  );

  return (
    <SectionShell number={number} id={id} label={label}>
      <div className="sk-stage">
        <SkillsReadout shown={shown} tool={tool} />

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

          {NODE_SEEDS.map((s, i) => (
            <SkillsNode
              key={s.tool.name}
              s={s}
              i={i}
              swept={isSwept(i)}
              isActive={active === i}
              isLinked={linkedSet?.has(i) ?? false}
              isPinned={pinned === i}
              onAddress={address}
              onLeave={leave}
              onPin={pin}
              nodeRef={(el) => {
                nodeRefs.current[i] = el;
              }}
              ringRef={(el) => {
                ringRefs.current[i] = el;
              }}
            />
          ))}
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
