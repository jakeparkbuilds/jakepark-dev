// § 04 projects — the register's whole content. Adding a project means adding
// one entry here and nothing else: the column header, the row layout, the
// thumbnail frame and the reveal all read off this array.
//
// `thumb` is optional. An entry without one renders its text block across cols
// 2–10 instead of 2–6, which reads as a deliberate full-width entry rather than
// a row with a hole in it. All three current entries have one.
//
// The generated SVG figures this file used to carry are gone (CLAUDE.md § 5 /
// §04). They were the right answer while the projects had nothing to show and
// the wrong one once they did — a generated figure asserts what work looked
// like in the abstract; a screenshot shows it. Do not add a synthetic figure
// back for a project that lacks a thumbnail.

export type ProjectLink = {
  label: string;
  href: string;
  icon: "live" | "github" | "pdf";
};

export type ProjectThumb = {
  src: string;
  /** Intrinsic pixels, read off the real file — never guessed, never rounded.
   *  next/image reserves the box from these, which is what holds CLS at 0. */
  width: number;
  height: number;
  alt: string;
  /** Mono-micro, uppercased by CSS per CLAUDE.md § 3 — never in the string. */
  caption: string;
  /** Where the image links. Always one of this project's own link hrefs. */
  href: string;
  /** Spoken name for the image link; the visible text link carries the same
   *  destination, so this has to distinguish itself from that one by naming
   *  what is being clicked rather than repeating the label. */
  linkLabel: string;
};

/** Stack entry → the index node it addresses, or null for one with no node.
 *  Exhaustive over every string in every project's `stack` and `headerStack`:
 *  a missing key would render an inert token that LOOKS interactive, so the
 *  component asserts against this map rather than falling back. */
export const TOOL_FOR_STACK: Record<string, string | null> = {
  Python: "python",
  "Next.js": "next.js",
  Terraform: "terraform",
  AWS: "aws",
  "AWS Lambda": "aws",
  SQS: "aws",
  DynamoDB: "aws",
  "PyTorch Geometric": "pytorch",
  "scikit-learn": "scikit-learn",
  FastAPI: "fastapi",
  // No node. Rendered as plain, non-interactive text — a node is not invented
  // for a tool the index does not carry.
  WebSockets: null,
  SHAP: null,
  "ArcGIS Pro": null,
  OpenStreetMap: null,
  "USGS Earth Explorer": null,
  USGS: null,
  "NOAA NCEI": null,
  NOAA: null,
};

export type Project = {
  no: string;
  name: string;
  year: string;
  /** The header line's one-line stack. Truncates from the tail, never wraps. */
  headerStack: string[];
  /** The whole pitch, one or two lines. */
  claim: string;
  /** The complete list, below the claim. Wraps freely. Every entry must be a
   *  key of TOOL_FOR_STACK. */
  stack: string[];
  links: ProjectLink[];
  thumb?: ProjectThumb;
};

export const PROJECTS: Project[] = [
  {
    no: "01",
    name: "My 5",
    year: "2026",
    headerStack: ["Python", "AWS", "Terraform", "Next.js"],
    claim: "an NBA 5v5 matchup simulator built on Monte Carlo simulation.",
    stack: [
      "Python",
      "AWS Lambda",
      "SQS",
      "DynamoDB",
      "Terraform",
      "WebSockets",
      "Next.js",
    ],
    links: [
      { label: "live", href: "https://my5-sigma.vercel.app/", icon: "live" },
    ],
    thumb: {
      src: "/my5.png",
      width: 2400,
      height: 1363,
      alt: "The My 5 lab interface, running a basketball matchup simulation.",
      caption: "my5 lab · matchup simulator",
      href: "https://my5-sigma.vercel.app/",
      linkLabel: "My 5 — open the live site",
    },
  },
  {
    no: "02",
    name: "CapitolCast",
    year: "2025",
    headerStack: ["Python", "PyTorch Geometric", "FastAPI", "Next.js"],
    claim:
      "forecasting which bills advance, across a 5.8m-edge cosponsorship graph.",
    stack: [
      "Python",
      "PyTorch Geometric",
      "scikit-learn",
      "FastAPI",
      "Next.js",
      "SHAP",
    ],
    links: [
      {
        label: "live",
        href: "https://capitol-cast.vercel.app/",
        icon: "live",
      },
    ],
    thumb: {
      src: "/capitolcast.png",
      width: 2400,
      height: 1363,
      alt: "The CapitolCast interface, showing bill advancement forecasts.",
      // A caption NAMES THE ARTIFACT and carries no numbers. This one used to
      // read "16,213 bills · 0.48 PR-AUC · 15× baseline". Those three went to
      // the metric row and the metric row is now gone, so of them only the
      // 5.8m edge count is still on the page, inside the claim above. The rest
      // are in the screenshot. The caption stays as it is: it identifies.
      caption: "capitolcast · bill advancement forecast",
      href: "https://capitol-cast.vercel.app/",
      linkLabel: "CapitolCast — open the live site",
    },
  },
  {
    no: "03",
    name: "Bike Heat Exposure Research",
    year: "2024",
    headerStack: ["ArcGIS Pro", "OpenStreetMap", "USGS", "NOAA"],
    claim:
      "mapping how land surface temperature and wind speed shape cycling across the DC metro area.",
    // ArcGIS Pro is the mapping and analysis tool; the rest are data sources.
    // Nothing the poster does not name.
    stack: ["ArcGIS Pro", "OpenStreetMap", "USGS Earth Explorer", "NOAA NCEI"],
    // No live deployment and no repo. Not padded with a disabled link — that
    // asymmetry is honest (CLAUDE.md § 5 / §04).
    links: [{ label: "poster (pdf)", href: "/assip-poster.pdf", icon: "pdf" }],
    thumb: {
      src: "/bike-heat.png",
      width: 1914,
      height: 1434,
      // The poster is dense and is NOT legible at this size. That is accepted:
      // it reads as "a research poster", the caption says so, and the link
      // opens the real thing. Never cropped, never zoomed into one figure.
      alt: "The ASSIP research poster on bike heat exposure across the DC metro area.",
      caption: "ASSIP research poster · George Mason University",
      href: "/assip-poster.pdf",
      linkLabel: "Bike Heat Exposure Research — open the poster (PDF)",
    },
  },
];
