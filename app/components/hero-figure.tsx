import { DC_NEIGHBORHOODS, DC_OUTLINE, DC_PROJECTION } from "./dc-paths";

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

// The DC diamond is taller than wide, so the projection centers it in the
// 0–400 viewBox with ~46 units of empty margin on the west and east. The west
// band is pure dead space (the SE caption lives on the east/south edge, never
// the west), and it is what pushes the map's visual "western edge" far from the
// text column. Crop the viewBox to hug the shape's real western extent — read
// off DC_OUTLINE, not guessed — leaving a small clearance. This both enlarges
// the rendered ink for a given footprint and lets the map nest closer to the
// ragged text edge, without touching a single path coordinate. The cursor's
// screenToLatLon reads svg.viewBox.baseVal.x, so it follows this automatically.
const WEST_CLEARANCE = 6; // units of empty space kept west of the boundary
function outlineWestExtent() {
  let minX = Infinity;
  // DC_OUTLINE is "M x,y L x,y …"; pull every x coordinate.
  for (const m of DC_OUTLINE.matchAll(/[ML]\s*(-?\d+(?:\.\d+)?)/g)) {
    const x = parseFloat(m[1]);
    if (x < minX) minX = x;
  }
  return minX;
}
const WEST_CROP_X = outlineWestExtent() - WEST_CLEARANCE;

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
const VIEWBOX_MIN_X = Math.min(WEST_CROP_X, CAPTION_PLACEMENT.textMinX - TEXT_VIEWBOX_CLEARANCE);
const VIEWBOX_MIN_Y = Math.min(0, CAPTION_PLACEMENT.textMinY - TEXT_VIEWBOX_CLEARANCE);
const VIEWBOX_MAX_X = Math.max(BASE_VIEWBOX, CAPTION_PLACEMENT.textMaxX + TEXT_VIEWBOX_CLEARANCE);
const VIEWBOX_MAX_Y = Math.max(BASE_VIEWBOX, CAPTION_PLACEMENT.textMaxY + TEXT_VIEWBOX_CLEARANCE);
const VIEWBOX = `${VIEWBOX_MIN_X} ${VIEWBOX_MIN_Y} ${VIEWBOX_MAX_X - VIEWBOX_MIN_X} ${
  VIEWBOX_MAX_Y - VIEWBOX_MIN_Y
}`;

// Georgetown University, 38.9076°N 77.0723°W, pushed through the SAME affine
// projection scripts/generate-dc-paths.mjs used to build the map (DC_PROJECTION
// from dc-paths.ts) — not a second, eyeballed set of bounds. Same math as the
// cursor's inverse in PlotterCursor.screenToLatLon, run forward.
function projectLatLon(lat: number, lon: number) {
  return {
    x: (lon - DC_PROJECTION.lonMin) * DC_PROJECTION.cosLat * DC_PROJECTION.scale + DC_PROJECTION.offsetX,
    y: (DC_PROJECTION.latMax - lat) * DC_PROJECTION.scale + DC_PROJECTION.offsetY,
  };
}

const GEORGETOWN = projectLatLon(38.9076, -77.0723);

// The star and its label are drawn in user units, so they scale with the map
// (they must NOT use non-scaling-stroke — the star is a filled mark, not a
// hairline). At the enlarged hero the map renders ~1.5px per user unit, so
// these unit sizes land at roughly their intended pixel sizes there:
//   star  ~9px across  -> outer radius 3 units
//   label ~11px        -> 7.3 units
//   leader ~6px        -> 4 units
const STAR_OUTER = 3;
const STAR_INNER = STAR_OUTER * 0.382; // classic 5-point star waist ratio
const LABEL_FONT = 7.3;
const LABEL_TRACKING = LABEL_FONT * 0.16; // mono-micro tracking
const LEADER_LEN = 4;

// A 5-point star centered at (cx, cy), first point straight up.
function starPath(cx: number, cy: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? STAR_OUTER : STAR_INNER;
    const a = (-90 + i * 36) * (Math.PI / 180);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

// Georgetown sits on the map's western side; its upper-right is dense
// neighborhood interior, so the label reads into the open paper to the
// upper-LEFT instead (the spec's fallback when the right side collides — see
// verification note in the commit). Leader runs from the star's outer edge out
// to the label; the label hangs off the leader's end.
const LABEL_SIDE: "left" | "right" = "left";
const DIAG = Math.SQRT1_2; // cos/sin of 45°
const LABEL = (() => {
  const dir = LABEL_SIDE === "left" ? -1 : 1;
  const edge = { x: GEORGETOWN.x + dir * STAR_OUTER * DIAG, y: GEORGETOWN.y - STAR_OUTER * DIAG };
  const tip = { x: edge.x + dir * LEADER_LEN * DIAG, y: edge.y - LEADER_LEN * DIAG };
  const gap = 1.4;
  return {
    leader: { x1: edge.x, y1: edge.y, x2: tip.x, y2: tip.y },
    textX: tip.x + dir * gap,
    textY: tip.y,
    anchor: (LABEL_SIDE === "left" ? "end" : "start") as "start" | "end",
  };
})();

export default function HeroFigure() {
  return (
    <figure className="flex w-full flex-col items-center gap-3">
      <svg
        viewBox={VIEWBOX}
        role="img"
        aria-label="Map of Washington, D.C. showing its 46 neighborhood clusters within the district boundary"
        className="w-full min-w-[220px]"
        data-dc-map
      >
        {/* data-dc-hoods: the loader draws these 46 cluster paths in, north to
            south, during the intro (HeroIntro). */}
        <g data-dc-hoods>
          {DC_NEIGHBORHOODS.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#1A1815"
              strokeOpacity={0.34}
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
        {/* Georgetown mark — above the neighborhood fills, below the outer
            boundary. The star is the site's single use of `mark` #C8952E. */}
        <g data-georgetown aria-hidden="true">
          <line
            x1={LABEL.leader.x1}
            y1={LABEL.leader.y1}
            x2={LABEL.leader.x2}
            y2={LABEL.leader.y2}
            stroke="#9B9382"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
          <text
            x={LABEL.textX}
            y={LABEL.textY}
            textAnchor={LABEL.anchor}
            dominantBaseline="middle"
            fontFamily="var(--font-plex-mono)"
            fontSize={LABEL_FONT}
            letterSpacing={LABEL_TRACKING}
            fill="#6B6455"
            style={{ textTransform: "uppercase" }}
          >
            Georgetown
          </text>
          <path d={starPath(GEORGETOWN.x, GEORGETOWN.y)} fill="#C8952E" />
        </g>

        {/* data-dc-boundary: the District's real boundary geometry, used by
            PlotterCursor's isPointInFill() hit test (not a bounding-box
            approximation) to gate the map coordinate readout. */}
        <path
          d={DC_OUTLINE}
          fill="none"
          stroke="#1A1815"
          strokeOpacity={0.95}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
          data-dc-boundary
        />
        <text
          x={CAPTION_PLACEMENT.x}
          y={CAPTION_PLACEMENT.y}
          transform={`rotate(${CAPTION_PLACEMENT.angle} ${CAPTION_PLACEMENT.x} ${CAPTION_PLACEMENT.y})`}
          textAnchor="middle"
          fontFamily="var(--font-plex-mono)"
          fontSize={CAPTION_PLACEMENT.fontSize}
          letterSpacing={CAPTION_PLACEMENT.tracking}
          fill="#6B6455"
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
