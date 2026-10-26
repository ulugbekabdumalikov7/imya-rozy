/** Следы вдоль маршрута: отпечатки ставятся по той же кривой, что и прежние линии, — геометрия маршрута не меняется. */

export interface Pt { x: number; y: number }

export interface Footprint {
  x: number;
  y: number;
  /** Направление шага, градусы (0 — вправо, по часовой стрелке, как в SVG). */
  angle: number;
  /** Левая или правая нога: правый отпечаток зеркален и смещён вправо от оси пути. */
  side: 'l' | 'r';
  /** Доля пройденного пути на этом отрезке (0…1) — для очерёдности появления. */
  at: number;
}

/** Контрольная точка квадратичной кривой отрезка (тот же лёгкий изгиб, что был у линий маршрута). */
export function bend(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2 + (b.y - a.y) * 0.12, y: (a.y + b.y) / 2 - (b.x - a.x) * 0.12 };
}

const quad = (a: Pt, c: Pt, b: Pt, t: number): Pt => {
  const u = 1 - t;
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y };
};

/**
 * Расставляет отпечатки по кривой a→b с шагом `stride` (длина по дуге) и смещением `gait` от оси.
 * Отступ `margin` от концов оставляет место для кружков эпизодов. `startSide` продолжает чередование ног с прошлого отрезка.
 */
export function footprints(a: Pt, b: Pt, stride: number, gait: number, margin: number, startSide: 'l' | 'r' = 'l'): Footprint[] {
  const c = bend(a, b);
  // Таблица длины дуги: квадратичная кривая короткая, 64 отрезков хватает с запасом.
  const N = 64;
  const pts: Pt[] = [];
  const len: number[] = [0];
  for (let i = 0; i <= N; i++) pts.push(quad(a, c, b, i / N));
  for (let i = 1; i <= N; i++) len.push(len[i - 1]! + Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y));
  const total = len[N]!;
  const usable = total - 2 * margin;
  if (usable < stride * 0.5) return [];

  const count = Math.max(1, Math.round(usable / stride));
  const step = usable / count;
  const out: Footprint[] = [];
  let side = startSide;
  let j = 1;
  for (let k = 0; k <= count; k++) {
    const s = margin + k * step;
    while (j < N && len[j]! < s) j++;
    const seg = len[j]! - len[j - 1]! || 1;
    const f = (s - len[j - 1]!) / seg;
    const p0 = pts[j - 1]!;
    const p1 = pts[j]!;
    const x = p0.x + (p1.x - p0.x) * f;
    const y = p0.y + (p1.y - p0.y) * f;
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const d = Math.hypot(dx, dy) || 1;
    // нормаль влево от направления движения (в SVG ось y смотрит вниз)
    const nx = dy / d;
    const ny = -dx / d;
    const o = side === 'l' ? gait : -gait;
    out.push({ x: x + nx * o, y: y + ny * o, angle: (Math.atan2(dy, dx) * 180) / Math.PI, side, at: s / total });
    side = side === 'l' ? 'r' : 'l';
  }
  return out;
}

/**
 * Отпечаток левой ступни в единицах «1 = экранный пиксель», носок смотрит вправо (+x).
 * Подушечка, пятка и большой палец с внутренней (правой для левой ноги) стороны; правая нога — зеркально.
 */
export const FOOT_PATH = [
  'M-0.6,0.1 a2,1.3 0 1,0 4,0 a2,1.3 0 1,0 -4,0 Z', // подушечка
  'M-4.1,0.25 a1.2,1 0 1,0 2.4,0 a1.2,1 0 1,0 -2.4,0 Z', // пятка
  'M3.55,0.85 a0.55,0.5 0 1,0 1.1,0 a0.55,0.5 0 1,0 -1.1,0 Z', // большой палец
].join(' ');
