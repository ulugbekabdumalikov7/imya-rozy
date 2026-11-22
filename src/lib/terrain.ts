import type { V2, V3 } from './model3d';

/**
 * Скальный склон между бровкой (z = 0) и подошвой (z = −drop): лента неровных треугольных граней.
 * Обе линии пересчитываются в одинаковое число точек по длине, между ними — промежуточные ряды
 * с разбросом по высоте и в плане: так склон выглядит каменистым, а не гладким.
 */

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Ломаная → n точек на равном расстоянии вдоль неё. */
export function resample(line: V2[], n: number): V2[] {
  const seg = line.slice(1).map((p, i) => Math.hypot(p[0] - line[i]![0], p[1] - line[i]![1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const out: V2[] = [];
  for (let k = 0; k < n; k++) {
    let d = (total * k) / (n - 1);
    let i = 0;
    while (i < seg.length - 1 && d > seg[i]!) {
      d -= seg[i]!;
      i++;
    }
    const t = seg[i]! ? Math.min(1, d / seg[i]!) : 0;
    const a = line[i]!;
    const b = line[i + 1]!;
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

export interface Slope {
  /** Треугольники склона в координатах мира. */
  tris: V3[][];
}

export function buildSlope(
  rim: V2[],
  foot: V2[],
  drop: number,
  opts: { columns?: number; rows?: number; seed?: number } = {},
): Slope {
  const n = opts.columns ?? 44;
  const rows = opts.rows ?? 4;
  const rnd = seeded(opts.seed ?? 97);
  const top = resample(rim, n);
  const bottom = resample(foot, n);
  // ряды от бровки к подошве; склон круче у бровки (скала), положе внизу (осыпь)
  const grid: V3[][] = [];
  for (let r = 0; r <= rows; r++) {
    const t = r / rows;
    const fall = Math.pow(t, 0.62);
    grid.push(
      top.map((p, i) => {
        const q = bottom[i]!;
        const inner = r > 0 && r < rows && i > 0 && i < n - 1;
        const jx = inner ? (rnd() - 0.5) * 7 : 0;
        const jy = inner ? (rnd() - 0.5) * 7 : 0;
        const jz = inner ? (rnd() - 0.5) * drop * 0.16 : 0;
        return [p[0] + (q[0] - p[0]) * t + jx, p[1] + (q[1] - p[1]) * t + jy, -drop * fall + jz];
      }),
    );
  }
  const tris: V3[][] = [];
  for (let r = 0; r < rows; r++)
    for (let i = 0; i < n - 1; i++) {
      const a = grid[r]![i]!;
      const b = grid[r]![i + 1]!;
      const c = grid[r + 1]![i + 1]!;
      const d = grid[r + 1]![i]!;
      // диагональ чередуется — грани не складываются в однообразную «ёлочку»
      if ((i + r) % 2) tris.push([a, b, c], [a, c, d]);
      else tris.push([a, b, d], [b, c, d]);
    }
  return { tris };
}

/** Валуны у подошвы обрыва: неровные пирамидки, грани — как у склона. */
export function boulders(
  foot: V2[],
  inside: (p: V2) => boolean,
  z: number,
  opts: { count?: number; seed?: number } = {},
): V3[][] {
  const rnd = seeded(opts.seed ?? 211);
  const line = resample(foot, 60);
  const out: V3[][] = [];
  let tries = 0;
  while (out.length < (opts.count ?? 26) * 5 && tries++ < 400) {
    const i = 1 + Math.floor(rnd() * (line.length - 2));
    const a = line[i - 1]!;
    const b = line[i + 1]!;
    // от подошвы — в сторону низины (перпендикуляр к линии подошвы)
    const nx = -(b[1] - a[1]);
    const ny = b[0] - a[0];
    const l = Math.hypot(nx, ny) || 1;
    const away = 6 + rnd() * 46;
    const c: V2 = [
      line[i]![0] + (nx / l) * away * (rnd() > 0.5 ? 1 : -1),
      line[i]![1] + (ny / l) * away * (rnd() > 0.5 ? 1 : -1),
    ];
    if (!inside(c)) continue;
    const r = 3 + rnd() * 6;
    const h = r * (0.9 + rnd() * 0.9);
    const sides = 5;
    const base: V3[] = Array.from({ length: sides }, (_, k) => {
      const ang = (k / sides) * Math.PI * 2 + rnd() * 0.6;
      const rr = r * (0.7 + rnd() * 0.5);
      return [c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr, z];
    });
    const apex: V3 = [c[0] + (rnd() - 0.5) * r * 0.6, c[1] + (rnd() - 0.5) * r * 0.6, z + h];
    for (let k = 0; k < sides; k++) out.push([base[k]!, base[(k + 1) % sides]!, apex]);
  }
  return out;
}
