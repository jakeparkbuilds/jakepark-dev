import { DC_NEIGHBORHOODS, DC_OUTLINE } from "./dc-paths";

export default function HeroFigure() {
  return (
    <figure className="flex w-full flex-col items-center gap-3">
      <svg
        viewBox="0 0 400 400"
        role="img"
        aria-label="Map of Washington, D.C. showing its 46 neighborhood clusters within the district boundary"
        className="w-[60%] min-w-[160px]"
      >
        {DC_NEIGHBORHOODS.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#1A1815"
            strokeOpacity={0.28}
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path
          d={DC_OUTLINE}
          fill="none"
          stroke="#1A1815"
          strokeOpacity={0.6}
          strokeWidth={0.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="font-mono text-mono-label-sm uppercase text-label sm:text-mono-label">
        fig. 01 — district of columbia · 46 neighborhood clusters
      </figcaption>
    </figure>
  );
}
