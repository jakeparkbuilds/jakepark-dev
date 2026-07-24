#!/usr/bin/env node
// One-off script: fetch the DC boundary + neighborhood cluster polygons from
// DC Open Data, project + simplify them, and emit hardcoded SVG path strings
// to app/components/dc-paths.ts.
//
// Run manually:  node scripts/generate-dc-paths.mjs
//
// This is NOT part of the build pipeline. The app never fetches this data at
// runtime — it only ever imports the generated .ts file.

import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BOUNDARY_URL =
  "https://opendata.dc.gov/api/download/v1/items/7241f6d500b44288ad983f0942b39663/geojson?layers=10";
const NEIGHBORHOODS_URL =
  "https://opendata.dc.gov/api/download/v1/items/f6c703ebe2534fc3800609a07bad8f5b/geojson?layers=17";

const VIEWBOX = 400; // square viewBox, matches hero-figure.tsx
const MARGIN = 8; // px padding inside the viewBox
const BOUNDARY_TOLERANCE_PX = 3; // unchanged — do not regenerate the boundary geometry
const NEIGHBORHOOD_TOLERANCE_PX = 0.75; // ~0.5-1px, keeps interior curvature

async function fetchGeoJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch failed ${res.status} ${url}`);
  return res.json();
}

// Ramer-Douglas-Peucker simplification over projected [x, y] pairs.
function sqSegDist(p, p1, p2) {
  let [x, y] = p1;
  let dx = p2[0] - x;
  let dy = p2[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplifyRDP(points, tolerance) {
  if (points.length < 3) return points;
  const sqTolerance = tolerance * tolerance;

  function recurse(pts, first, last, out) {
    let maxDist = sqTolerance;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const dist = sqSegDist(pts[i], pts[first], pts[last]);
      if (dist > maxDist) {
        index = i;
        maxDist = dist;
      }
    }
    if (index !== -1) {
      if (index - first > 1) recurse(pts, first, index, out);
      out.push(pts[index]);
      if (last - index > 1) recurse(pts, index, last, out);
    }
  }

  const out = [points[0]];
  recurse(points, 0, points.length - 1, out);
  out.push(points[points.length - 1]);
  return out;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function ringToPath(ring) {
  return ring.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ") + " Z";
}

// GeoJSON rings repeat the first point as the last; drop the duplicate since
// the SVG "Z" command closes the path itself.
function dropClosingDuplicate(ring) {
  const [x0, y0] = ring[0];
  const [xn, yn] = ring[ring.length - 1];
  return x0 === xn && y0 === yn ? ring.slice(0, -1) : ring;
}

async function main() {
  const [boundaryFC, neighborhoodsFC] = await Promise.all([
    fetchGeoJSON(BOUNDARY_URL),
    fetchGeoJSON(NEIGHBORHOODS_URL),
  ]);

  const boundaryRing = dropClosingDuplicate(
    boundaryFC.features[0].geometry.coordinates[0]
  );

  // Bounding box + projection derived from the boundary ring only; the
  // neighborhood clusters tile within it and share the same transform.
  let lonMin = Infinity,
    lonMax = -Infinity,
    latMin = Infinity,
    latMax = -Infinity;
  for (const [lon, lat] of boundaryRing) {
    if (lon < lonMin) lonMin = lon;
    if (lon > lonMax) lonMax = lon;
    if (lat < latMin) latMin = lat;
    if (lat > latMax) latMax = lat;
  }

  const cosLat = Math.cos(((latMin + latMax) / 2) * (Math.PI / 180));
  const lonSpan = (lonMax - lonMin) * cosLat;
  const latSpan = latMax - latMin;
  const drawSize = VIEWBOX - MARGIN * 2;
  const scale = drawSize / Math.max(lonSpan, latSpan);
  const offsetX = MARGIN + (drawSize - lonSpan * scale) / 2;
  const offsetY = MARGIN + (drawSize - latSpan * scale) / 2;

  function project([lon, lat]) {
    return [
      round1((lon - lonMin) * cosLat * scale + offsetX),
      round1((latMax - lat) * scale + offsetY),
    ];
  }

  function processRing(rawRing, tolerance) {
    const ring = dropClosingDuplicate(rawRing);
    const projected = ring.map(project);
    const simplified = simplifyRDP(projected, tolerance);
    return ringToPath(simplified);
  }

  const DC_OUTLINE = ringToPath(
    simplifyRDP(boundaryRing.map(project), BOUNDARY_TOLERANCE_PX)
  );

  const DC_NEIGHBORHOODS = neighborhoodsFC.features
    .map((f) => processRing(f.geometry.coordinates[0], NEIGHBORHOOD_TOLERANCE_PX))
    .sort();

  // The exact affine transform used by project() above, exported so any
  // consumer (the cursor's map coordinate readout) can invert a point in
  // this same 0-400 space back to lon/lat without re-deriving or
  // approximating a second projection.
  const DC_PROJECTION = {
    lonMin,
    latMax,
    cosLat,
    scale,
    offsetX,
    offsetY,
  };

  const outPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "app",
    "components",
    "dc-paths.ts"
  );

  const banner = `// Generated by scripts/generate-dc-paths.mjs — do not hand-edit.
// Source: DC Open Data (opendata.dc.gov), public domain.
//   Washington DC Boundary: ${BOUNDARY_URL}
//   Neighborhood Clusters:  ${NEIGHBORHOODS_URL}
// Projected with an equirectangular projection scaled to a ${VIEWBOX}x${VIEWBOX}
// viewBox and simplified with Ramer-Douglas-Peucker (boundary tolerance
// ${BOUNDARY_TOLERANCE_PX}px, neighborhood tolerance ${NEIGHBORHOOD_TOLERANCE_PX}px).
// Coordinates rounded to 1 decimal place.
`;

  const contents =
    banner +
    `\nexport const DC_OUTLINE = ${JSON.stringify(DC_OUTLINE)};\n\n` +
    `export const DC_NEIGHBORHOODS: string[] = ${JSON.stringify(DC_NEIGHBORHOODS, null, 2)};\n\n` +
    `// Inverts a point in the same 0-400 project() space above back to lon/lat:\n` +
    `//   lon = (x - offsetX) / cosLat / scale + lonMin\n` +
    `//   lat = latMax - (y - offsetY) / scale\n` +
    `export const DC_PROJECTION = ${JSON.stringify(DC_PROJECTION, null, 2)};\n`;

  await writeFile(outPath, contents);

  const neighborhoodChars = DC_NEIGHBORHOODS.join("").length;
  console.log(`wrote ${outPath}`);
  console.log(`DC_OUTLINE: ${DC_OUTLINE.length} chars`);
  console.log(
    `DC_NEIGHBORHOODS: ${DC_NEIGHBORHOODS.length} paths, ${neighborhoodChars} chars`
  );
  console.log(`total path-string chars: ${DC_OUTLINE.length + neighborhoodChars}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
