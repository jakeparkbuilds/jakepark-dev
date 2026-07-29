"use client";

import {
  drift,
  keepOutZones,
  SCALE_MAX,
  TICK_REACH,
  type NodeSeed,
  type Rect,
} from "./skills";

// § 05 — the field's runtime.
//
// This REPLACES the seeded-sine drift at runtime, and that is a deliberate
// reversal of how the section used to work. Previously a node's position was a
// pure function of time: `base + sin(t)`, bounded structurally, with no state,
// no bounce and no collision resolution anywhere. That guaranteed nodes stayed
// inside the field and kept their labels apart, but it also meant two nodes
// could pass straight through one another — which they visibly did once the
// drift was sped up.
//
// So the field is kinematic now. Each node carries a position and a velocity,
// travels in a straight line, and reflects elastically off the other nodes, off
// the four domain-label keep-out zones, and off the field's own edges. The
// arrangement genuinely evolves: a deflection changes where a node goes from
// then on and it never returns to a seeded path, because there is no longer a
// seeded path to return to.
//
// What the seed still decides: where every node starts (the same t = 0 frame
// the server renders, so hydration is unchanged), how fast each node travels,
// and which way it sets off. The variety in the field is still seeded; only the
// trajectory is now emergent.
//
// Three rules keep it stable, and all three matter:
//
//   1. Resolve a pair ONLY when it is approaching (relative velocity along the
//      normal < 0). Without this, two nodes resting in contact are "resolved"
//      every frame and buzz against each other forever.
//   2. Positional correction has a slop and a gain below 1. Correcting the
//      whole overlap every frame overshoots and oscillates.
//   3. Every node's speed is renormalised to its seeded speed after the
//      resolution pass. Elastic collisions conserve energy in theory; in
//      floating point with positional correction they do not, and the field
//      either heats up until nodes streak or cools until it stops. Pinning the
//      magnitude means the field looks the same in ten minutes as it does now.

export type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Collision radius: the ring plus 6px of clearance. */
  cr: number;
  /** Half the label's rendered box — names must not overlap either. */
  lw: number;
  lh: number;
  /** Radius used against static walls: the RENDERED ink, so it must budget for
      the 1.12x depth scale rather than using the collision radius. Omitting it
      left a measured 0.85px incursion into the keep-out zones. */
  wallR: number;
  /** Distance from a field edge this node's centre may not cross. */
  insetX: number;
  insetY: number;
  /** Constant speed, from the seed. */
  speed: number;
  /** Where this node was seeded — the centre of its territory. */
  hx: number;
  hy: number;
  /** How far from home it may wander. See LEASH below. */
  leash: number;
};

const CLEARANCE = 6;
const LABEL_PAD = 4;
// Advance width per em for the mono label, matching lib/skills.ts.
const ADVANCE = 0.6;
const SLOP = 0.4; // overlap tolerated before positional correction acts
const CORRECTION = 0.8; // gain on the positional push
// Ceiling on how far one resolution may move a node, per frame. The seeded
// arrangement guaranteed that LABELS stay apart, never that rings do — rings
// were explicitly meant to cross — so on arrival some pairs interpenetrate by
// as much as 69px. Without this cap the correction gain unpacks that in three
// frames and the field visibly snaps as it mounts. With it the field eases into
// its arrangement over ~0.3s. In steady state the cap never binds: the fastest
// closing speed in the field is ~0.3px per frame.
const MAX_PUSH = 2;
const MIN_SPEED = 6; // px/s — two nodes seed to zero travel and must still move

// ---- the leash ----
// Free motion is not the same as unbounded motion. With collisions alone a node
// random-walks: every deflection is permanent, so over a minute or two java can
// end up under INTERFACES and the four axis labels stop describing anything.
// The arrangement is composed cluster by cluster at seed time and that
// composition is CONTENT — a node's neighbourhood is the claim the section
// makes.
//
// So each node keeps its seeded position as a home and may only roam a disc
// around it. It reflects off that disc exactly as it reflects off a zone wall,
// which is why the motion still reads as free travel rather than as a spring:
// nothing pulls it back to the centre, it simply cannot leave the room. The
// radius is drawn from the node's own seeded amplitude, so the field keeps its
// variety — a node the seed gave room to travel still travels further than one
// wedged between two labels.
const LEASH_GAIN = 1.7;
const LEASH_MIN = 52; // px — a node clamped to no travel still gets a room
const LEASH_MAX = 96; // px — beyond this a node reads as having left its region
const LEASH_PULL = 0.7; // px/frame — see the ordering note in step()
const MAX_DT = 1 / 30; // s. Clamps a backgrounded tab's first frame.

/** Half the label's rendered width, in px. */
function labelHalf(s: NodeSeed) {
  return (s.fontSize * ADVANCE * s.tool.name.length) / 2;
}

