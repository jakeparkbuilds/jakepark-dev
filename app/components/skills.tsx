import { Fragment } from "react";
import SectionShell from "./section-shell";

// § 05 skills — a compact technical plate. Four categories staged along a
// shallow stepped hairline; each hangs below its own run on a downward tick.
// The spine is one continuous SVG <path> used purely as composition (not a
// directional pipeline). The layout math lives in globals.css (.skills-*),
// where percentage-X / pixel-Y keeps the path touching every tick at every
// width without any client JS. See docs/motion-spec.md § 05.
type Station = {
  num: string;
  domain: string;
  primary: string;
  // Authored as an array (never a pre-joined string), so no separator can be
  // emitted after the final item — see SupportingList for how it renders.
  supporting: string[];
};

const STATIONS: Station[] = [
  {
    num: "01",
    domain: "languages",
    primary: "python",
    supporting: ["typescript", "java", "c++", "sql", "r"],
  },
  {
    num: "02",
    domain: "ml & data",
    primary: "pytorch",
    supporting: [
      "scikit-learn",
      "xgboost",
      "hugging face",
      "pandas",
      "numpy",
      "tensorflow",
      "shap",
    ],
  },
  {
    num: "03",
    domain: "infrastructure",
    primary: "aws",
    supporting: ["docker", "terraform", "postgresql", "mongodb", "git", "ci/cd"],
  },
  {
    num: "04",
    domain: "interfaces",
    primary: "next.js",
    supporting: ["react", "fastapi", "node.js", "flask", "express"],
  },
];

// Middot-separated list that never orphans a separator at a line break. Each
// item (past the first) is bound to its leading "· " inside a nowrap span, and
// the only break opportunity is the plain space *between* spans — so a wrapped
// line always ends on a whole item and the continuation starts on "· item",
// never a floating separator. A multi-word item ("hugging face") also stays
// intact because its span is nowrap.   = non-breaking space.
function SupportingList({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item, i) => (
        <Fragment key={item}>
          {i > 0 ? " " : null}
          <span className="whitespace-nowrap">{i > 0 ? `· ${item}` : item}</span>
        </Fragment>
      ))}
    </>
  );
}

function StationBlock({ station, index }: { station: Station; index: number }) {
  return (
    <div className={`skills-station skills-station--${index + 1}`} data-station={station.num}>
      {/* the tick — the 0.5px stroke that attaches this station to the spine */}
      <span aria-hidden="true" className="skills-tick" />

      <p className="skills-index font-mono text-mono-micro uppercase text-label">
        {station.num}
      </p>
      <p className="skills-domain font-display font-medium text-ink">{station.domain}</p>

      {/* primary tool + supporting list — reserved a fixed height (globals.css
          --lead-h, sized to the tallest station's two-line list) so all four
          stations bottom out at the same offset from their own spine run. */}
      <div className="skills-lead">
        <p className="skills-primary font-display text-body">{station.primary}</p>
        <p className="skills-support font-mono text-label">
          <SupportingList items={station.supporting} />
        </p>
      </div>
    </div>
  );
}

export default function Skills({
  number,
  id,
  label,
}: {
  number: string;
  id: string;
  label: string;
}) {
  return (
    <SectionShell number={number} id={id} label={label}>
      <div className="skills-stage" data-spine="composition">
        {/* The spine + stations. Three spine variants, one shown per layout
            regime (globals.css): horizontal staircase (four-across), two
            stepped segments (two-by-two), and a vertical run (<900). Each is
            one continuous <path>. The track collapses (display: contents) at
            >=900 so its children position against the stage. */}
        <div className="skills-track">
          <svg
            aria-hidden="true"
            className="skills-spine skills-spine--h"
            viewBox="0 0 100 300"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0 L25 0 L25 100 L50 100 L50 200 L75 200 L75 300 L100 300"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinejoin="miter"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <svg
            aria-hidden="true"
            className="skills-spine skills-spine--seg skills-spine--seg-a"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0 L50 0 L50 100 L100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinejoin="miter"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <svg
            aria-hidden="true"
            className="skills-spine skills-spine--seg skills-spine--seg-b"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0 0 L50 0 L50 100 L100 100"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinejoin="miter"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <span aria-hidden="true" className="skills-spine skills-spine--v" />

          {STATIONS.map((station, i) => (
            <StationBlock key={station.num} station={station} index={i} />
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
