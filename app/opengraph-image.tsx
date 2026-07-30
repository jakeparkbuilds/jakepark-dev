import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

import {
  DC_NEIGHBORHOODS,
  DC_OUTLINE,
  DC_PROJECTION,
} from "./components/dc-paths";

export const alt = "Jake Park — CS + Math at Georgetown";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// ── the map ────────────────────────────────────────────────────────────────
//
// Same generated geometry the hero draws (app/components/dc-paths.ts), scaled
// by a viewBox rather than re-projected — the paths are never touched. The
// hero's caption, GEORGETOWN label and leader are all dropped: at 440px tall
// on a card that renders ~260px wide in a feed, 11px mono is not type, it is
// texture.
//
// Read the shape's real extent off DC_OUTLINE instead of assuming the 0–400
// projection square. The DC diamond is taller than wide and the projection
// leaves ~46 units of dead space either side, which would otherwise shrink the
// ink for a given panel height. Same technique as hero-figure's WEST_CROP_X,
// applied on all four sides.
function outlineExtent() {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const m of DC_OUTLINE.matchAll(
    /[ML]\s*(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g,
  )) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

const EXTENT = outlineExtent();
const MAP_PAD = 6; // units of clear paper around the boundary ink
const VB_X = EXTENT.minX - MAP_PAD;
const VB_Y = EXTENT.minY - MAP_PAD;
const VB_W = EXTENT.maxX - EXTENT.minX + MAP_PAD * 2;
const VB_H = EXTENT.maxY - EXTENT.minY + MAP_PAD * 2;

const MAP_HEIGHT = 440;
const MAP_WIDTH = Math.round((MAP_HEIGHT * VB_W) / VB_H);
// User units per rendered pixel. Every stroke and radius below is authored in
// PIXELS and divided through by this, so the numbers in the source are the
// numbers that land in the PNG. `vector-effect: non-scaling-stroke` does not
// survive rasterisation through resvg reliably, so the conversion is explicit.
const UNITS_PER_PX = VB_H / MAP_HEIGHT;

// § 4 puts every hairline at 0.5px. This is the one waiver: an OG card is
// re-encoded as JPEG by every platform that shows it and downscaled to ~260px
// wide in a timeline, and a 0.5px ink line does not survive either step — it
// grays out and then disappears. 1.5px boundary / 1px clusters is the same
// drawing, exposed for a lossy medium. Noted in CLAUDE.md § 5 / hero.
const BOUNDARY_PX = 1.5;
const CLUSTER_PX = 1;
const STAR_PX = 14; // point-to-point width of the mark

// Georgetown, 38.9076°N / 77.0723°W through DC_PROJECTION — the same forward
// affine hero-figure runs, never an eyeballed coordinate (§ 5 / hero).
const GEORGETOWN = {
  x:
    (-77.0723 - DC_PROJECTION.lonMin) *
      DC_PROJECTION.cosLat *
      DC_PROJECTION.scale +
    DC_PROJECTION.offsetX,
  y: (DC_PROJECTION.latMax - 38.9076) * DC_PROJECTION.scale + DC_PROJECTION.offsetY,
};

function starPath(cx: number, cy: number, outer: number) {
  const inner = outer * 0.382; // the hero's waist ratio, unchanged
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (-90 + i * 36) * (Math.PI / 180);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

// Satori renders `<img>` from a data URI far more predictably than it renders
// inline SVG elements (its native SVG support covers a subset of attributes and
// silently drops the rest), so the map is authored as a document and embedded.
const MAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP_WIDTH}" height="${MAP_HEIGHT}" viewBox="${VB_X} ${VB_Y} ${VB_W} ${VB_H}">
<g fill="none" stroke="#1A1815" stroke-opacity="0.28" stroke-width="${(CLUSTER_PX * UNITS_PER_PX).toFixed(3)}" stroke-linejoin="round">
${DC_NEIGHBORHOODS.map((d) => `<path d="${d}"/>`).join("\n")}
</g>
<path d="${DC_OUTLINE}" fill="none" stroke="#1A1815" stroke-width="${(BOUNDARY_PX * UNITS_PER_PX).toFixed(3)}" stroke-linejoin="round" stroke-linecap="round"/>
<path d="${starPath(GEORGETOWN.x, GEORGETOWN.y, (STAR_PX / 2) * UNITS_PER_PX)}" fill="#C8952E"/>
</svg>`;

const MAP_SRC = `data:image/svg+xml;base64,${Buffer.from(MAP_SVG).toString("base64")}`;

// ── fonts ──────────────────────────────────────────────────────────────────
//
// Satori reads sfnt only (ttf / otf / woff) and has no variable-font support,
// so it cannot use the woff2 the site ships. app/fonts/og/ holds static TTF
// instances built by scripts/generate-og-fonts.py; without the instancing step
// Bricolage would render at its fvar default of wght 800, not the 500 here.
const fontDir = path.join(process.cwd(), "app", "fonts", "og");
const readFont = (file: string) => fs.readFileSync(path.join(fontDir, file));

// ── the plate ──────────────────────────────────────────────────────────────

const INK = "#1A1815";
const PAPER = "#F5F1E8";
const LEGIBLE_MONO = "#6B6455";

const CORNER_INSET = 40;
const CORNER_ARM = 26;
const CORNER_RULE = 1.5;

// Satori is flexbox-only and needs an explicit `display` on every element, so
// each registration corner is a bare box carrying two borders — the L is the
// two borders, not a drawn path.
function corner(v: "top" | "bottom", h: "left" | "right") {
  return (
    <div
      key={`${v}-${h}`}
      style={{
        display: "flex",
        position: "absolute",
        [v]: CORNER_INSET,
        [h]: CORNER_INSET,
        width: CORNER_ARM,
        height: CORNER_ARM,
        [v === "top" ? "borderTop" : "borderBottom"]: `${CORNER_RULE}px solid ${INK}`,
        [h === "left" ? "borderLeft" : "borderRight"]: `${CORNER_RULE}px solid ${INK}`,
      }}
    />
  );
}

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: size.width,
          height: size.height,
          position: "relative",
          backgroundColor: PAPER,
          fontFamily: "Bricolage Grotesque",
        }}
      >
        {/* left — the name block, § 01's own stack at card scale */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: Math.round(size.width * 0.58),
            padding: 72,
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: "IBM Plex Mono",
              fontWeight: 500,
              fontSize: 20,
              letterSpacing: 20 * 0.22,
              textTransform: "uppercase",
              color: LEGIBLE_MONO,
            }}
          >
            cs + math @ Georgetown
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 28,
              fontWeight: 500,
              fontSize: 116,
              lineHeight: 0.9,
              letterSpacing: 116 * -0.03,
              color: INK,
            }}
          >
            <div style={{ display: "flex" }}>Jake</div>
            <div style={{ display: "flex" }}>Park</div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 32,
              fontFamily: "IBM Plex Mono",
              fontWeight: 400,
              fontSize: 22,
              letterSpacing: 22 * 0.16,
              color: LEGIBLE_MONO,
            }}
          >
            jakekpark.com
          </div>
        </div>

        {/* right — the District, no caption and no label */}
        <div
          style={{
            display: "flex",
            width: size.width - Math.round(size.width * 0.58),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={MAP_SRC} width={MAP_WIDTH} height={MAP_HEIGHT} alt="" />
        </div>

        {corner("top", "left")}
        {corner("top", "right")}
        {corner("bottom", "left")}
        {corner("bottom", "right")}
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Bricolage Grotesque",
          data: readFont("bricolage-500.ttf"),
          weight: 500,
          style: "normal",
        },
        {
          name: "IBM Plex Mono",
          data: readFont("plex-mono-400.ttf"),
          weight: 400,
          style: "normal",
        },
        {
          name: "IBM Plex Mono",
          data: readFont("plex-mono-500.ttf"),
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}
