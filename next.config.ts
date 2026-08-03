import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next restricts optimized-image quality to a fixed allowlist; the
    // portrait explicitly needs 90, not the default-only 75.
    qualities: [90],
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
