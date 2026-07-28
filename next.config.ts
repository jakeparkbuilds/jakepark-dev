import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next restricts optimized-image quality to a fixed allowlist; the
    // portrait explicitly needs 90, not the default-only 75.
    qualities: [90],
    // AVIF first, WebP as the fallback. Next only negotiates WebP by default;
    // the three rasters on this site (the about portrait and one photo per
    // education row) are the whole image budget, so it is worth the smaller
    // payload. Format negotiation only — no markup in any section changes.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