/**
 * Seed the bodies. Positions are the SAME t = 0 frame the server rendered — the
 * base expressed in CSS as `inset + fraction × (span)`, plus drift(s, 0) — so
 * the field starts exactly where the static HTML put it and nothing jumps on
 * hydration.
 */
export function createBodies(seeds: NodeSeed[], w: number, h: number): Body[] {
  return seeds.map((s) => {
    const box = s.r + TICK_REACH;
    const ix = box + s.ax;
    const iy = box + s.ay;
    const { dx, dy } = drift(s, 0);
    const lw = labelHalf(s) + LABEL_PAD;

    // The peak speed the sine drift used to reach, so the field keeps the pace
    // it has now rather than gaining or losing one.
    const amp = Math.hypot(s.ax, s.ay);
    const speed = Math.max(MIN_SPEED, (2 * Math.PI * amp) / (s.px1 / 1000));
    // Direction from the seed's own phases: still deterministic, still varied,
    // and it is only ever the FIRST direction — collisions own the rest.
    const ang = s.ox1 + s.oy1;

    // Home is the COMPOSED position — the base the seed relaxation solved for,
    // not the t = 0 frame, which is already one drift offset away from it.
    const hx = ix + s.bx * (w - 2 * ix);
    const hy = iy + s.by * (h - 2 * iy);

    return {
      x: hx + dx,
      y: hy + dy,
      hx,
      hy,
      leash: Math.min(
        LEASH_MAX,
        Math.max(LEASH_MIN, Math.hypot(s.ax, s.ay) * LEASH_GAIN)
      ),
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      cr: s.r + CLEARANCE,
      wallR: Math.max(s.r + CLEARANCE, (s.r + TICK_REACH) * SCALE_MAX),
      lw,
      lh: s.fontSize * 0.72 + LABEL_PAD,
      // Keep the rendered ink inside the field: the ring at its largest depth
      // scale, or the label if the label is wider.
      insetX: Math.max((s.r + TICK_REACH) * SCALE_MAX, lw),
      insetY: (s.r + TICK_REACH) * SCALE_MAX,
      speed,
    };
  });
}

/** Reflect a body out of an axis-aligned rectangle along its shallowest face. */
function resolveRect(b: Body, r: Rect, radius: number) {
  const x0 = r.x0 - radius;
  const y0 = r.y0 - radius;
  const x1 = r.x1 + radius;
  const y1 = r.y1 + radius;
  if (b.x <= x0 || b.x >= x1 || b.y <= y0 || b.y >= y1) return;
  // Inside the inflated rect: leave by whichever face is nearest.
  const dLeft = b.x - x0;
  const dRight = x1 - b.x;
  const dTop = b.y - y0;
  const dBottom = y1 - b.y;
  const m = Math.min(dLeft, dRight, dTop, dBottom);
  if (m === dLeft) {
    b.x = x0;
    if (b.vx > 0) b.vx = -b.vx;
  } else if (m === dRight) {
    b.x = x1;
    if (b.vx < 0) b.vx = -b.vx;
  } else if (m === dTop) {
    b.y = y0;
    if (b.vy > 0) b.vy = -b.vy;
  } else {
    b.y = y1;
    if (b.vy < 0) b.vy = -b.vy;
  }
}

/**
 * Advance the field by `dtMs`. `held` is the index of a node the pointer is
 * holding: it stops dead and behaves as immovable, so the node that runs into
 * it takes the whole deflection.
 */
