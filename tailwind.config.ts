import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    // Spec only defines two responsive thresholds (docs/motion-spec.md +
    // CLAUDE.md Responsive section): 640px and 900px. Replacing the default
    // scale keeps `sm:`/`md:` mapped exactly to those, nothing else.
    screens: {
      sm: "640px",
      md: "900px",
    },
    colors: {
      transparent: "transparent",
      current: "currentColor",
      paper: "#F5F1E8",
      ink: "#1A1815",
      muted: "#9B9382",
      accent: "#22384F",
      body: "#2E2A24",
      label: "#7C7566",
    },
    fontFamily: {
      display: ["var(--font-bricolage)", "sans-serif"],
      mono: ["var(--font-plex-mono)", "monospace"],
    },
    fontSize: {
      display: [
        "clamp(56px, 9vw, 138px)",
        { lineHeight: "0.90", letterSpacing: "-0.03em", fontWeight: "400" },
      ],
      h1: ["64px", { lineHeight: "1.05", letterSpacing: "-0.02em", fontWeight: "500" }],
      h2: ["40px", { lineHeight: "1.10", letterSpacing: "-0.015em", fontWeight: "500" }],
      body: ["19px", { lineHeight: "1.58", letterSpacing: "0", fontWeight: "400" }],
      small: ["15px", { lineHeight: "1.45", letterSpacing: "0", fontWeight: "400" }],
      "mono-label": ["13px", { letterSpacing: "0.22em", fontWeight: "500" }],
      "mono-label-sm": ["11px", { letterSpacing: "0.16em", fontWeight: "500" }],
      "mono-micro": ["11px", { letterSpacing: "0.16em", fontWeight: "400" }],
    },
    borderRadius: {
      none: "0px",
      DEFAULT: "0px",
      sm: "0px",
      md: "0px",
      lg: "0px",
      xl: "0px",
      "2xl": "0px",
      "3xl": "0px",
      full: "0px",
    },
    boxShadow: {
      none: "none",
    },
    extend: {
      maxWidth: {
        col: "min(632px, 100%)",
      },
      spacing: {
        section: "clamp(24px, 6vw, 96px)",
        "frame-desktop": "40px",
        "frame-mobile": "16px",
      },
      height: {
        svh: "100svh",
      },
      minHeight: {
        svh: "100svh",
      },
    },
  },
  plugins: [],
};

export default config;
