// § 03 experience — the whole content of the inverted plate.
//
// Order is RÉSUMÉ order, not chronological. The dates overlap on purpose; do
// not reorder to resolve them.
//
// `role` is the § 03-only role palette (CLAUDE.md § 2). It appears in exactly
// two places — the spine segment and the role-title label — and nowhere else on
// the site. Note role-03 shares a hex with `mark` #C8952E: a collision of
// value, not of meaning. Neither token may reference the other.

export type Role = {
  no: string;
  org: string;
  /** Logo file in /public/logos, without the extension. */
  logo: string;
  title: string;
  dates: string;
  /** One line. No bullets, no metrics, no sub-achievements. */
  description: string;
  color: string;
};

export const ROLES: Role[] = [
  {
    no: "01",
    org: "Better Futures Institute",
    logo: "better-futures-institute",
    title: "software engineer intern",
    dates: "may 2026 — aug 2026",
    description:
      "transit APIs and ridership forecasting across a multi-agency system",
    color: "#C87F4A",
  },
  {
    no: "02",
    org: "Break Through Tech",
    logo: "break-through-tech",
    title: "ai/ml fellow",
    dates: "may 2026 — present",
    description:
      "deep learning and RAG systems with corporate clients via Cornell Tech",
    color: "#6B8F71",
  },
  {
    no: "03",
    org: "Georgetown Ventures",
    logo: "georgetown-ventures",
    title: "software engineer",
    dates: "sep 2025 — present",
    description: "async ingestion and autonomous agents for an AI travel startup",
    color: "#C8952E",
  },
  {
    no: "04",
    org: "Hoyalytics",
    logo: "hoyalytics",
    title: "director of training",
    dates: "sep 2025 — present",
    description: "led data science training for 500+ students",
    color: "#7B6FA8",
  },
  {
    no: "05",
    org: "George Mason University",
    logo: "george-mason",
    title: "geospatial analytics researcher",
    dates: "may 2024 — aug 2024",
    description: "geospatial modeling of heat exposure across DC bike networks",
    color: "#4A7C94",
  },
];