export function step(
  bodies: Body[],
  zones: Rect[],
  w: number,
  h: number,
  dtMs: number,
  held: number | null
) {
  const dt = Math.min(dtMs / 1000, MAX_DT);
  if (dt <= 0) return;
  const n = bodies.length;

  // ---- integrate ----
  for (let i = 0; i < n; i++) {
    if (i === held) continue;
    const b = bodies[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }

  // ---- pairs: O(n²) over 17 nodes is 136 checks, which is nothing ----
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = bodies[i];
      const b = bodies[j];
      const aHeld = i === held;
      const bHeld = j === held;
      if (aHeld && bHeld) continue;

      // Rings first.
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.hypot(dx, dy);
      const min = a.cr + b.cr;
      if (dist > 0 && dist < min) {
        const nx = dx / dist;
        const ny = dy / dist;
        separate(a, b, nx, ny, min - dist, aHeld, bHeld);
      }

      // Then names. A label box is much wider than its ring, so ring clearance
      // alone does NOT keep two names apart — which is exactly the overlap
      // that was visible (xgboost/python, c++/sql, fastapi/next.js). Resolved
      // as an AABB along whichever axis is least penetrated.
      dx = b.x - a.x;
      dy = b.y - a.y;
      const ox = a.lw + b.lw - Math.abs(dx);
      const oy = a.lh + b.lh - Math.abs(dy);
      if (ox > 0 && oy > 0) {
        if (ox < oy) {
          const nx = dx >= 0 ? 1 : -1;
          separate(a, b, nx, 0, ox, aHeld, bHeld);
        } else {
          const ny = dy >= 0 ? 1 : -1;
          separate(a, b, 0, ny, oy, aHeld, bHeld);
        }
      }
    }
  }

  // ---- static walls: the keep-out zones, then the field's own edges ----
  for (let i = 0; i < n; i++) {
    if (i === held) continue;
    const b = bodies[i];
    // The leash, resolved as a circular wall, and resolved FIRST: reflect the
    // RADIAL component of the velocity and leave the tangential component
    // alone, so a node reaching the edge of its territory turns along it rather
    // than bouncing straight back the way it came.
    //
    // Order is load-bearing. The leash is a soft preference and the zones and
    // the field's edges are hard guarantees, so the hard walls must run after
    // it and get the last word. With the leash last it dragged nodes back
    // toward home and straight out of the field — measured 2 nodes outside the
    // bounds on every frame of a 120s run.
    //
    // The positional pull is far weaker than any other push (LEASH_PULL vs
    // MAX_PUSH) for the same reason: it acts after the collision pass, so a
    // strong pull would shove a node back into a neighbour it was just
    // separated from. Measured at full strength that tripled the ring overlaps.
    // It does not need to be strong — the velocity reflection is what actually
    // contains the node, and the pull only has to clean up the overshoot.
    const lx = b.x - b.hx;
    const ly = b.y - b.hy;
    const ld = Math.hypot(lx, ly);
    if (ld > b.leash && ld > 1e-4) {
      const nx = lx / ld;
      const ny = ly / ld;
      const pull = Math.min(LEASH_PULL, ld - b.leash);
      b.x -= nx * pull;
      b.y -= ny * pull;
      const vn = b.vx * nx + b.vy * ny;
      if (vn > 0) {
        b.vx -= 2 * vn * nx;
        b.vy -= 2 * vn * ny;
      }
    }

    for (const z of zones) resolveRect(b, z, b.wallR);

    if (b.x < b.insetX) {
      b.x = b.insetX;
      if (b.vx < 0) b.vx = -b.vx;
    } else if (b.x > w - b.insetX) {
      b.x = w - b.insetX;
      if (b.vx > 0) b.vx = -b.vx;
    }
    if (b.y < b.insetY) {
      b.y = b.insetY;
      if (b.vy < 0) b.vy = -b.vy;
    } else if (b.y > h - b.insetY) {
      b.y = h - b.insetY;
      if (b.vy > 0) b.vy = -b.vy;
    }
  }

  // ---- pin the speed ----
  // Without this the field slowly heats or cools and stops looking like itself.
  for (let i = 0; i < n; i++) {
    if (i === held) continue;
    const b = bodies[i];
    const m = Math.hypot(b.vx, b.vy);
    if (m > 1e-4) {
      const k = b.speed / m;
      b.vx *= k;
      b.vy *= k;
    } else {
      b.vx = b.speed;
    }
  }
}

/**
 * Equal-mass elastic response plus a positional push. `n` is the unit normal
 * from `a` to `b`; `overlap` is how far they interpenetrate along it.
 *
 * Equal mass means the two swap their normal velocity components — which is
 * also why a big node deflects exactly as much as a small one. Applied ONLY
 * when the pair is closing: resolving a pair that is already separating is what
 * makes two touching nodes buzz.
 */
function separate(
  a: Body,
  b: Body,
  nx: number,
  ny: number,
  overlap: number,
  aHeld: boolean,
  bHeld: boolean
) {
  const push = Math.min(MAX_PUSH, Math.max(0, overlap - SLOP) * CORRECTION);
  if (push > 0) {
    if (aHeld) {
      b.x += nx * push;
      b.y += ny * push;
    } else if (bHeld) {
      a.x -= nx * push;
      a.y -= ny * push;
    } else {
      a.x -= nx * push * 0.5;
      a.y -= ny * push * 0.5;
      b.x += nx * push * 0.5;
      b.y += ny * push * 0.5;
    }
  }

  const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rvn >= 0) return; // already separating

  if (aHeld) {
    b.vx -= 2 * rvn * nx;
    b.vy -= 2 * rvn * ny;
  } else if (bHeld) {
    a.vx += 2 * rvn * nx;
    a.vy += 2 * rvn * ny;
  } else {
    a.vx += rvn * nx;
    a.vy += rvn * ny;
    b.vx -= rvn * nx;
    b.vy -= rvn * ny;
  }
}
