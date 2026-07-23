// Deterministic (seeded) generator so the server-rendered SVG is stable
// across requests and never mismatches during hydration.

function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand: () => number) {
  const u1 = Math.max(rand(), 1e-12);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export type WalkParams = {
  seed: number;
  steps: number;
  drift: number;
  vol: number;
};

export function generateWalk({ seed, steps, drift, vol }: WalkParams): number[] {
  const rand = mulberry32(seed);
  const values = [1];
  let value = 1;
  for (let i = 0; i < steps; i++) {
    const z = gaussian(rand);
    value *= Math.exp(drift - 0.5 * vol * vol + vol * z);
    values.push(value);
  }
  return values;
}

export function walkToPath(
  values: number[],
  width: number,
  height: number,
  padding: number
): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const usableHeight = height - padding * 2;

  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = padding + usableHeight - ((v - min) / range) * usableHeight;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}
