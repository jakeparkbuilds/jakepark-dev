// § 02's index — pure geometry. No React, no state, no DOM.
//
// Split out of skills.tsx ahead of the § 02 merge. Everything here is computed
// once at module scope from the seeds in ./skills, which is what makes the
// server-rendered HTML frame t = 0 exactly: hydration matches byte for byte and
// the reduced-motion path needs no JS at all.

import {
  ARC_INSET,
  CLUSTERS,
  NODE_SEEDS,
  TICK_COUNT,
  TICK_HOVER,
  TICK_REACH,
  TIER_SWEEP,
  drift,
  type NodeSeed,
} from "./skills";

export const CLUSTER_LABEL = new Map(CLUSTERS.map((c) => [c.id, c.label]));

// A node is a dial, not a bubble: a hairline ring, 12 circumference ticks, an
// inner arc whose sweep is the value it carries, the tool name, and a plate
// index.
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

export type Dial = ReturnType<typeof dial>;

export const DIALS = new Map(NODE_SEEDS.map((s) => [s.tool.name, dial(s)]));

// The resting frame, computed once at module scope from the same seeds and the
// same drift() the loop uses — so the server-rendered HTML *is* frame t = 0.
// The base position is expressed in CSS as `inset + fraction × (100% −
// 2·inset)`, where inset = radius + amplitude: base ± drift therefore cannot
// reach an edge at any field size. Bounds are structural.
export function nodeStyle(s: NodeSeed): React.CSSProperties {
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
