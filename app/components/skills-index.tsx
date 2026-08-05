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
import SkillsNode from "./skills-node";
import SkillsReadout from "./skills-readout";
import { useFieldMotion } from "./skills-field-motion";

// § 02's index — the drifting field, moved under the project rows.
//
// MOVED, NOT REBUILT. Node positions, sizes, the drift algorithm, the physics,
// the four-quadrant arrangement, the readout rail, the per-node evidence lines
// and the whole co-occurrence linkage / gold / keyboard pass from 712239f are
// all exactly as they were. It has been rebuilt three times and this is not a
// fourth.
//
// The ONE structural change: the addressed node is no longer this component's
// own state. It is lifted to § 02, because a project row's stack token can now
// address a node too, and two entry points writing to two copies of "which node
// is active" is how they drift apart. This component renders the selection and
// reports intent; it does not own the answer.

export default function SkillsIndex({
  active,
  pinned,
  onAddress,
  onLeave,
  onPin,
  onClear,
}: {
  active: number | null;
  pinned: number | null;
  onAddress: (i: number) => void;
  onLeave: (i: number) => void;
  onPin: (i: number) => void;
  onClear: () => void;
}) {
  const reduced = useReducedMotion();

  // The loop reads the active index without re-subscribing every hover. § 02
  // owns the value; this is the loop's window onto it, written on every render
  // and read on every frame.
  const activeRef = useRef<number | null>(null);
  activeRef.current = active;

  const { fieldRef, nodeRefs, ringRefs, linksRef, baseRef } = useFieldMotion(
    reduced,
    activeRef,
  );

  // The one thing the field accumulates. An arc sweeps on first visit and stays
  // swept, so a visitor who has explored can see which dials they opened. Keyed
  // off `active` rather than off the pointer, so a stack token addressing a node
  // sweeps its arc exactly as hovering the dial does — it is the same selection.
  const [visited, setVisited] = useState<Set<number>>(() => new Set());
  useEffect(() => {
    if (active === null) return;
    setVisited((v) => (v.has(active) ? v : new Set(v).add(active)));
  }, [active]);

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
      const t = e.target as Element | null;
      if (!t?.closest?.(".sk-node-btn") && !t?.closest?.(".proj-tool")) onClear();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClear();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [active, onClear]);

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

  // Reduced motion is deliberately NOT consulted during render. It is a
  // client-only value, so branching on it here produces a hydration mismatch
  // React does not patch up — the arcs would stay at 0 sweep for exactly the
  // people the rule serves. The full-sweep override lives in CSS.
  const isSwept = (i: number) => visited.has(i);

  // The nodes this one shipped something with. Derived once per selection, not
  // per frame — the wiring is data and never changes.
  const linked = active === null ? null : LINKED.get(NODE_SEEDS[active].tool.name)!;
  const linkedSet = linked ? new Set(linked) : null;

  // Nearest first, by straight-line distance from the addressed node. Ordering
  // is what makes the 40ms stagger read as the wiring propagating outward
  // rather than as an arbitrary sequence.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, linked]);

  // Arrow-key traversal, by ANGLE-WEIGHTED distance rather than raw distance:
  // a node 300px to the right beats one 200px away but 70° off the axis.
  const onFieldKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        onClear();
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
    [fieldRef, baseRef, onClear],
  );

  return (
    <div className="sk-stage">
      <SkillsReadout shown={shown} tool={tool} />

      {/* ── the field. Not mounted below 900px — the static list below is the
          index there, not a degraded copy of it. */}
      <div
        className="sk-field"
        ref={fieldRef}
        tabIndex={-1}
        onKeyDown={onFieldKeyDown}
        data-quiet={active !== null ? "" : undefined}
        data-domain={tool ? tool.cluster : undefined}
      >
        {/* ── the wiring. Behind every ring, so a line terminates UNDER the
            dial it points at. Rendered only while a node is addressed.

            pathLength="1" is load-bearing: the nodes drift, so a line's real
            length changes every frame and a dasharray computed from its
            initial length would break the moment it grew. */}
        <svg className="sk-links" aria-hidden="true">
          <g
            ref={linksRef}
            onAnimationEnd={(e) => {
              // Clear the dash geometry the instant the draw is over. A path
              // still carrying a dasharray re-evaluates it against any later
              // scale change, and this omission has caused three separate
              // visible regressions on this site.
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
                  // and the draw replays from the start.
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

        {/* Dev-only: outlines the four keep-out zones. Gated on NODE_ENV, so it
            is eliminated from the production bundle. */}
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
            onAddress={onAddress}
            onLeave={onLeave}
            onPin={onPin}
            nodeRef={(el) => {
              nodeRefs.current[i] = el;
            }}
            ringRef={(el) => {
              ringRefs.current[i] = el;
            }}
          />
        ))}
      </div>

      {/* ── below 900px the field does not mount at all. This is the index
          there: the four domains as headings with their tools beneath. */}
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
  );
}
