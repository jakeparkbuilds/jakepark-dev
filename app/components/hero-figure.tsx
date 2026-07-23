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
const TEXT_VIEWBOX_CLEARANCE = 12; // min. clear space between the glyph ink and the viewBox edge

const BASE_VIEWBOX = 400;

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
  const halfWidth = edgeLength / 2;

  const midX = (SE_BOUNDARY_START.x + SE_BOUNDARY_END.x) / 2;
  const midY = (SE_BOUNDARY_START.y + SE_BOUNDARY_END.y) / 2;

  // Outward normal: perpendicular to the segment, away from the shape's
  // interior (DC_OUTLINE's centroid sits up and to the left of this edge).
  const outX = -dy / edgeLength;
  const outY = dx / edgeLength;

  const offset = CAPTION_CLEARANCE + ascent;
  const x = midX + outX * offset;
  const y = midY + outY * offset;

  // Real bounding box of the rotated glyph ink, relative to the anchor
  // above: full rendered width (textAnchor="middle" centers it on x), ink
  // running from the baseline up to the cap-height ascent (this string is
  // all-caps with no descenders, so nothing extends below the baseline).
  // Rotating these four corners by the same angle as the <text> transform
  // gives the true on-screen extent — computed, not guessed.
  const theta = (angle * Math.PI) / 180;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const corners = [
    [-halfWidth, -ascent],
    [halfWidth, -ascent],
    [-halfWidth, 0],
    [halfWidth, 0],
  ].map(([localX, localY]) => ({
    x: x + localX * cos - localY * sin,
    y: y + localX * sin + localY * cos,
  }));

  return {
    x,
    y,
    angle,
    fontSize,
    tracking,
    textMinX: Math.min(...corners.map((c) => c.x)),
    textMaxX: Math.max(...corners.map((c) => c.x)),
    textMinY: Math.min(...corners.map((c) => c.y)),
    textMaxY: Math.max(...corners.map((c) => c.y)),
  };
}

const CAPTION_PLACEMENT = computeCaptionPlacement();

// Grow the viewBox (never shrink, never move the map or the text) so the
// caption's real rotated bounding box, computed above, sits fully inside
// with TEXT_VIEWBOX_CLEARANCE to spare. The DC geometry keeps its original
// 0–400 coordinates; this only widens the window it's viewed through.
const VIEWBOX_MIN_X = Math.min(0, CAPTION_PLACEMENT.textMinX - TEXT_VIEWBOX_CLEARANCE);
const VIEWBOX_MIN_Y = Math.min(0, CAPTION_PLACEMENT.textMinY - TEXT_VIEWBOX_CLEARANCE);
const VIEWBOX_MAX_X = Math.max(BASE_VIEWBOX, CAPTION_PLACEMENT.textMaxX + TEXT_VIEWBOX_CLEARANCE);
const VIEWBOX_MAX_Y = Math.max(BASE_VIEWBOX, CAPTION_PLACEMENT.textMaxY + TEXT_VIEWBOX_CLEARANCE);
const VIEWBOX = `${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_MAX_X - VIEWBOX_MIN_X} ${
  VIEWBOX_MAX_Y - VIEWBOX_MIN_Y
}`;

export default function HeroFigure() {
  return (
    <figure className="flex w-full flex-col items-center gap-3">
      <svg
        viewBox={VIEWBOX}
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
