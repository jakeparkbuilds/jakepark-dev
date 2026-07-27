import SectionShell from "./section-shell";

// A pipeline, not a list: data in → interface out, read along one spine (see
// docs/motion-spec.md § 05). Every tool here is backed by one line of real
// evidence from the résumé — 17 tools across the four stations, verbatim.
// Nothing is padded to make the stations look even.
type Station = {
  num: string;
  name: string;
  tools: string[];
  evidence: string;
};

const STATIONS: Station[] = [
  {
    num: "01",
    name: "data",
    tools: ["python", "pandas", "numpy", "sql", "postgresql"],
    evidence: "2m+ apc records spatially joined to census tracts",
  },
  {
    num: "02",
    name: "models",
    tools: ["pytorch", "scikit-learn", "xgboost", "hugging face"],
    evidence: "86% cross-validated r² forecasting transit ridership",
  },
  {
    num: "03",
    name: "systems",
    tools: ["aws", "docker", "terraform", "fastapi"],
    evidence: "serverless monte carlo simulator, 43× hot-path speedup",
  },
  {
    num: "04",
    name: "interface",
    tools: ["typescript", "react", "next.js", "shap"],
    evidence: "live explainable forecasts across 16k congressional bills",
  },
];

// The honest home for everything real but not central to a station. Stays
// quiet on purpose — a single middot-separated mono line, allowed to wrap.
const ALSO = "java · c++ · r · express · flask · tensorflow · seaborn · git · ci/cd";

function StationBlock({
  station,
  first,
  last,
}: {
  station: Station;
  first: boolean;
  last: boolean;
}) {
  return (
    <div className="skill-station">
      {/* Pure decoration: the spine segment + tick for this station, plus the
          IN / OUT cap on the first / last one. */}
      <div aria-hidden="true" className="skill-rail">
        <span className="skill-tick" />
        {first && (
          <span className="skill-cap skill-in font-mono text-mono-micro uppercase text-label">
            in
          </span>
        )}
        {last && (
          <span className="skill-cap skill-out font-mono text-mono-micro uppercase text-label">
            out
          </span>
        )}
      </div>

      <div className="skill-body">
        <p className="font-mono text-mono-micro uppercase text-label">{station.num}</p>
        <p className="mt-[10px] font-display text-[28px] font-medium leading-[1.05] text-ink">
          {station.name}
        </p>
        <ul className="mt-[14px] font-mono text-[13px] leading-[1.9] text-body">
          {station.tools.map((tool) => (
            <li key={tool}>{tool}</li>
          ))}
        </ul>
        <p className="mt-[20px] max-w-[190px] font-display text-[15px] leading-[1.45] text-label">
          {station.evidence}
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
      <div className="skill-stations">
        {STATIONS.map((station, i) => (
          <StationBlock
            key={station.num}
            station={station}
            first={i === 0}
            last={i === STATIONS.length - 1}
          />
        ))}
      </div>

      {/* ALSO: everything real but not central. ~72px below the stations,
          under its own muted hairline; the label sits in the left annotation
          gutter, matching the about section. */}
      <div className="mt-[72px] border-t-[0.5px] border-muted pt-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:gap-6">
          <p className="w-[130px] shrink-0 font-mono text-mono-micro uppercase text-label">
            also
          </p>
          <p className="max-w-[720px] font-mono text-[13px] leading-[1.9] text-label">
            {ALSO}
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
