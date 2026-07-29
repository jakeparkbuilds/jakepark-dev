// § 05 skills — the drifting field. All 17 tools and the whole field geometry.
//
// Every node is a labeled data object carrying content: a name, a domain, and
// one concrete thing Jake did with it. Nothing here is ambient and there is no
// background layer — that is the whole reason this section is exempt from
// CLAUDE.md § 8's ban on floating particles. The test in that rule is whether
// removing an element loses information; remove any node here and a tool and
// its evidence go with it.
//
// The arrangement is generated from a FIXED integer seed at module scope, so
// the server and the client agree byte for byte and the field looks identical
// on every load. Never Math.random() and never Date at render time.

export type Tier = "primary" | "secondary" | "tertiary";
export type ClusterId = "languages" | "ml" | "infra" | "interfaces";

export type Tool = {
  name: string;
  tier: Tier;
  cluster: ClusterId;
  /** One concrete thing Jake did with it. This is what makes the field content. */
  evidence: string;
};

export const CLUSTERS: { id: ClusterId; label: string; cx: number; cy: number }[] = [
  // Centres in [0,1] of the field's usable area. The four are pulled well in
  // from the corners so their spreads overlap heavily — this must read as one
  // field with structure, not as four separated groups.
  { id: "languages", label: "languages", cx: 0.26, cy: 0.27 },
  { id: "ml", label: "ml & data", cx: 0.74, cy: 0.25 },
  { id: "infra", label: "infrastructure", cx: 0.24, cy: 0.75 },
  { id: "interfaces", label: "interfaces", cx: 0.76, cy: 0.73 },
];

// Ordered by TIER first, then cluster — this is the DOM order, and therefore
// the tab order, which is deliberately not the visual arrangement.
export const TOOLS: Tool[] = [
  // primary — 4
  { name: "python", tier: "primary", cluster: "languages", evidence: "2m+ apc records spatially joined to census tracts" },
  { name: "pytorch", tier: "primary", cluster: "ml", evidence: "graphsage gnn benchmarked on a 5.8m-edge cosponsorship graph" },
  { name: "aws", tier: "primary", cluster: "infra", evidence: "serverless monte carlo simulator, 43× hot-path speedup" },
  { name: "next.js", tier: "primary", cluster: "interfaces", evidence: "live explainable bill forecasts across 16k bills" },
  // secondary — 6
  { name: "typescript", tier: "secondary", cluster: "languages", evidence: "full-stack demo interfaces for capitolcast and my 5" },
  { name: "scikit-learn", tier: "secondary", cluster: "ml", evidence: "ml pipeline forecasting bill advancement, 15× lift over baseline" },
  { name: "xgboost", tier: "secondary", cluster: "ml", evidence: "86% cross-validated r² on transit ridership forecasting" },
  { name: "docker", tier: "secondary", cluster: "infra", evidence: "containerized services for the multi-agency transit api" },
  { name: "terraform", tier: "secondary", cluster: "infra", evidence: "infrastructure-as-code for the my 5 serverless stack" },
  { name: "react", tier: "secondary", cluster: "interfaces", evidence: "component interfaces for capitolcast and my 5" },
  // tertiary — 7
  { name: "java", tier: "tertiary", cluster: "languages", evidence: "coursework — data structures and advanced programming" },
  { name: "c++", tier: "tertiary", cluster: "languages", evidence: "coursework — data structures and systems programming" },
  { name: "sql", tier: "tertiary", cluster: "languages", evidence: "multi-agency transit api with schema-level data isolation" },
  { name: "r", tier: "tertiary", cluster: "languages", evidence: "statistical modeling coursework" },
  { name: "pandas", tier: "tertiary", cluster: "ml", evidence: "anomaly detection pipeline across 2m+ vehicle records" },
  { name: "postgresql", tier: "tertiary", cluster: "infra", evidence: "relational store behind the transit api" },
  { name: "fastapi", tier: "tertiary", cluster: "interfaces", evidence: "serving live bill forecasts to the capitolcast frontend" },
];

