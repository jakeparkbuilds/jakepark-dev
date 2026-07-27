import SectionShell from "./section-shell";

// § 05 skills — a technical plate. The pipeline is drawn as a STEPPED hairline
// that descends left→right in four runs; each station hangs BELOW its own run,
// attached by a tick that points down into the content. A staircase, not a
// table — nothing here is centered or evenly weighted. The spine is one
// continuous SVG <path>; the layout math lives in globals.css (.skills-*),
// where percentage-X / pixel-Y keeps the path touching every tick at every
// width without any client JS. See docs/motion-spec.md § 05.
type Station = {
  num: string;
  domain: string;
  primary: string;
  supporting: string;
  figure: string;
  caption: string;
};

const STATIONS: Station[] = [
  {
    num: "01",
    domain: "data",
    primary: "python",
    supporting: "pandas · numpy · sql · postgresql",
    figure: "2M+",
    caption: "apc records joined to census tracts",
  },
  {
    num: "02",
    domain: "models",
    primary: "pytorch",
    supporting: "scikit-learn · xgboost · hugging face",
    figure: "0.86",
    caption: "cross-validated r², transit ridership",
  },
  {
    num: "03",
    domain: "systems",
    primary: "aws",
    supporting: "docker · terraform · fastapi",
    figure: "43×",
    caption: "hot-path speedup, serverless monte carlo",
  },
  {
    num: "04",
    domain: "interface",
    primary: "next.js",
    supporting: "typescript · react · shap",
    figure: "16K",
    caption: "bills scored, live explainable forecasts",
  },
];

// Everything real but not central to a station. Stays quiet — one mono line.
const ADJACENT =
  "java · c++ · r · express · flask · tensorflow · seaborn · git · ci/cd";

// Engineering-drawing title block: label/value pairs, rendered as a grid whose
// cells are defined ENTIRELY by shared hairlines (see globals.css .skills-tblock).
const TITLE_BLOCK: { label: string; value: string }[] = [
  { label: "plate", value: "05" },
  { label: "domains", value: "04" },
  { label: "primary", value: "17" },
  { label: "adjacent", value: "09" },
  { label: "revised", value: "07.2026" },
  { label: "scale", value: "1:1" },
];

function StationBlock({ station, index }: { station: Station; index: number }) {
  return (
    <div className={`skills-station skills-station--${index + 1}`} data-station={station.num}>
      {/* the tick — the 0.5px stroke that attaches this station to the spine */}
      <span aria-hidden="true" className="skills-tick" />

      <p className="skills-index font-mono text-mono-micro uppercase text-label">
        {station.num}
      </p>
      <p className="skills-domain font-display font-medium text-ink">{station.domain}</p>

      {/* [3] primary + [4] supporting share a fixed-height block so the rule,
          figure, and caption below sit at identical offsets across all four. */}
      <div className="skills-lead">
        <p className="skills-primary font-display text-body">{station.primary}</p>
        <p className="skills-support font-mono text-label">{station.supporting}</p>
      </div>

      <div aria-hidden="true" className="skills-rule" />
      <p className="skills-figure font-mono font-medium text-ink">{station.figure}</p>
      <p className="skills-caption font-mono text-mono-micro uppercase text-label">
        {station.caption}
      </p>
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
        {/* The spine. Three variants, one shown per layout regime (globals.css):
            horizontal staircase (>=1024), two stepped segments (900–1024), and
            a vertical run (<900). Each is one continuous <path>. */}
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

      {/* Bottom band: full-width ink hairline, then the adjacent list and the
          engineering title block. */}
      <div className="skills-band border-t-[0.5px] border-ink">
        <div className="skills-adjacent">
          <p className="w-[130px] shrink-0 font-mono text-mono-micro uppercase text-label">
            adjacent
          </p>
          <p className="max-w-[560px] font-mono text-[12px] leading-[1.9] text-label">
            {ADJACENT}
          </p>
        </div>

        <div className="skills-tblock">
          {TITLE_BLOCK.map((cell) => (
            <div key={cell.label} className="skills-cell">
              <p className="font-mono text-[10px] uppercase leading-none tracking-[0.2em] text-label">
                {cell.label}
              </p>
              <p className="skills-cell-value font-mono text-[18px] font-medium text-ink">
                {cell.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
