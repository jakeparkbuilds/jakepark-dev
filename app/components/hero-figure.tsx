// Hand-authored, deterministic outline of Washington, D.C. No GeoJSON, no
// mapping library, no procedural generation. The western corner of the
// surveyed 10-mile square was retroceded to Virginia in 1846, so the
// diamond's west point is replaced with the Potomac's irregular boundary
// rather than a straight edge.

const DC_OUTLINE =
  "M200,40 L360,200 L200,360 L152,332 L168,298 L130,266 L158,230 L118,196 L148,162 L112,130 L140,96 L165,68 Z";

const GEORGETOWN = { x: 178, y: 132 };

export default function HeroFigure() {
  return (
    <figure className="flex w-full flex-col items-center gap-3">
      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label="Outline of Washington, D.C., with Georgetown marked in the northwest"
        className="w-[60%] min-w-[160px]"
      >
        <path
          d={DC_OUTLINE}
          fill="none"
          stroke="#1A1815"
          strokeOpacity={0.55}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
        <g
          stroke="#22384F"
          strokeWidth={1}
          strokeLinecap="square"
          vectorEffect="non-scaling-stroke"
        >
          <line
            x1={GEORGETOWN.x}
            y1={GEORGETOWN.y - 10}
            x2={GEORGETOWN.x}
            y2={GEORGETOWN.y + 10}
          />
          <line
            x1={GEORGETOWN.x - 10}
            y1={GEORGETOWN.y}
            x2={GEORGETOWN.x + 10}
            y2={GEORGETOWN.y}
          />
        </g>
        <text
          x={GEORGETOWN.x + 16}
          y={GEORGETOWN.y + 3}
          fontFamily="var(--font-plex-mono)"
          fontSize={10}
          letterSpacing="1.6"
          fill="#9B9382"
          style={{ textTransform: "uppercase" }}
        >
          georgetown
        </text>
      </svg>
      <figcaption className="font-mono text-mono-label-sm uppercase text-label sm:text-mono-label">
        fig. 01 — district of columbia · 38.9076°n 77.0723°w
      </figcaption>
    </figure>
  );
}
