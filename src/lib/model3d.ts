/**
 * Маленький движок архитектурного макета: ортографическая камера, грани зданий, свет и тени.
 * Рисуется в SVG (без WebGL): граней — сотни, а не миллионы, и обычные SVG-элементы остаются
 * кликабельными, доступными с клавиатуры и стилизуемыми CSS.
 *
 * Мир: x — на восток, y — на юг (как пиксели плана), z — вверх. Единица — пиксель исходного плана.
 */

export type V2 = [number, number];
export type V3 = [number, number, number];

export interface Camera {
  /** Поворот макета вокруг вертикали, градусы (0 — север плана сверху). */
  yaw: number;
  /** Наклон взгляда от вертикали, градусы (0 — вид строго сверху, как на плане). */
  tilt: number;
}

export interface Projector {
  cam: Camera;
  /** Масштаб «мир → координаты viewBox». */
  scale: number;
  /** Точка мира → точка viewBox. */
  pt: (x: number, y: number, z?: number) => V2;
  /** Глубина: чем больше, тем ближе к зрителю. */
  depth: (x: number, y: number, z?: number) => number;
  /** Направление на камеру в координатах мира (единичный вектор). */
  toCamera: V3;
  /** Матрица SVG для плоскости земли (z = 0): всё, что лежит на земле, рисуется в координатах мира. */
  ground: string;
}

const RAD = Math.PI / 180;

/**
 * Камера вписывает макет (основание board и вершины peaks) в viewBox W×H.
 * Вид сверху без поворота даёт тождественное преобразование — макет совпадает с исходным планом.
 */
export function makeProjector(
  cam: Camera,
  W: number,
  H: number,
  board: { x0: number; y0: number; x1: number; y1: number; depth: number },
  /** Самые высокие точки макета (вершины башен): они не должны выходить за кадр. */
  peaks: V3[] = [],
): Projector {
  const th = cam.yaw * RAD;
  const ph = cam.tilt * RAD;
  const c = Math.cos(th);
  const sn = Math.sin(th);
  const cp = Math.cos(ph);
  const sp = Math.sin(ph);
  const raw = (x: number, y: number, z: number): V2 => [x * c - y * sn, (x * sn + y * c) * cp - z * sp];

  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const x of [board.x0, board.x1])
    for (const y of [board.y0, board.y1])
      for (const z of [-board.depth, 0]) {
        const [u, v] = raw(x, y, z);
        x0 = Math.min(x0, u);
        x1 = Math.max(x1, u);
        y0 = Math.min(y0, v);
        y1 = Math.max(y1, v);
      }
  for (const [x, y, z] of peaks) {
    const [u, v] = raw(x, y, z);
    x0 = Math.min(x0, u);
    x1 = Math.max(x1, u);
    y0 = Math.min(y0, v);
    y1 = Math.max(y1, v);
  }
  const margin = 0.025 * sp; // вид сверху — без полей, ровно как план
  const scale = Math.min((W * (1 - 2 * margin)) / (x1 - x0), (H * (1 - 2 * margin)) / (y1 - y0));
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const ox = W / 2 - scale * mx;
  const oy = H / 2 - scale * my;
  const toCamera: V3 = [sp * sn, sp * c, cp];
  const r = (n: number) => Math.round(n * 1e6) / 1e6;
  return {
    cam,
    scale,
    pt: (x, y, z = 0) => {
      const [u, v] = raw(x, y, z);
      return [ox + scale * u, oy + scale * v];
    },
    depth: (x, y, z = 0) => x * toCamera[0] + y * toCamera[1] + z * toCamera[2],
    toCamera,
    ground: `matrix(${r(scale * c)} ${r(scale * cp * sn)} ${r(-scale * sn)} ${r(scale * cp * c)} ${r(ox)} ${r(oy)})`,
  };
}

// ───────────── векторы ─────────────

export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len2 = (a: V2, b: V2) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const lerp2 = (a: V2, b: V2, t: number): V2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const mid2 = (a: V2, b: V2) => lerp2(a, b, 0.5);
const at = (p: V2, z: number): V3 => [p[0], p[1], z];

export function centroid2(poly: V2[]): V2 {
  let x = 0;
  let y = 0;
  for (const p of poly) {
    x += p[0];
    y += p[1];
  }
  return [x / poly.length, y / poly.length];
}

export function centroid3(pts: V3[]): V3 {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
    z += p[2];
  }
  return [x / pts.length, y / pts.length, z / pts.length];
}