export const TIER_R: Record<Tier, number> = { primary: 62, secondary: 44, tertiary: 32 };
export const TIER_SIZE: Record<Tier, number> = { primary: 15, secondary: 12, tertiary: 11 };
export const TIER_OPACITY: Record<Tier, number> = { primary: 1, secondary: 0.55, tertiary: 0.35 };

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

export type NodeSeed = {
  tool: Tool;
  r: number;
  fontSize: number;
  /** Base position as a fraction [0,1] of the field's usable area. */
  bx: number;
  by: number;
  /** Peak excursion in px. The two sine components are weighted 0.62/0.38, so
      the total never exceeds this — which is what keeps a node in bounds
      without any boundary test. */
  ax: number;
  ay: number;
  /** Periods in ms. Two per axis with different lengths, so the closed path is
      a Lissajous figure: never a straight line, never a circle, never a bounce. */
  px1: number; px2: number; py1: number; py2: number; pz: number;
  ox1: number; ox2: number; oy1: number; oy2: number; oz: number;
};

// IBM Plex Mono's advance is 0.6em at every weight. A name is shrunk only if it
// would otherwise touch its own circle; measured against the real rendered text
// after build, not trusted blind.
const ADVANCE = 0.6;
function fitSize(name: string, r: number, tierSize: number) {
  const avail = 2 * r - 10;
  const natural = name.length * ADVANCE * tierSize;
  if (natural <= avail) return tierSize;
  return Math.max(10, Math.floor((avail / (name.length * ADVANCE)) * 10) / 10);
}

// The arrangement is composed in a nominal field and then stored as fractions,
// so it responds without being re-derived. The nominal is deliberately NARROWER
// than the widest real field: node radii are fixed in px while the field's width
// is not, so a layout composed at 1021px (the 1920 field) compresses into label
// collisions at 473px (the 1024 field). Composing at the tight end and letting
// it spread is the direction that stays legible.
const NOMINAL_W = 720;
const NOMINAL_H = 600;

