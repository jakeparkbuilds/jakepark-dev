import Image from "next/image";
import DraftingGround from "../../components/drafting-ground";
import {
  ARC_INSET,
  TICK_COUNT,
  TICK_HOVER,
  TICK_REACH,
  TIER_R,
  TIER_SWEEP,
} from "../../lib/skills";

// SCRATCH ROUTE — not part of the site. It exists so the drafting ground can be
// judged in isolation and, more importantly, judged UNDER THE FURNITURE it will
// actually have to carry: the register was composed against paper, and a dark
// screenshot on a cooler ground is a different picture.
//
// Nothing here is imported by app/page.tsx. Delete the directory to remove it.

// The real dial geometry, rebuilt from app/lib/skills.ts's own constants rather
// than eyeballed — the point of putting a node on this page is that it is the
// node, at its real size, in its real stroke.
function dial(r: number, tier: "primary") {
  const box = r + TICK_REACH;
  const c = box;
  const n = (v: number) => Math.round(v * 1000) / 1000;
  const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const a = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const len = i === 0 ? TICK_REACH : TICK_HOVER;
    return {
      x1: n(c + cos * r),
      y1: n(c + sin * r),
      x2: n(c + cos * (r + len)),
      y2: n(c + sin * (r + len)),
    };
  });
  const R = r - ARC_INSET;
  const deg = TIER_SWEEP[tier];
  const rad = (deg * Math.PI) / 180;
  const arc = `M${c},${c - R} A${R},${R} 0 ${deg > 180 ? 1 : 0} 1 ${n(
    c + R * Math.sin(rad),
  )},${n(c - R * Math.cos(rad))}`;
  return { box, c, ticks, arc };
}

const R = TIER_R.primary;
const D = dial(R, "primary");

function Dial({ name, gold }: { name: string; gold?: boolean }) {
  const stroke = gold ? "#C8952E" : "#1A1815";
  return (
    <span
      style={{ width: D.box * 2, height: D.box * 2, display: "inline-block", position: "relative" }}
    >
      <svg viewBox={`0 0 ${D.box * 2} ${D.box * 2}`} focusable="false" aria-hidden="true">
        <circle
          cx={D.c}
          cy={D.c}
          r={R - 0.5}
          fill="none"
          stroke={stroke}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
        <g>
          {D.ticks.map((t, k) => (
            <line
              key={k}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke={stroke}
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        <path
          d={D.arc}
          fill="none"
          stroke={stroke}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="font-mono"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 15,
          color: gold ? "#1A1815" : "#6B6455",
        }}
      >
        {name}
      </span>
    </span>
  );
}

function Furniture() {
  return (
    <div className="flex flex-col gap-10">
      <div aria-hidden="true" className="h-[0.5px] w-full bg-ink" />

      <p className="font-mono text-mono-label uppercase text-label">
        mono label · #6B6455 · must be readable
      </p>
      <p className="font-mono text-mono-micro uppercase text-muted">
        mono micro · #9B9382 · decorative only
      </p>
      <p className="font-display text-h2 text-ink">display line, ink #1A1815</p>
      <p className="max-w-col font-display text-body text-body">
        Body copy in #2E2A24 — the softened ink. This is the value every
        paragraph a reader must read is set in, so it is the one that decides
        whether the cooler ground costs anything in legibility.
      </p>
      <p className="font-display text-body text-body">
        an{" "}
        <a
          href="#"
          className="text-accent underline decoration-accent decoration-[1px] underline-offset-4"
        >
          accent link with its underline
        </a>{" "}
        in #22384F.
      </p>

      <div aria-hidden="true" className="h-[0.5px] w-full bg-muted" />

      <div className="flex items-center gap-16">
        <Dial name="python" />
        <Dial name="pytorch" gold />
      </div>

      {/* The real thumbnail, in the real frame, at the real Phase 2 rendered
          width. capitolcast is the darkest of the three — the worst case for
          "does a dark rectangle read as a hole punched in the page". */}
      <figure className="proj-figure" style={{ width: 560, maxWidth: "100%" }}>
        <a className="proj-thumb" href="#" aria-label="capitolcast thumbnail sample">
          <span className="proj-thumb-box" style={{ aspectRatio: "2400 / 1363" }}>
            <Image
              className="proj-thumb-img"
              src="/capitolcast.png"
              alt=""
              width={2400}
              height={1363}
              quality={72}
              sizes="560px"
            />
            {(["tl", "tr", "bl", "br"] as const).map((c) => (
              <span key={c} aria-hidden="true" className="proj-thumb-reg" data-c={c} />
            ))}
          </span>
        </a>
        <figcaption className="proj-thumb-caption">
          capitolcast · bill advancement forecast
        </figcaption>
      </figure>
    </div>
  );
}

function Panel({
  variant,
  title,
}: {
  variant: "cool" | "warm";
  title: string;
}) {
  return (
    <section className="has-drafting section-pad py-section-y" data-scratch={variant}>
      <DraftingGround variant={variant} />
      <p className="mb-10 font-mono text-mono-label uppercase text-label">{title}</p>
      <Furniture />
    </section>
  );
}

export default function ScratchDrafting() {
  return (
    <main>
      {/* paper above, so the paper → drafting boundary is on screen */}
      <section className="section-pad py-section-y" id="scratch-paper-top">
        <p className="font-mono text-mono-label uppercase text-label">
          paper — the ground above
        </p>
      </section>

      <Panel variant="warm" title="variant b — ruling #9B9382 · 0.45 / 0.85" />
      {/* Variant A sits last so the boundary that matters — the specified
          cool ruling terminating against #1A1815 — is the one on screen. */}
      <Panel variant="cool" title="variant a — ruling #C5CBD1 · 0.45 / 0.85" />

      {/* ink below, so the drafting → ink boundary is on screen. This is the
          one that matters: cool-gray ruling terminating against #1A1815. */}
      <section
        id="scratch-ink"
        className="section-pad py-section-y"
        style={{ background: "#1A1815" }}
      >
        <p className="font-mono text-mono-label uppercase" style={{ color: "#F5F1E8" }}>
          ink — the ground below
        </p>
      </section>

      <section className="section-pad py-section-y">
        <p className="font-mono text-mono-label uppercase text-label">paper again</p>
      </section>
    </main>
  );
}