/** Нормаль многоугольника (метод Ньюэлла), единичная. */
export function normalOf(pts: V3[]): V3 {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

/** Выпуклая оболочка (монотонная цепь Эндрю). */
export function hull(points: V2[]): V2[] {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: V2, a: V2, b: V2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: V2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: V2[] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** Точка внутри многоугольника (чётно-нечётное правило). */
export function inside(p: V2, poly: V2[]): boolean {
  let r = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a[1] > p[1] !== b[1] > p[1] && p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]) r = !r;
  }
  return r;
}

// ───────────── материалы и свет ─────────────

export type Material = 'stone' | 'stoneDark' | 'plaster' | 'wood' | 'tile' | 'slate' | 'lead' | 'coping';
type RGB = [number, number, number];

/**
 * Чёрно-белый макет, как гипсовая архитектурная модель: стены светлые, кровли тёмные.
 * Материалы различаются только тоном; цвет на карте остаётся за знаками и выделением.
 */
export const MATERIALS: Record<Material, RGB> = {
  stone: [216, 215, 212],
  stoneDark: [182, 181, 178],
  plaster: [226, 225, 222],
  wood: [112, 111, 109],
  tile: [96, 95, 93],
  slate: [72, 71, 70],
  lead: [138, 137, 134],
  coping: [236, 235, 232],
};

/** Свет — тёплый, с северо-запада и сверху; привязан к макету, поэтому при повороте тени поворачиваются вместе с ним. */
export const LIGHT: V3 = (() => {
  const v: V3 = [-0.48, -0.56, 0.68];
  const l = Math.hypot(...v);
  return [v[0] / l, v[1] / l, v[2] / l];
})();
/** Смещение тени на земле на единицу высоты. */
export const SHADOW_STEP: V2 = [-LIGHT[0] / LIGHT[2], -LIGHT[1] / LIGHT[2]];

const AMBIENT = 0.6;
const DIFFUSE = 0.48;
/** Нейтральный свет: макет чёрно-белый. */
const WARM: RGB = [1, 1, 1];

export function shade(mat: Material, n: V3): string {
  const base = MATERIALS[mat];
  const lit = Math.max(0, dot(n, LIGHT));
  // небо слегка подсвечивает обращённое вверх, земля — отражённым светом снизу
  const sky = 0.06 * Math.max(0, n[2]);
  const out = base.map((ch, i) => Math.round(Math.min(255, ch * (AMBIENT + sky + DIFFUSE * lit * WARM[i]!))));
  return `rgb(${out[0]},${out[1]},${out[2]})`;
}

// ───────────── грани ─────────────

export interface Face {
  pts: V3[];
  mat: Material;
  kind: 'wall' | 'roof' | 'top';
  /** Проёмы на стене: окна, арки, двери. */
  openings?: V3[][];
  /** Ряды черепицы на скате: отрезки от карниза к коньку. */
  courses?: [V3, V3][];
  /** Тёмная полоса у основания стены — контактная тень. */
  foot?: V3[];
}

export type RoofSpec =
  | { type: 'gable'; rise: number; /** конёк вдоль ребра 0→1 (иначе — вдоль длинной стороны) */ along?: 0 | 1 }
  | { type: 'hip'; rise: number }
  | { type: 'pyramid'; rise: number; apex?: V2 }
  | { type: 'lean'; drop: number }
  | { type: 'flat' };

export interface WindowSpec {
  kind: 'slit' | 'arch' | 'arcade';
  /** Шаг между проёмами. */
  every: number;
  /** Высота низа проёма над землёй (доля высоты стены). */
  sill?: number;
  /** Высота проёма (доля высоты стены). */
  tall?: number;
  /** Ширина проёма. */
  w?: number;
  /** Сколько ярусов окон. */
  rows?: number;
}

export interface PartSpec {
  pts: V2[];
  /** Высота стен (до карниза). */
  h: number;
  roof: RoofSpec;
  wall?: Material;
  roofMat?: Material;
  windows?: WindowSpec;
  /** Рёбра без стены (стык с соседней частью здания). */
  hide?: number[];
  /** Рёбра с аркадой (галерея клуатра) — свои проёмы вместо окон. */
  arcade?: number[];
  /** Рёбра с дверью или порталом посередине. */
  doors?: number[];
  /** Высота низа части (для надстроек). */
  z0?: number;
}

