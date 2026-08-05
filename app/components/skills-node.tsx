"use client";

import {
  NODE_INDEX,
  TICK_HOVER,
  TIER_OPACITY,
  drift,
  type NodeSeed,
} from "../lib/skills";
import { CLUSTER_LABEL, DIALS, nodeStyle } from "../lib/skills-geometry";

// § 02's index — one node.
//
// Split out of skills.tsx ahead of the § 02 merge. Pure move: the markup, the
// handlers, the gating and the presentation attributes are exactly what was
// inline in the component's map. The only change is that the values the closure
// used to read directly now arrive as props.

const CORNERS = ["tl", "tr", "bl", "br"] as const;

export default function SkillsNode({
  s,
  i,
  swept,
  isActive,
  isLinked,
  isPinned,
  onAddress,
  onLeave,
  onPin,
  nodeRef,
  ringRef,
}: {
  s: NodeSeed;
  i: number;
  swept: boolean;
  isActive: boolean;
  isLinked: boolean;
  isPinned: boolean;
  onAddress: (i: number) => void;
  onLeave: (i: number) => void;
  onPin: (i: number) => void;
  nodeRef: (el: HTMLDivElement | null) => void;
  ringRef: (el: HTMLSpanElement | null) => void;
}) {
  const d = DIALS.get(s.tool.name)!;
  return (
    <div
      className="sk-node"
      data-tier={s.tool.tier}
      data-active={isActive ? "" : undefined}
      data-linked={isLinked ? "" : undefined}
      ref={nodeRef}
      style={nodeStyle(s)}
    >
      <button
        type="button"
        className="sk-node-btn"
        data-cursor="pen-down"
        aria-pressed={isPinned}
        aria-label={`${s.tool.name} — ${CLUSTER_LABEL.get(s.tool.cluster)}`}
        // Hover is for pointers that hover. A touch fires pointerenter too and
        // never fires the matching leave, which is exactly how a "hover" state
        // gets stuck on a phone; the pointerType gate is what stops it, and the
        // tap goes through onClick like any other press.
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") onAddress(i);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === "mouse") onLeave(i);
        }}
        onFocus={() => onAddress(i)}
        onBlur={() => onLeave(i)}
        // A click PINS: the selection survives the pointer leaving, so the
        // readout's links can actually be walked to. Clicking the pinned node
        // again, or anywhere off a node, unpins.
        onClick={() => onPin(i)}
      >
        {/* The focus bracket — four registration corners, the same motif as
            § 02's thumbnails and § 04's plates, in accent. The browser default
            is suppressed only because this replaces it: a round outline on a
            dial read as a second ring, which is the one thing this section
            cannot afford. */}
        {CORNERS.map((c) => (
          <span key={c} aria-hidden="true" className="sk-node-focus" data-c={c} />
        ))}

        <span
          className="sk-node-ring"
          aria-hidden="true"
          style={{
            opacity:
              TIER_OPACITY[s.tool.tier] * (0.88 + (drift(s, 0).z - 0.5) * 0.24),
          }}
          ref={ringRef}
        >
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
            {/* The ticks live in their own group so the settle can rotate them.
                That group is a CHILD of the node the drift loop writes transform
                to, so the two never touch the same element's transform — the
                separation is structural, not a convention. Origin is the
                viewBox's centre, which is the dial's centre exactly; fill-box
                would take the group's bounding box, and a primary's longer index
                tick makes that box asymmetric. */}
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
                  /* Shown short at rest, full on hover: the offset trims the FAR
                     end, so the tick never detaches from the ring. The index
                     mark at 12 o'clock on a primary is drawn at its full 9px and
                     never animates — it is a fixed reference. */
                  strokeDasharray={TICK_HOVER}
                  style={
                    t.index
                      ? { strokeDashoffset: 0 }
                      : { transitionDelay: `${k * 12}ms` }
                  }
                />
              ))}
            </g>
            {/* The value the dial carries. Swept on first visit and kept —
                pathLength normalises it so no measurement is needed and the
                server can render it at 0. */}
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
        </span>
        <span
          className="sk-node-label font-mono"
          style={{ fontSize: `${s.fontSize}px` }}
        >
          {s.tool.name}
        </span>
        {/* Plate annotation, not a caption: small enough to read as an index
            into the field rather than as content. */}
        <span aria-hidden="true" className="sk-node-idx font-mono">
          {NODE_INDEX.get(s.tool.name)}
        </span>
      </button>
    </div>
  );
}
