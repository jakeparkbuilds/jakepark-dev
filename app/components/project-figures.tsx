// § 04 projects — the three figures. Each is drawn from real path math with a
// FIXED integer seed, so the geometry is identical on the server and the client
// (no hydration mismatch) and identical on every load. Nothing here reads
// Math.random, Date, or window at render time.
//
// House rules for all three: 0.5px ink hairlines, vector-effect
// non-scaling-stroke, no fill, no axes, no gridlines, no ticks, no legend. The
// figures are decorative — the claim text carries the meaning — so each <svg>
// is aria-hidden and the caption sits outside it as real type.
// `mark` #C8952E never appears here; it is the hero star's alone.

export const FIG_W = 400;
export const FIG_H = 260;

// mulberry32 — small, fast, and fully determined by its seed.
function seeded(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n1 = (v: number) => Math.round(v * 10) / 10;
const poly = (pts: [number, number][]) =>
  pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${n1(x)},${n1(y)}`).join(" ");

// ── 01 My 5 — convergence ────────────────────────────────────────────────────
// A noisy series settling toward a stable value, bracketed by two converging
// bands. The line STOPS at 68% of the width under a 14px tick; the empty paper
// to its right is the claim — the simulation knew when to stop.
const STOP_FRACTION = 0.68;
function convergence() {
  const rand = seeded(1701);
  const x0 = 10;
  const x1 = FIG_W * STOP_FRACTION;
  const mid = 132;
  const n = 96;
  const line: [number, number][] = [];
  const hi: [number, number][] = [];
  const lo: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = x0 + (x1 - x0) * t;
    const decay = Math.exp(-3.1 * t);
    line.push([x, mid + (rand() - 0.5) * 150 * decay]);
    const band = 96 * decay + 2.5;
    hi.push([x, mid - band]);
    lo.push([x, mid + band]);
  }
  const endY = line[line.length - 1][1];
  return {
    line: poly(line),
    hi: poly(hi),
    lo: poly(lo),
    tick: `M${n1(x1)},${n1(endY - 7)} L${n1(x1)},${n1(endY + 7)}`,
  };
}

// ── 02 CapitolCast — arc diagram ─────────────────────────────────────────────
// Unevenly spaced nodes on a baseline, joined by semicircular arcs above it.
// Density rises toward the centre, the way cosponsorship does around the
// chamber's brokers. Nothing is drawn below the baseline.
function arcDiagram() {
  const rand = seeded(9042);
  const baseline = 236;
  const x0 = 10;
  const x1 = FIG_W - 10;
  const N = 36;
  const nodes: number[] = [];
  for (let i = 0; i < N; i++) {
    const t = (i + 0.5) / N;
    // A mild pull toward the centre plus jitter: spacing is uneven and denser
    // mid-chamber, but the nodes still span the full baseline.
    const s = t + (0.5 - t) * 0.22 + (rand() - 0.5) * 0.028;
    nodes.push(x0 + (x1 - x0) * s);
  }
  nodes.sort((a, b) => a - b);
  // Centre-biased midpoint, and a span biased short so the field is dense near
  // the baseline while a few long arcs still reach up the frame.
  const arcs: { d: string; hub: boolean }[] = [];
  const hubAt = new Set([2, 11, 19, 28, 37, 46]); // exactly six read at full weight
  for (let i = 0; i < 55; i++) {
    const centre = (rand() + rand()) / 2; // triangular, centred
    const span = 1 + Math.floor(Math.pow(rand(), 1.55) * (N - 2));
    let a = Math.round(centre * (N - 1) - span / 2);
    a = Math.max(0, Math.min(N - 1 - span, a));
    const b = a + span;
    const ax = nodes[a];
    const bx = nodes[b];
    const r = (bx - ax) / 2;
    if (r < 5) continue;
    arcs.push({
      d: `M${n1(ax)},${baseline} A${n1(r)},${n1(r)} 0 0 1 ${n1(bx)},${baseline}`,
      hub: hubAt.has(i),
    });
  }
  return { baseline, nodes: nodes.map(n1), arcs, x0, x1 };
}

// ── 03 Wildfire Evacuation Model — trajectories ──────────────────────────────
// Paths fanning from one origin with organic curvature (quadratic segments,
// seeded jitter — never straight rays). Most clear the frame; a tenth stop
// short, each marked by a dot. Overlap builds the density.
function trajectories() {
  const rand = seeded(3312);
  const cx = 196;
  const cy = 128;
  const out: { d: string; stalled: [number, number] | null }[] = [];
  for (let i = 0; i < 40; i++) {
    let ang = (i / 40) * Math.PI * 2 + (rand() - 0.5) * 0.14;
    const stalls = rand() < 0.1;
    const limit = stalls ? 34 + rand() * 46 : 400;
    let x = cx;
    let y = cy;
    let d = `M${n1(x)},${n1(y)}`;
    let travelled = 0;
    let stalledAt: [number, number] | null = null;
    for (let step = 0; step < 7; step++) {
      const len = 26 + rand() * 20;
      ang += (rand() - 0.5) * 0.62; // organic drift, not a straight ray
      const mx = x + Math.cos(ang) * len * 0.5;
      const my = y + Math.sin(ang) * len * 0.5;
      const nx = x + Math.cos(ang) * len;
      const ny = y + Math.sin(ang) * len;
      travelled += len;
      d += ` Q${n1(mx)},${n1(my)} ${n1(nx)},${n1(ny)}`;
      x = nx;
      y = ny;
      if (travelled >= limit) {
        if (stalls) stalledAt = [n1(x), n1(y)];
        break;
      }
      if (x < -20 || x > FIG_W + 20 || y < -20 || y > FIG_H + 20) break;
    }
    out.push({ d, stalled: stalledAt });
  }
  return { cx, cy, paths: out };
}

// Computed once at module scope — pure, seeded, so server and client agree.
const CONVERGENCE = convergence();
const ARCS = arcDiagram();
const TRAJECTORIES = trajectories();

const HAIR = {
  fill: "none" as const,
  stroke: "#1A1815",
  strokeWidth: 0.5,
  vectorEffect: "non-scaling-stroke" as const,
};

export type FigureKind = "convergence" | "arcs" | "trajectories";

// `data-fig-path` marks every stroked path the draw animation walks. The
// figure renders complete without JS; motion only replays it.
export default function ProjectFigure({ kind }: { kind: FigureKind }) {
  return (
    <svg
      viewBox={`0 0 ${FIG_W} ${FIG_H}`}
      className="proj-fig-svg"
      aria-hidden="true"
      focusable="false"
    >
      {kind === "convergence" && (
        <>
          <path d={CONVERGENCE.hi} {...HAIR} stroke="#9B9382" data-fig-path />
          <path d={CONVERGENCE.lo} {...HAIR} stroke="#9B9382" data-fig-path />
          <path d={CONVERGENCE.line} {...HAIR} data-fig-path />
          <path d={CONVERGENCE.tick} {...HAIR} data-fig-path />
        </>
      )}

      {kind === "arcs" && (
        <>
          <path
            d={`M${ARCS.x0},${ARCS.baseline} L${ARCS.x1},${ARCS.baseline}`}
            {...HAIR}
            data-fig-path
          />
          {ARCS.arcs.map((a, i) => (
            <path
              key={i}
              d={a.d}
              {...HAIR}
              strokeOpacity={a.hub ? 1 : 0.35}
              data-fig-path
            />
          ))}
          {ARCS.nodes.map((x, i) => (
            <circle key={i} cx={x} cy={ARCS.baseline} r={0.75} fill="#1A1815" />
          ))}
        </>
      )}

      {kind === "trajectories" && (
        <>
          {TRAJECTORIES.paths.map((p, i) => (
            <path key={i} d={p.d} {...HAIR} strokeOpacity={0.45} data-fig-path />
          ))}
          {TRAJECTORIES.paths.map((p, i) =>
            p.stalled ? (
              <circle key={`s${i}`} cx={p.stalled[0]} cy={p.stalled[1]} r={1} fill="#1A1815" />
            ) : null
          )}
          <circle cx={TRAJECTORIES.cx} cy={TRAJECTORIES.cy} r={1.5} fill="#1A1815" />
        </>
      )}
    </svg>
  );
}
