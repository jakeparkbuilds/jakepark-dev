import type { FigureKind } from "../components/project-figures";

// § 04 projects — the register's whole content. Adding a project means adding
// one entry here and nothing else: the layout, the column header, the
// accordion, the keyboard wiring and the figure slot all read off this array.
//
// `figure` is optional on purpose. An entry without one renders its text block
// across cols 2–10 instead of 2–6, which reads as a deliberate full-width
// entry rather than a panel with a hole in it.

export type ProjectLink = {
  label: string;
  href: string;
  icon: "live" | "github" | "pdf";
};

export type Project = {
  no: string;
  name: string;
  year: string;
  /** Truncated for the closed row — one line, never wrapped. */
  closedStack: string[];
  /** The whole pitch, one sentence. */
  claim: string;
  /** The complete list, shown only when expanded. */
  stack: string[];
  links: ProjectLink[];
  credit?: string;
  figure?: { kind: FigureKind; caption: string };
};

export const PROJECTS: Project[] = [
  {
    no: "01",
    name: "My 5",
    year: "2026",
    closedStack: ["Python", "AWS", "Terraform", "Next.js"],
    claim: "a serverless monte carlo simulator that knows when to stop.",
    stack: [
      "Python",
      "AWS Lambda",
      "SQS",
      "DynamoDB",
      "Terraform",
      "WebSockets",
      "Next.js",
    ],
    links: [{ label: "live", href: "https://my5-sigma.vercel.app/", icon: "live" }],
    figure: { kind: "convergence", caption: "stopped early · 95% compute saved" },
  },
  {
    no: "02",
    name: "CapitolCast",
    year: "2025",
    closedStack: ["Python", "PyTorch Geometric", "FastAPI", "Next.js"],
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
    links: [{ label: "live", href: "https://capitol-cast.vercel.app/", icon: "live" }],
    figure: { kind: "arcs", caption: "cosponsorship graph · 5.8m edges" },
  },
  {
    no: "03",
    name: "Wildfire Evacuation Model",
    // ASSIP ran June–August 2024.
    year: "2024",
    closedStack: ["NetLogo", "Python", "ArcGIS"],
    claim:
      "agent-based evacuation modeling that outperformed GPS-trace baselines.",
    stack: ["NetLogo", "Python", "ArcGIS", "reinforcement learning"],
    // No live deployment and no repo. That asymmetry is honest — it is not
    // padded with a disabled link.
    links: [{ label: "poster (pdf)", href: "/assip-poster.pdf", icon: "pdf" }],
    credit: "with Nazanin Tajik & Alireza Ermagun · George Mason ASSIP",
    figure: { kind: "trajectories", caption: "~90% evacuated · n=40 sampled" },
  },
];
