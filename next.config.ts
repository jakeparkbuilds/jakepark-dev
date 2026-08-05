import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next restricts optimized-image quality to a fixed allowlist, and it is a
    // hard allowlist: a quality not named here 400s at request time rather than
    // falling back. 72 is now the site's figure for every optimized raster —
    // measured against 90 at the widths a browser actually requests, it is a
    // 27-38% smaller AVIF and the difference is not visible at 200%. 90 stays
    // listed because removing it would break any URL already cached or linked
    // at that quality; nothing renders with it.
    qualities: [72, 90],
    // AVIF first, WebP as the fallback. Next only negotiates WebP by default;
    // the optimized rasters on this site are the about portrait, one photo per
    // education row and § 04's three project thumbnails — the whole image
    // budget bar the pizza, which is served unoptimized on demand. Worth the
    // smaller payload, and it matters most for the thumbnails: they are 3024px
    // PNG screenshots displayed at 560. Format negotiation only — no markup in
    // any section changes.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
