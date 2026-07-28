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

// ── 03 Bike Heat Exposure Research — thermal profile along the trail network ─
// A loose dendritic network: three trunks pushing in from the edges, bending
// toward the middle so the mesh thickens there, with branches spawning off
// them. Not a grid, not a radial burst. Every stretch carries its own seeded
// thermal value, and that value is expressed ONLY in stroke weight and opacity
// — 0.5px/0.30 at the cool end up to 0.9px/0.85 at the hot end. No colour, no
// heat-map palette, no gradient, no fill.
function heatTrails() {
  const rand = seeded(5133);
  const cx = 198;
  const cy = 116;
  const out: { d: string; w: number; o: number }[] = [];
  // Normalised to [-PI, PI]: without this a steering correction can take the
  // long way round and the trail spirals into a loop instead of branching.
  const norm = (a: number) => {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  };
  // [x, y, angle, depth, heat]
  const queue: [number, number, number, number, number][] = [
    [16, 226, -0.62, 0, 0.24],
    [188, 254, -1.4, 0, 0.46],
    [386, 196, -2.72, 0, 0.3],
  ];
  let guard = 0;
  while (queue.length && out.length < 44 && guard++ < 160) {
    const [sx, sy, sang, depth, sheat] = queue.shift()!;
    let x = sx;
    let y = sy;
    let ang = sang;
    let heat = sheat;
    let d = `M${n1(x)},${n1(y)}`;
    let held = 0;
    const steps = depth === 0 ? 9 : 4 - depth;
    for (let s = 0; s < steps; s++) {
      // Trunks lean toward the middle until they arrive; branches never steer,
      // so they radiate off their parent and the network reads as dendritic.
      const dist = Math.hypot(cx - x, cy - y);
      if (depth === 0 && dist > 64) ang += norm(Math.atan2(cy - y, cx - x) - ang) * 0.3;
      ang += (rand() - 0.5) * 0.45;
      const len = 17 + rand() * 19;
      const mx = x + Math.cos(ang - 0.3) * len * 0.55;
      const my = y + Math.sin(ang - 0.3) * len * 0.55;
      x += Math.cos(ang) * len;
      y += Math.sin(ang) * len;
      d += ` Q${n1(mx)},${n1(my)} ${n1(x)},${n1(y)}`;
      held++;
      // Heat drifts, and runs hotter over the built-up middle.
      heat = Math.max(0, Math.min(1,
        heat + (rand() - 0.5) * 0.26 + (1 - Math.min(1, dist / 190)) * 0.09));
      if (held === 2 || s === steps - 1) {
        out.push({ d, w: +(0.5 + heat * 0.4).toFixed(2), o: +(0.3 + heat * 0.55).toFixed(2) });
        d = `M${n1(x)},${n1(y)}`;
        held = 0;
      }
      // Splits are likelier near the middle, which is what thickens the mesh
      // there rather than any change of scale.
      if (depth < 2 && rand() < 0.26 + (1 - Math.min(1, dist / 190)) * 0.34) {
        queue.push([x, y, ang + (rand() < 0.5 ? 1 : -1) * (0.55 + rand() * 0.6), depth + 1, heat]);
      }
      if (x < 6 || x > FIG_W - 6 || y < 6 || y > FIG_H - 26) break;
    }
  }
  return out;
}

// The only legend: a short muted rule with the LST range's endpoints. No box,
// no swatches — the weights in the network are the scale.
const SCALE_BAR = { x1: 286, x2: 382, y: 226, lo: "32°C", hi: "79°C" };

// Computed once at module scope — pure, seeded, so server and client agree.
const CONVERGENCE = convergence();
const ARCS = arcDiagram();
const HEAT_TRAILS = heatTrails();

const HAIR = {
  fill: "none" as const,
  stroke: "#1A1815",
  strokeWidth: 0.5,
  vectorEffect: "non-scaling-stroke" as const,
};

export type FigureKind = "convergence" | "arcs" | "heat";

// Seeded per-path draw delays (0–160ms), so a figure's paths start at staggered
// but DETERMINISTIC moments rather than sweeping in index order. Same seed every
// call, so the choreography is identical on every load.
export function figureDelays(n: number) {
  const rand = seeded(4801);
  return Array.from({ length: n }, () => Math.round(rand() * 160));
}

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

      {kind === "heat" && (
        <>
          {HEAT_TRAILS.map((t, i) => (
            <path
              key={i}
              d={t.d}
              fill="none"
              stroke="#1A1815"
              strokeWidth={t.w}
              strokeOpacity={t.o}
              vectorEffect="non-scaling-stroke"
              data-fig-path
            />
          ))}
          <g data-fig-legend>
            <line
              x1={SCALE_BAR.x1}
              y1={SCALE_BAR.y}
              x2={SCALE_BAR.x2}
              y2={SCALE_BAR.y}
              stroke="#9B9382"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={SCALE_BAR.x1}
              y={SCALE_BAR.y + 14}
              fontFamily="var(--font-plex-mono)"
              fontSize={11}
              letterSpacing={11 * 0.16}
              fill="#6B6455"
            >
              {SCALE_BAR.lo}
            </text>
            <text
              x={SCALE_BAR.x2}
              y={SCALE_BAR.y + 14}
              textAnchor="end"
              fontFamily="var(--font-plex-mono)"
              fontSize={11}
              letterSpacing={11 * 0.16}
              fill="#6B6455"
            >
              {SCALE_BAR.hi}
            </text>
          </g>
        </>
      )}

    </svg>
  );
}
