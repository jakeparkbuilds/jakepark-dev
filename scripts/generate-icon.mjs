// Renders app/icon.png — the favicon — once, at build-authoring time.
//
// It could have been an app/icon.tsx route, but a favicon is requested on
// literally every page load and there is no reason to rasterise it per
// request. So: render once, commit the output, same contract as
// scripts/generate-dc-paths.mjs (script and output both committed).
//
// The mark is the Georgetown star and nothing else. Not a second use of
// `mark` in the sense CLAUDE.md § 2 forbids — the favicon is not a viewport,
// it is the page's identity at 16px, and the star is the only object on the
// site that survives being drawn that small.
//
// Run: node scripts/generate-icon.mjs
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og.js";

const SIZE = 512;
const PAPER = "#F5F1E8";
const MARK = "#C8952E";
const STAR_FRACTION = 0.4; // point-to-point width, as a fraction of the square

function starPath(cx, cy, outer) {
  const inner = outer * 0.382; // the hero star's waist ratio, unchanged
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (-90 + i * 36) * (Math.PI / 180);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(" L")} Z`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}"><path d="${starPath(
  SIZE / 2,
  SIZE / 2,
  (SIZE * STAR_FRACTION) / 2,
)}" fill="${MARK}"/></svg>`;

const image = new ImageResponse(
  {
    type: "div",
    props: {
      style: {
        display: "flex",
        width: SIZE,
        height: SIZE,
        backgroundColor: PAPER,
      },
      children: {
        type: "img",
        props: {
          width: SIZE,
          height: SIZE,
          src: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
        },
      },
    },
  },
  { width: SIZE, height: SIZE },
);

const out = path.join(process.cwd(), "app", "icon.png");
fs.writeFileSync(out, Buffer.from(await image.arrayBuffer()));
console.log(`wrote ${out} (${fs.statSync(out).size.toLocaleString()} bytes)`);
