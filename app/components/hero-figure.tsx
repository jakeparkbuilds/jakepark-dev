import { DC_NEIGHBORHOODS, DC_OUTLINE } from "./dc-paths";

// The long, clean southeast boundary segment of DC_OUTLINE — south point
// to east point, the straight 1791 survey line untouched by the 1846
// retrocession. Endpoints read directly off the generated path above.
const SE_BOUNDARY_START = { x: 164.1, y: 392 };
const SE_BOUNDARY_END = { x: 354.1, y: 201.6 };

const CAPTION_TEXT = "district of columbia · 46 neighborhood clusters";
// IBM Plex Mono's real per-glyph advance width, read directly off the
// shipped font file (fonttools hmtx table: 600/1000 units for every
// character in this string, including the space and the middle dot —
// confirms it's truly monospace, not an assumption).
const MONO_CHAR_WIDTH_EM = 0.6;
const CAPTION_TRACKING_EM = 0.16; // mono-micro tracking, per CLAUDE.md
const CAPTION_CLEARANCE = 14; // target clear space between the boundary and the glyphs

function computeCaptionPlacement() {
  const dx = SE_BOUNDARY_END.x - SE_BOUNDARY_START.x;
  const dy = SE_BOUNDARY_END.y - SE_BOUNDARY_START.y;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const edgeLength = Math.hypot(dx, dy);

  // Solve font-size so the caption's rendered width matches the boundary
  // segment exactly: n glyphs at MONO_CHAR_WIDTH_EM each, plus (n-1)
  // inter-character tracking gaps at CAPTION_TRACKING_EM.
  const n = CAPTION_TEXT.length;
  const emsPerLine = n * MONO_CHAR_WIDTH_EM + (n - 1) * CAPTION_TRACKING_EM;
  const fontSize = edgeLength / emsPerLine;
  const tracking = fontSize * CAPTION_TRACKING_EM;
  // Uppercase mono glyphs have no descenders, so at this rotation angle
  // their ink bulges back toward the line from the baseline. Pushing the
  // baseline out by one extra ascent keeps the ink itself ~14 units clear.
  const ascent = fontSize * 0.72;

  const midX = (SE_BOUNDARY_START.x + SE_BOUNDARY_END.x) / 2;
  const midY = (SE_BOUNDARY_START.y + SE_BOUNDARY_END.y) / 2;

  // Outward normal: perpendicular to the segment, away from the shape's
  // interior (DC_OUTLINE's centroid sits up and to the left of this edge).
  const outX = -dy / edgeLength;
  const outY = dx / edgeLength;

  const offset = CAPTION_CLEARANCE + ascent;
  return { x: midX + outX * offset, y: midY + outY * offset, angle, fontSize, tracking };
}

const CAPTION_PLACEMENT = computeCaptionPlacement();

export default function HeroFigure() {
  return (
    <figure className="flex w-full flex-col items-center gap-3">
      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label="Map of Washington, D.C. showing its 46 neighborhood clusters within the district boundary"
        className="w-full min-w-[220px]"
      >
        {DC_NEIGHBORHOODS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#1A1815"
            strokeOpacity={0.18}
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          d={DC_OUTLINE}
          fill="none"
          stroke="#1A1815"
          strokeOpacity={0.6}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
        <text
          x={CAPTION_PLACEMENT.x}
          y={CAPTION_PLACEMENT.y}
          transform={`rotate(${CAPTION_PLACEMENT.angle} ${CAPTION_PLACEMENT.x} ${CAPTION_PLACEMENT.y})`}
          textAnchor="middle"
          fontFamily="var(--font-plex-mono)"
          fontSize={CAPTION_PLACEMENT.fontSize}
          letterSpacing={CAPTION_PLACEMENT.tracking}
          fill="#9B9382"
          className="hidden md:inline"
          style={{ textTransform: "uppercase" }}
        >
          {CAPTION_TEXT}
        </text>
      </svg>
      <figcaption className="font-mono text-mono-label-sm uppercase text-label sm:text-mono-label md:hidden">
        {CAPTION_TEXT}
      </figcaption>
    </figure>
  );
}
