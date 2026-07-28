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

// Open (unclosed) polyline — used for the two boundary halves, which are arcs
// of the ring rather than closed rings.
function lineToPath(points) {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
}

// Split the closed boundary ring into two arcs that both START at the north
// corner and both END at the south point, so the loader can draw them
// simultaneously and the outline "unzips" from the north and closes at the
// south instead of tracing start-vertex to end-vertex in sequence.
//
// The ring is wound so that walking FORWARD from the north corner goes
// north -> west corner -> down the Potomac shoreline -> south point, and
// walking BACKWARD goes north -> east corner -> down the southeast survey
// line -> south point. Both halves are cut from the same simplified vertex
// array that produces DC_OUTLINE, so their shared endpoints are the exact
// same rounded coordinate pairs — no seam, and the union of the two is the
// same segment set as the closed ring.
// Drop consecutive duplicate vertices. After projection + rounding to 1dp the
// source ring's first and last vertices collapse onto the same coordinate, so
// the closed DC_OUTLINE carries a zero-length closing segment. That is
// invisible in a closed path but would leave a degenerate segment (and a
// wasted slice of the draw's arc length) in a half, so the halves are
// deduped. Rendering is unaffected — a zero-length segment paints nothing.
function dedupeConsecutive(points) {
  return points.filter(
    (p, i) => i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]
  );
}

function splitRingNorthToSouth(ring) {
  let northIdx = 0;
  let southIdx = 0;
  for (let i = 1; i < ring.length; i++) {
    if (ring[i][1] < ring[northIdx][1]) northIdx = i;
    if (ring[i][1] > ring[southIdx][1]) southIdx = i;
  }
  const n = ring.length;
  const west = [];
  for (let i = northIdx; ; i = (i + 1) % n) {
    west.push(ring[i]);
    if (i === southIdx) break;
  }
  const east = [];
  for (let i = northIdx; ; i = (i - 1 + n) % n) {
    east.push(ring[i]);
    if (i === southIdx) break;
  }
  return {
    west: dedupeConsecutive(west),
    east: dedupeConsecutive(east),
    north: ring[northIdx],
    south: ring[southIdx],
  };
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

  // The boundary and the neighborhood clusters come from two different DC Open
  // Data layers and are simplified at different tolerances, so each traces the
  // shared shoreline slightly differently — the coastal edge renders as two
  // near-identical curves a pixel or two apart (a muddy doubled line). Fix: the
  // boundary is the single source of truth for the perimeter; every cluster
  // vertex that lands within SNAP_PX of the simplified boundary polyline is
  // snapped onto it, so coastal cluster edges become collinear with the
  // boundary and render as one line. The boundary itself is untouched.
  const SNAP_PX = 2.5;
  const boundaryProjected = simplifyRDP(boundaryRing.map(project), BOUNDARY_TOLERANCE_PX);

  // Closest point on segment ab to p, and its squared distance.
  function closestOnSeg(p, a, b) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    let t = 0;
    const len2 = dx * dx + dy * dy;
    if (len2 > 0) t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = a[0] + t * dx;
    const cy = a[1] + t * dy;
    const ex = p[0] - cx;
    const ey = p[1] - cy;
    return { pt: [cx, cy], d2: ex * ex + ey * ey };
  }

  const snapSq = SNAP_PX * SNAP_PX;
  function snapToBoundary(p) {
    let best = null;
    let bestD = snapSq;
    for (let i = 0; i < boundaryProjected.length; i++) {
      const a = boundaryProjected[i];
      const b = boundaryProjected[(i + 1) % boundaryProjected.length];
      const c = closestOnSeg(p, a, b);
      if (c.d2 < bestD) {
        bestD = c.d2;
        best = c.pt;
      }
    }
    return best ? [round1(best[0]), round1(best[1])] : p;
  }

  function processRing(rawRing, tolerance) {
    const ring = dropClosingDuplicate(rawRing);
    // Snap near-boundary vertices onto the boundary polyline before simplifying,
    // so a shared coastal edge collapses onto the boundary rather than doubling.
    const projected = ring.map(project).map(snapToBoundary);
    const simplified = simplifyRDP(projected, tolerance);
    return ringToPath(simplified);
  }

  const DC_OUTLINE = ringToPath(boundaryProjected);

  const halves = splitRingNorthToSouth(boundaryProjected);
  const DC_BOUNDARY_WEST = lineToPath(halves.west);
  const DC_BOUNDARY_EAST = lineToPath(halves.east);
  // Assert the split is lossless and seamless before writing: identical shared
  // endpoints, and every ring vertex accounted for exactly once (the two shared
  // endpoints appear in both halves, hence the +2).
  const sameCoord = (a, b) => a[0] === b[0] && a[1] === b[1];
  if (!sameCoord(halves.west[0], halves.east[0])) {
    throw new Error("boundary split: north endpoints differ");
  }
  if (!sameCoord(halves.west.at(-1), halves.east.at(-1))) {
    throw new Error("boundary split: south endpoints differ");
  }
  // Every distinct ring vertex is covered exactly once, plus the two shared
  // endpoints which appear in both halves. Compared against the ring with its
  // consecutive duplicates removed cyclically — see dedupeConsecutive.
  const ringDeduped = dedupeConsecutive(boundaryProjected).filter(
    (p, i, a) => !(i === a.length - 1 && sameCoord(p, a[0]))
  );
  if (halves.west.length + halves.east.length !== ringDeduped.length + 2) {
    throw new Error(
      `boundary split: vertex count mismatch (${halves.west.length}+${halves.east.length} vs ${ringDeduped.length}+2)`
    );
  }

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
    `\n// The closed District ring. Kept as the single source of truth for the\n` +
    `// geometry and as the cursor's isPointInFill() hit-test path; the visible\n` +
    `// stroke is drawn as the two halves below.\n` +
    `export const DC_OUTLINE = ${JSON.stringify(DC_OUTLINE)};\n\n` +
    `// The same ring cut at its north corner and its south point, so the loader\n` +
    `// can draw both halves at once and the outline unzips symmetrically.\n` +
    `// WEST runs north -> west corner -> Potomac shoreline -> south.\n` +
    `// EAST runs north -> east corner -> southeast survey line -> south.\n` +
    `// Shared endpoints are byte-identical between the two.\n` +
    `export const DC_BOUNDARY_WEST = ${JSON.stringify(DC_BOUNDARY_WEST)};\n\n` +
    `export const DC_BOUNDARY_EAST = ${JSON.stringify(DC_BOUNDARY_EAST)};\n\n` +
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
    `boundary halves: west ${halves.west.length} verts / east ${halves.east.length} verts, ` +
      `north ${halves.north.join(",")} south ${halves.south.join(",")}`
  );
  console.log(
    `DC_NEIGHBORHOODS: ${DC_NEIGHBORHOODS.length} paths, ${neighborhoodChars} chars`
  );
  console.log(`total path-string chars: ${DC_OUTLINE.length + neighborhoodChars}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
