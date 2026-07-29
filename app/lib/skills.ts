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
// The dial's furthest ink past the ring: the 12 circumference ticks reach 8px
// on hover, and a primary's index mark at 12 o'clock reaches 9px. Bounds and
// keep-out are computed against r + this, never against r alone.
export const TICK_REACH = 9;
export const TICK_REST = 5;
export const TICK_HOVER = 8;
export const TICK_COUNT = 12;
/** The inner arc's sweep in degrees — the value the dial carries. */
export const TIER_SWEEP: Record<Tier, number> = { primary: 270, secondary: 180, tertiary: 90 };
export const ARC_INSET = 7;
/** Max depth scale (z maps to 0.88-1.12). Keep-out must budget for the largest. */
export const SCALE_MAX = 1.12;
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
// Reference at the TIGHTEST real field (612x540, the 900px case). Keep-out
// zones are fixed-size boxes anchored to the field's corners, so a node that
// clears them here clears them at every larger field: the zones stay the same
// absolute size while a node's fractional position carries it further from the
// corner. Enforcing once, at the worst case, is what lets the clamp be a
// generation-time step rather than a runtime collision test.
const NOMINAL_W = 612;
const NOMINAL_H = 540;

// The four axis labels. 13px mono at 0.24em tracking: advance 0.6em + tracking.
const LABEL_PX = 13;
const LABEL_TRACK = 0.24;
const LABEL_LEADER = 64;
const LABEL_MARK = 16;
const KEEPOUT_PAD = 24;
const labelWidth = (text: string) =>
  text.length * (ADVANCE + LABEL_TRACK) * LABEL_PX;

export type Rect = { x0: number; y0: number; x1: number; y1: number };