/** Проёмы на стене между точками a и b: прямоугольные или с полукруглым верхом. */
function openingsAlong(a: V2, b: V2, z0: number, h: number, w: WindowSpec, arcade = false): V3[][] {
  const L = len2(a, b);
  const every = arcade ? Math.max(8, w.every) : w.every;
  const n = Math.floor(L / every);
  if (n < 1) return [];
  const width = arcade ? every * 0.62 : (w.w ?? (w.kind === 'slit' ? 2 : 3.4));
  const rows = arcade ? 1 : (w.rows ?? 1);
  const out: V3[][] = [];
  for (let r = 0; r < rows; r++) {
    const sill = arcade ? 0 : (w.sill ?? 0.38) + (r * 0.8) / (rows + 0.4);
    const tall = arcade ? 0.78 : (w.tall ?? (w.kind === 'slit' ? 0.22 : 0.34)) / (rows > 1 ? 1.4 : 1);
    const zb = z0 + h * sill;
    const zt = z0 + h * (sill + tall);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const half = width / 2 / L;
      const p = lerp2(a, b, t - half);
      const q = lerp2(a, b, t + half);
      const round = arcade || w.kind !== 'slit';
      if (!round) {
        out.push([at(p, zb), at(q, zb), at(q, zt), at(p, zt)]);
        continue;
      }
      // полукруглое завершение: радиус — половина ширины
      const rad = width / 2;
      const top = zt - rad;
      const arc: V3[] = [];
      for (let k = 0; k <= 6; k++) {
        const ang = (k / 6) * Math.PI;
        const m = lerp2(p, q, 0.5 - Math.cos(ang) / 2);
        arc.push(at(m, top + Math.sin(ang) * rad));
      }
      out.push([at(p, zb), at(q, zb), ...arc.reverse()]);
    }
  }
  return out;
}

/** Ряды черепицы: отрезки между двумя рёбрами ската. */
function coursesOn(e0: [V3, V3], e1: [V3, V3], step = 5.5): [V3, V3][] {
  const L = Math.hypot(e0[1][0] - e0[0][0], e0[1][1] - e0[0][1]);
  const n = Math.max(1, Math.floor(L / step));
  const out: [V3, V3][] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const p: V3 = [
      e0[0][0] + (e0[1][0] - e0[0][0]) * t,
      e0[0][1] + (e0[1][1] - e0[0][1]) * t,
      e0[0][2] + (e0[1][2] - e0[0][2]) * t,
    ];
    const q: V3 = [
      e1[0][0] + (e1[1][0] - e1[0][0]) * t,
      e1[0][1] + (e1[1][1] - e1[0][1]) * t,
      e1[0][2] + (e1[1][2] - e1[0][2]) * t,
    ];
    out.push([p, q]);
  }
  return out;
}

/**
 * Часть здания: стены по контуру и крыша. Возвращает грани в координатах мира;
 * какие из них видны и в каком порядке рисовать — решает камера.
 */
