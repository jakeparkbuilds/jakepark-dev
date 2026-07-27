import SectionShell from "./section-shell";

// § 05 skills — a compact technical plate. The pipeline is a shallow stepped
// hairline descending left→right; each station hangs below its own run on a
// downward tick. A staircase, not a table. The spine is one continuous SVG
// <path>; the layout math lives in globals.css (.skills-*), where
// percentage-X / pixel-Y keeps the path touching every tick at every width
// without any client JS. See docs/motion-spec.md § 05.
type Station = {
  num: string;
  domain: string;
  primary: string;
  supporting: string;
};

const STATIONS: Station[] = [
  {
    num: "01",
    domain: "data",
    primary: "python",
    supporting: "pandas · numpy · sql · postgresql",
  },
  {
    num: "02",
    domain: "models",
    primary: "pytorch",
    supporting: "scikit-learn · xgboost · hugging face",
  },
  {
    num: "03",
    domain: "systems",
    primary: "aws",
    supporting: "docker · terraform · fastapi",
  },
  {
    num: "04",
    domain: "interface",
    primary: "next.js",
    supporting: "typescript · react · shap",
  },
];

// Everything real but not central to a station. Hangs quietly in the negative
// space the staircase opens up — one mono line, allowed to wrap.
const ADDITIONAL =
  "java · c++ · r · express · flask · tensorflow · seaborn · git · ci/cd";

function StationBlock({ station, index }: { station: Station; index: number }) {
  return (
    <div className={`skills-station skills-station--${index + 1}`} data-station={station.num}>
      {/* the tick — the 0.5px stroke that attaches this station to the spine */}
      <span aria-hidden="true" className="skills-tick" />

      <p className="skills-index font-mono text-mono-micro uppercase text-label">
        {station.num}
      </p>
      <p className="skills-domain font-display font-medium text-ink">{station.domain}</p>

      {/* primary tool + supporting list — reserved a fixed height so all four
          stations bottom out at the same offset from their own spine run. */}
      <div className="skills-lead">
        <p className="skills-primary font-display text-body">{station.primary}</p>
        <p className="skills-support font-mono text-label">{station.supporting}</p>
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
      <div className="skills-stage" data-spine="pipeline">
        {/* The spine + stations. Three spine variants, one shown per layout
            regime (globals.css): horizontal staircase (>=1024), two stepped
            segments (900–1024), and a vertical run (<900). Each is one
            continuous <path>. The track collapses (display: contents) at >=900
            so its children position against the stage. */}
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

          <span className="skills-terminal skills-terminal--raw font-mono text-mono-micro uppercase text-label">
            raw
          </span>
          <span className="skills-terminal skills-terminal--shipped font-mono text-mono-micro uppercase text-label">
            shipped
          </span>

          {STATIONS.map((station, i) => (
            <StationBlock key={station.num} station={station} index={i} />
          ))}
        </div>

        {/* additional — an annotation hanging from the plate, not a band below
            it. One tick ties it to the staircase; no rules, no box. */}
        <div className="skills-additional">
          <span aria-hidden="true" className="skills-add-tick" />
          <p className="skills-add-label font-mono text-[12px] font-medium uppercase leading-none tracking-[0.22em] text-label">
            additional
          </p>
          <p className="skills-add-list font-mono text-[12px] leading-[1.7] text-label">
            {ADDITIONAL}
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