/** Each label, its corner mark and its leader, padded. Nothing may enter these. */
export function keepOutZones(w: number, h: number): Rect[] {
  return CLUSTERS.map((c) => {
    const tw = labelWidth(c.label) + LABEL_LEADER + LABEL_MARK;
    const th = LABEL_PX + LABEL_MARK;
    const left = c.cx < 0.5;
    const top = c.cy < 0.5;
    const x0 = left ? 0 : w - tw;
    const y0 = top ? 0 : h - th;
    return {
      x0: x0 - KEEPOUT_PAD,
      y0: y0 - KEEPOUT_PAD,
      x1: x0 + tw + KEEPOUT_PAD,
      y1: y0 + th + KEEPOUT_PAD,
    };
  });
}

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
      // Travel, drawn HERE so the relaxation below can budget for it. Raised
      // from 20-45px: at the old figure the field read as static rather than
      // drifting. The clamps in passes 2c/2d will cut an individual node's
      // travel back wherever the extra range would put it into a label or a
      // keep-out zone, so this is a request, not a guarantee.
      const ax = 28 + rand() * 30;
      const ay = 28 + rand() * 30;
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

  // Pass 2a: spread the cloud to fill the nominal field, in PIXELS and BEFORE
  // the zone work. This used to run last, in fraction space, which quietly
  // undid the clamp — it pulled the extreme nodes back toward the corners and
  // straight into the labels. Order matters here: fit, then clear the zones.
  const fit = (
    get: (p: (typeof pts)[number]) => number,
    set: (p: (typeof pts)[number], v: number) => void,
    extent: number
  ) => {
    const reach = (q: (typeof pts)[number]) => (q.r + TICK_REACH) * SCALE_MAX;
    const lo = Math.min(...pts.map((q) => get(q) - reach(q)));
    const hi = Math.max(...pts.map((q) => get(q) + reach(q)));
    if (hi - lo < 1) return;
    const k = (extent - 16) / (hi - lo);
    for (const q of pts) set(q, 8 + (get(q) - lo) * k);
  };
  fit((q) => q.x, (q, v) => (q.x = v), NOMINAL_W);
  fit((q) => q.y, (q, v) => (q.y = v), NOMINAL_H);

  const ZONES = keepOutZones(NOMINAL_W, NOMINAL_H);

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
    // Zones are solved in the SAME loop, not after it. Pushing nodes out of the
    // labels as a separate later pass moved them back into each other — at
    // 900px it closed the tightest label gap to 2.4px, which the drift would
    // then have shut completely. Both constraints have to converge together.
    for (const p of pts) {
      const reach = (p.r + TICK_REACH) * SCALE_MAX;
      for (const z of ZONES) {
        const zx = (z.x0 + z.x1) / 2;
        const zy = (z.y0 + z.y1) / 2;
        const ox = (z.x1 - z.x0) / 2 + reach - Math.abs(p.x - zx);
        const oy = (z.y1 - z.y0) / 2 + reach - Math.abs(p.y - zy);
        if (ox <= 0 || oy <= 0) continue;
        // Escape along the shallower axis — the shorter way out.
        if (ox < oy) p.x += (p.x < zx ? -ox : ox) * 0.5;
        else p.y += (p.y < zy ? -oy : oy) * 0.5;
      }
    }
  }



  // Pass 2c: clamp the seeded amplitudes so no node's DRIFT can enter a zone
  // either. Reducing travel, not adding a runtime test — the field never checks
  // a boundary while it is running.
  for (const p of pts) {
    const reach = (p.r + TICK_REACH) * SCALE_MAX;
    for (const z of ZONES) {
      const gapX = Math.max(z.x0 - p.x, p.x - z.x1);
      const gapY = Math.max(z.y0 - p.y, p.y - z.y1);
      if (gapX >= gapY) p.ax = Math.min(p.ax, Math.max(0, gapX - reach));
      else p.ay = Math.min(p.ay, Math.max(0, gapY - reach));
    }
    p.amp = Math.max(p.ax, p.ay);
  }

  // Pass 2d: a final amplitude clamp against LABEL pairs. The relaxation's
  // centre-distance constraint is a margin, not a guarantee — two names can
  // still meet if both nodes drift toward each other, measured at up to 11px.
  // This makes it a guarantee: for every pair, separate on whichever axis is
  // cheaper and shrink only the travel needed to hold it. Boxes overlap only
  // when they overlap on BOTH axes, so securing one axis is enough.
  // Scaled: a label is rendered inside its node, so at high z it is 1.12x wider
  // and taller than its laid-out size. Budgeting for the unscaled box left a
  // measured 11px overlap at 900px — the same omission the keep-out clamp had.
  const LABEL_H = 18 * SCALE_MAX; // a mono label's line box, with headroom
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i];
      const b = pts[j];
      const dx = Math.abs(a.x - b.x);
      const dy = Math.abs(a.y - b.y);
      const needX = (a.half + b.half) * SCALE_MAX;
      // Slack once both have travelled toward each other.
      const slackX = dx - needX - (a.ax + b.ax);
      const slackY = dy - LABEL_H - (a.ay + b.ay);
      if (slackX >= 0 || slackY >= 0) continue;
      // Cheaper axis = the one needing less travel taken away.
      if (dx - needX >= dy - LABEL_H) {
        const budget = Math.max(0, dx - needX);
        const k = budget / (a.ax + b.ax || 1);
        a.ax *= k;
        b.ax *= k;
      } else {
        const budget = Math.max(0, dy - LABEL_H);
        const k = budget / (a.ay + b.ay || 1);
        a.ay *= k;
        b.ay *= k;
      }
    }
  }

  // Pass 2e: make the fraction conversion LOSSLESS. bx/by are fractions of the
  // usable span, which is inset by radius + tick reach + amplitude; a node the
  // earlier passes pushed outside that span used to be clamped back into range
  // at conversion time, silently undoing the very separation that had just been
  // computed. (Measured: terraform landed at exactly its own inset, bx = 0, with
  // its amplitude untouched — and its label then met typescript's.) Instead of
  // moving the node, shrink its travel until the span reaches it. Amplitudes
  // only ever get smaller here, so every guarantee above still holds.
  for (const p of pts) {
    const base = p.r + TICK_REACH;
    p.x = Math.min(NOMINAL_W - base, Math.max(base, p.x));
    p.y = Math.min(NOMINAL_H - base, Math.max(base, p.y));
    p.ax = Math.max(0, Math.min(p.ax, p.x - base, NOMINAL_W - p.x - base));
    p.ay = Math.max(0, Math.min(p.ay, p.y - base, NOMINAL_H - p.y - base));
  }

  // NOTE: there is deliberately no fraction-space stretch after this point.
  // The spread happens in pass 2a, in pixels, before the zones are cleared —
  // rescaling fractions afterwards would drag the extreme nodes back into the
  // labels, which is exactly the bug the keep-out overlay caught.

  const out: NodeSeed[] = [];
  for (const p of pts) {
    const { tool, r, ax, ay } = p;
    {
      // Store as a fraction of the usable area — inset by radius AND amplitude,
      // exactly the span the runtime calc resolves against — so base + drift
      // stays inside the field at any size.
      const ix = r + TICK_REACH + ax;
      const iy = r + TICK_REACH + ay;
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
        // Periods, halved from 18-34s (and the depth cycle from 24-40s): the
        // field is a standing state, but at the old periods it read as a still
        // image rather than a slow one. Speed here is period and amplitude
        // only — the hover and select transitions are deliberately untouched.
        px1: 9000 + rand() * 8000,
        px2: 9000 + rand() * 8000,
        py1: 9000 + rand() * 8000,
        py2: 9000 + rand() * 8000,
        pz: 13000 + rand() * 8000,
        ox1: rand() * Math.PI * 2,
        ox2: rand() * Math.PI * 2,
        oy1: rand() * Math.PI * 2,
        oy2: rand() * Math.PI * 2,
        oz: rand() * Math.PI * 2,
      });
    }
  }

  // Back into tier-then-cluster order for the DOM.
  const order = new Map(TOOLS.map((t, i) => [t.name, i]));
  return out.sort((a, b) => order.get(a.tool.name)! - order.get(b.tool.name)!);
}

export const NODE_SEEDS = buildSeeds();

// Plate annotations: 01..17, assigned by tier then alphabetically — a stable
// index into the field, not the visual or the tab order.
const TIER_ORDER: Tier[] = ["primary", "secondary", "tertiary"];
export const NODE_INDEX = new Map<string, string>(
  [...TOOLS]
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) ||
        a.name.localeCompare(b.name)
    )
    .map((t, i) => [t.name, String(i + 1).padStart(2, "0")])
);

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