function buildSeeds(): NodeSeed[] {
  const rand = seeded(20260728);
  // Deal positions cluster by cluster so the arrangement is stable if a tool is
  // ever added to one cluster — the others keep their draws.
  const byCluster = new Map<ClusterId, Tool[]>();
  for (const c of CLUSTERS) byCluster.set(c.id, []);
  for (const t of TOOLS) byCluster.get(t.cluster)!.push(t);

  // Pass 1: a ring around each cluster centre, in nominal pixels. Amplitudes are
  // drawn HERE, not later, because the relaxation has to know how far each node
  // will travel before it can guarantee two labels never meet.
  const pts: {
    x: number; y: number; r: number; half: number; amp: number; ax: number; ay: number; tool: Tool;
  }[] = [];
  for (const c of CLUSTERS) {
    const members = byCluster.get(c.id)!;
    members.forEach((tool, i) => {
      const ang = (i / members.length) * Math.PI * 2 + rand() * 0.7;
      const rad = 70 + rand() * 78;
      const r = TIER_R[tool.tier];
      const ax = 20 + rand() * 25;
      const ay = 20 + rand() * 25;
      pts.push({
        x: c.cx * NOMINAL_W + Math.cos(ang) * rad * 1.15,
        y: c.cy * NOMINAL_H + Math.sin(ang) * rad,
        r,
        // Half the rendered label width — the thing that actually must not
        // collide. Circles crossing is desirable; two names on top of each
        // other is not.
        half: (fitSize(tool.name, r, TIER_SIZE[tool.tier]) * ADVANCE * tool.name.length) / 2,
        amp: Math.max(ax, ay),
        ax,
        ay,
        tool,
      });
    });
  }

  // Pass 2: a relaxation, run ONCE HERE at seed time — not at runtime. There is
  // no physics, no repulsion, no gravity and no collision test while the field
  // is running; this only decides where the fixed base positions are. Centres
  // are pushed to 0.78 of the summed radii, which still leaves the rings
  // crossing, or far enough apart that the two labels clear each other even
  // when both nodes drift toward each other — whichever is larger.
  //
  // The travel term is what makes this hold. Clearance at rest is not enough:
  // measured without it, two nodes seeded 38px apart drifted into an 11px label
  // overlap within 20 seconds. Rings are meant to cross; names are not.
  for (let pass = 0; pass < 140; pass++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i];
        const b = pts[j];
        const min = Math.max(
          (a.r + b.r) * 0.78,
          a.half + b.half + 12 + (a.amp + b.amp)
        );
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let d = Math.hypot(dx, dy);
        if (d > min) continue;
        if (d < 0.001) {
          dx = 1;
          dy = 0;
          d = 1;
        }
        const push = ((min - d) / d) * 0.5;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }
  }


  const out: NodeSeed[] = [];
  for (const p of pts) {
    const { tool, r, ax, ay } = p;
    {
      // Store as a fraction of the usable area — inset by radius AND amplitude,
      // exactly the span the runtime calc resolves against — so base + drift
      // stays inside the field at any size.
      const ix = r + ax;
      const iy = r + ay;
      const spanX = NOMINAL_W - 2 * ix;
      const spanY = NOMINAL_H - 2 * iy;
      out.push({
        tool,
        r,
        fontSize: fitSize(tool.name, r, TIER_SIZE[tool.tier]),
        bx: Math.min(1, Math.max(0, spanX > 0 ? (p.x - ix) / spanX : 0.5)),
        by: Math.min(1, Math.max(0, spanY > 0 ? (p.y - iy) / spanY : 0.5)),
        ax,
        ay,
        px1: 18000 + rand() * 16000,
        px2: 18000 + rand() * 16000,
        py1: 18000 + rand() * 16000,
        py2: 18000 + rand() * 16000,
        pz: 24000 + rand() * 16000,
        ox1: rand() * Math.PI * 2,
        ox2: rand() * Math.PI * 2,
        oy1: rand() * Math.PI * 2,
        oy2: rand() * Math.PI * 2,
        oz: rand() * Math.PI * 2,
      });
    }
  }
  // Pass 3: stretch the arrangement to fill the field. Each node's fraction is
  // already relative to its own usable span — inset by its own radius and
  // amplitude — so rescaling the fractions to [0,1] puts the extreme nodes
  // exactly at the edges they are allowed to reach, whatever their size.
  // Without this the cloud floats wherever the seeding left it and the field
  // carries a dead margin. Cluster structure is preserved: this is one linear
  // map applied to every node.
  const stretch = (key: "bx" | "by") => {
    const lo = Math.min(...out.map((s) => s[key]));
    const hi = Math.max(...out.map((s) => s[key]));
    if (hi - lo < 0.001) return;
    for (const s of out) s[key] = (s[key] - lo) / (hi - lo);
  };
  stretch("bx");
  stretch("by");

  // Back into tier-then-cluster order for the DOM.
  const order = new Map(TOOLS.map((t, i) => [t.name, i]));
  return out.sort((a, b) => order.get(a.tool.name)! - order.get(b.tool.name)!);
}

export const NODE_SEEDS = buildSeeds();

// The two sine components, weighted so |offset| <= amplitude for all t. Shared
// by the rAF loop and by the static (reduced-motion / SSR) first frame, so the
// resting arrangement is the same geometry evaluated at t = 0.
export function drift(s: NodeSeed, t: number) {
  const w = (p: number, o: number) => Math.sin((t / p) * Math.PI * 2 + o);
  return {
    dx: s.ax * (0.62 * w(s.px1, s.ox1) + 0.38 * w(s.px2, s.ox2)),
    dy: s.ay * (0.62 * w(s.py1, s.oy1) + 0.38 * w(s.py2, s.oy2)),
    // z in [0,1] on its own slower period — the fake depth. Mapped to scale
    // 0.88–1.12, to opacity ±0.12, and to z-index, all from this one value.
    z: 0.5 + 0.5 * w(s.pz, s.oz),
  };
}