export function buildPart(spec: PartSpec, grow = 1): Face[] {
  const pts = spec.pts;
  const z0 = (spec.z0 ?? 0) * grow;
  const h = spec.h * grow;
  const wall = spec.wall ?? 'stone';
  const roofMat = spec.roofMat ?? 'tile';
  const faces: Face[] = [];
  const n = pts.length;
  const top = z0 + h;
  // высота верха стены в каждой вершине (для односкатной крыши — разная)
  const topZ = pts.map(() => top);
  // точки конька над рёбрами (фронтоны)
  const gableApex = new Map<number, V3>();
  const roofFaces: { pts: V3[]; courses?: [V3, V3][] }[] = [];

  const r = spec.roof;
  if ((r.type === 'gable' || r.type === 'hip') && n === 4) {
    const L01 = (len2(pts[0]!, pts[1]!) + len2(pts[2]!, pts[3]!)) / 2;
    const L12 = (len2(pts[1]!, pts[2]!) + len2(pts[3]!, pts[0]!)) / 2;
    const along01 = r.type === 'gable' && r.along !== undefined ? r.along === 0 : L01 >= L12;
    // a→b — ребро вдоль конька
    const k = along01 ? 0 : 1;
    const a = pts[k % 4]!;
    const b = pts[(k + 1) % 4]!;
    const c = pts[(k + 2) % 4]!;
    const d = pts[(k + 3) % 4]!;
    const rz = top + r.rise * grow;
    let r1 = mid2(d, a);
    let r2 = mid2(b, c);
    if (r.type === 'hip') {
      const short = Math.min(len2(b, c), len2(d, a));
      const long = len2(r1, r2);
      const inset = Math.min(short / 2, long / 2 - 0.01) / long;
      [r1, r2] = [lerp2(r1, r2, inset), lerp2(r1, r2, 1 - inset)];
    }
    const R1 = at(r1, rz);
    const R2 = at(r2, rz);
    const A = at(a, top);
    const B = at(b, top);
    const C = at(c, top);
    const D = at(d, top);
    roofFaces.push({ pts: [A, B, R2, R1], courses: coursesOn([A, B], [R1, R2]) });
    roofFaces.push({ pts: [C, D, R1, R2], courses: coursesOn([C, D], [R2, R1]) });
    if (r.type === 'hip') {
      roofFaces.push({ pts: [B, C, R2] });
      roofFaces.push({ pts: [D, A, R1] });
    } else {
      gableApex.set((k + 1) % 4, R2);
      gableApex.set((k + 3) % 4, R1);
    }
  } else if (r.type === 'pyramid' || r.type === 'hip' || r.type === 'gable') {
    const rise = 'rise' in r ? r.rise : 10;
    const apex2 = r.type === 'pyramid' && r.apex ? r.apex : centroid2(pts);
    const apex = at(apex2, top + rise * grow);
    for (let i = 0; i < n; i++) roofFaces.push({ pts: [at(pts[i]!, top), at(pts[(i + 1) % n]!, top), apex] });
  } else if (r.type === 'lean' && n === 4) {
    // высокое ребро 0→1, низкое 2→3
    const low = top - r.drop * grow;
    topZ[2] = low;
    topZ[3] = low;
    const P = pts.map((p, i) => at(p, topZ[i]!));
    roofFaces.push({ pts: P, courses: coursesOn([P[0]!, P[1]!], [P[3]!, P[2]!]) });
  } else {
    roofFaces.push({ pts: pts.map((p) => at(p, top)) });
  }

  for (let i = 0; i < n; i++) {
    if (spec.hide?.includes(i)) continue;
    const p = pts[i]!;
    const q = pts[(i + 1) % n]!;
    const zp = topZ[i]!;
    const zq = topZ[(i + 1) % n]!;
    const quad: V3[] = [at(p, z0), at(q, z0), at(q, zq)];
    const apex = gableApex.get(i);
    if (apex) quad.push(apex);
    quad.push(at(p, zp));
    const face: Face = { pts: quad, mat: wall, kind: 'wall' };
    const wallH = Math.min(zp, zq) - z0;
    if (wallH > 4) {
      const footH = Math.min(5, wallH * 0.3);
      face.foot = [at(p, z0), at(q, z0), at(q, z0 + footH), at(p, z0 + footH)];
    }
    if (grow > 0.98) {
      if (spec.arcade?.includes(i)) face.openings = openingsAlong(p, q, z0, wallH, { kind: 'arch', every: 11 }, true);
      else if (spec.windows) face.openings = openingsAlong(p, q, z0, wallH, spec.windows);
      if (spec.doors?.includes(i)) {
        const w = Math.min(9, len2(p, q) * 0.3);
        const door = openingsAlong(p, q, z0, wallH, {
          kind: 'arch',
          every: len2(p, q),
          w,
          sill: 0,
          tall: Math.min(0.62, 16 / wallH),
        });
        face.openings = [...(face.openings ?? []).filter((o) => !door.some((d) => near(o, d))), ...door];
      }
    }
    faces.push(face);
  }
  for (const rf of roofFaces) {
    const flat = rf.pts.every((p) => Math.abs(p[2] - rf.pts[0]![2]) < 1e-6);
    faces.push({
      pts: rf.pts,
      mat: roofMat,
      kind: flat ? 'top' : 'roof',
      courses: grow > 0.98 ? rf.courses : undefined,
    });
  }
  return faces;
}

const near = (a: V3[], b: V3[]) => {
  const ca = centroid3(a);
  const cb = centroid3(b);
  return Math.hypot(ca[0] - cb[0], ca[1] - cb[1]) < 8;
};

/** Многоугольник-круг (башня, печь, колодец). */
export function circle(c: V2, r: number, n = 18): V2[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r] as V2;
  });
}

/** Тень части здания на земле: оболочка основания и его копии, сдвинутой на высоту. */
export function shadowOf(pts: V2[], h: number): V2[] {
  const [sx, sy] = SHADOW_STEP;
  return hull([...pts, ...pts.map((p) => [p[0] + sx * h, p[1] + sy * h] as V2)]);
}

/** Видна ли грань камере (у вертикальных стен при виде сверху — нет). */
export function facesCamera(f: Face, toCamera: V3, orientedNormal: V3): boolean {
  return dot(orientedNormal, toCamera) > 1e-3 || (f.kind !== 'wall' && dot(orientedNormal, toCamera) > -1e-3);
}

/** Нормаль, повёрнутая наружу от центра части (или вверх для крыш). */
export function outwardNormal(f: Face, partCenter: V3): V3 {
  const n = normalOf(f.pts);
  if (f.kind !== 'wall') return n[2] < 0 ? [-n[0], -n[1], -n[2]] : n;
  const c = centroid3(f.pts);
  const away = sub(c, partCenter);
  return dot(n, [away[0], away[1], 0]) < 0 ? [-n[0], -n[1], -n[2]] : n;
}
