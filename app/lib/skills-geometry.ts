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

/** The depth cycle's scale, from drift()'s z. One definition, used by the
 *  server-rendered resting frame, by the loop, and by the linkage offsets — all
 *  three have to agree about how big a node currently is. */
export const depthScale = (z: number) => 0.88 + z * 0.24;

// ── the linkage's endpoint geometry ─────────────────────────────────────────
//
// A line runs from OUTSIDE the addressed node's ink to OUTSIDE the target's,
// never from centre to centre: seventeen lines converging on one point put a
// knot of overlapping strokes behind the active node's own label.
//
// The outer radius is the DIAL'S OWN BOX — ring plus the longest tick — and not
// the ring. The ticks sit outside the ring, so an endpoint at the ring radius
// would land in the middle of the tick field and read as a line that failed to
// reach. It is scaled by whatever the depth cycle currently has the node at,
// because that scale is applied to the rendered ring and ticks and the SVG the
// lines live in is unscaled.

/** Clear air between a node's outermost ink and the line that points at it. */
export const LINK_GAP = 3;

/** Ring + longest tick, per node, in field px at scale 1. */
export const OUTER_R = NODE_SEEDS.map((s) => s.r + TICK_REACH);

// The t = 0 frame — the one the server renders, and the ONLY one the
// reduced-motion path ever shows, since the loop is never created there.
const REST_FRAME = NODE_SEEDS.map((s) => drift(s, 0));

/** The depth scale at t = 0, per node. */
export const REST_SCALE = REST_FRAME.map(({ z }) => depthScale(z));

/** t = 0's drift offset from the composed home, per node. A node's home is NOT
 *  where it is drawn: nodeStyle translates it by this much, and createBodies
 *  starts every body at home + this. Anything positioning against a node at
 *  rest has to add it — the linkage endpoints did not, and under reduced
 *  motion, where nothing ever corrects them, an endpoint landed a measured
 *  18.2px INSIDE a node's ink. */
export const REST_DELTA = REST_FRAME.map(({ dx, dy }) => ({ dx, dy }));

/** Both endpoints pushed out along the centre-to-centre unit vector by that
 *  node's own outer radius plus the gap, rounded to integers — a 0.5px hairline
 *  shivers against its own antialiasing on sub-pixel endpoints.
 *
 *  Returns null when the two offsets would cross, i.e. when the nodes are
 *  closer than the ink they carry. Drawing that pair gives a line pointing
 *  backwards through both of them; there is no correct short line to draw, so
 *  the caller skips it. */
export function linkEnds(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
) {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.hypot(dx, dy);
  const a0 = ar + LINK_GAP;
  const b0 = br + LINK_GAP;
  if (!(d > a0 + b0)) return null;
  const ux = dx / d;
  const uy = dy / d;
  const x1 = Math.round(ax + ux * a0);
  const y1 = Math.round(ay + uy * a0);
  const x2 = Math.round(bx - ux * b0);
  const y2 = Math.round(by - uy * b0);
  // The direction is checked AFTER the rounding, not before it. A pair barely
  // clear of the offsets leaves a sub-pixel segment, and rounding four
  // coordinates independently moves each end by up to 0.5px — enough to invert
  // one. Measured: fastapi → next.js at 1440 drew backwards on 13 sampled
  // frames with the check done on the raw distance alone.
  if ((x2 - x1) * ux + (y2 - y1) * uy <= 0) return null;
  return { x1, y1, x2, y2 };
}

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
    transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${depthScale(
      z,
    ).toFixed(4)})`,
    zIndex: Math.round(z * 100),
  };
}
