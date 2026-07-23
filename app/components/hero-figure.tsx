import { generateWalk, walkToPath } from "@/app/lib/random-walk";

const PARAMS = { seed: 7231, steps: 480, drift: 0.0006, vol: 0.018 };
const WIDTH = 600;
const HEIGHT = 380;
const PADDING = 24;

export default function HeroFigure() {
  const values = generateWalk(PARAMS);
  const path = walkToPath(values, WIDTH, HEIGHT, PADDING);
  const baselineY = HEIGHT / 2;

  return (
    <figure className="flex w-full flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Static rendering of a seeded geometric Brownian random walk: ${PARAMS.steps} steps, seed ${PARAMS.seed}`}
        className="h-[240px] w-full md:h-auto"
      >
        <line
          x1={0}
          y1={baselineY}
          x2={WIDTH}
          y2={baselineY}
          stroke="#1A1815"
          strokeOpacity={0.55}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          fill="none"
          stroke="#22384F"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <figcaption className="font-mono text-mono-label-sm uppercase text-label sm:text-mono-label">
        fig. 01 — geometric brownian walk · n={PARAMS.steps} · seed={PARAMS.seed} ·
        μ={PARAMS.drift} · σ={PARAMS.vol}
      </figcaption>
    </figure>
  );
}
