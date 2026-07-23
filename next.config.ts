import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next restricts optimized-image quality to a fixed allowlist; the
    // portrait explicitly needs 90, not the default-only 75.
    qualities: [90],
  },
};

export default nextConfig;
