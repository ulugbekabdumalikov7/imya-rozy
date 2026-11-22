import { type ReactNode, useMemo } from 'react';

import abbeyInkUrl from '../../assets/abbey-plan-ink.webp';
import { plans } from '../../data';
import { AVENUE, BOARD, BUILDINGS, ENCLOSURE, INTERIOR, TREE_AREAS, WALL } from '../../data/abbeyModel';
import type { PlanHotspot } from '../../data/plans';
import {
  buildPart,
  centroid2,
  centroid3,
  dot,
  type Face,
  facesCamera,
  inside,
  LIGHT,
  normalOf,
  outwardNormal,
  type Projector,
  shade,
  SHADOW_STEP,
  shadowOf,
  type V2,
  type V3,
} from '../../lib/model3d';

/** Свойства интерактивной зоны (кнопка, подпись, обработчики) — те же, что у зон плоского плана. */
export type SpotProps = (h: PlanHotspot) => SpotAttrs;
interface SpotAttrs {
  [attr: string]: unknown;
  className: string;
}

interface Props {
  proj: Projector;
  hotspots: PlanHotspot[];
  spotProps: SpotProps;
  selectedId?: string;
  /** «Контуры зон»: обводка всех зон на земле. */
  outlines: boolean;
  /** Насколько ярко напечатан исходный план на основании макета. */
  printOpacity: number;
  /** Рост зданий при первом показе: 0 — только план, 1 — макет целиком. */
  grow: number;
  /** Мелкие детали (окна, черепица) — не во время движения камеры. */
  detail: boolean;
}

const W = BOARD.x1 - BOARD.x0;
const H = BOARD.y1 - BOARD.y0;
/** Размер исходного плана: он целиком отпечатан на основании. */
const PLAN_W = plans.abbey.width;
const PLAN_H = plans.abbey.height;

const path = (pts: V2[]) => `M${pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join('L')}Z`;
const r1 = (n: number) => Math.round(n * 10) / 10;
const poly = (pts: V2[]) => pts.map((p) => `${r1(p[0])},${r1(p[1])}`).join(' ');

/** Детерминированный «случайный» разброс: деревья стоят на одних и тех же местах. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Точки сетки с разбросом внутри многоугольника (деревья в саду, кресты на кладбище). */
function scatter(pts: V2[], step: number, seed: number, jitter = 0.35): V2[] {
  const rnd = seeded(seed);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const out: V2[] = [];
  for (let y = Math.min(...ys) + step / 2; y < Math.max(...ys); y += step)
    for (let x = Math.min(...xs) + step / 2; x < Math.max(...xs); x += step) {
      const q: V2 = [x + (rnd() - 0.5) * step * jitter * 2, y + (rnd() - 0.5) * step * jitter * 2];
      if (inside(q, pts)) out.push(q);
    }
  return out;
}

/** Стена ограды, нарезанная на короткие звенья: так звенья правильно перекрываются со зданиями. */
function wallSegments(): V2[][] {
  const out: V2[][] = [];
  for (const line of ENCLOSURE)
    for (let i = 0; i + 1 < line.length; i++) {
      const a = line[i]!;
      const b = line[i + 1]!;
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(1, Math.ceil(L / 46));
      const nx = (-(b[1] - a[1]) / L) * (WALL.thick / 2);
      const ny = ((b[0] - a[0]) / L) * (WALL.thick / 2);
      for (let k = 0; k < n; k++) {
        const p: V2 = [a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n];
        const q: V2 = [a[0] + ((b[0] - a[0]) * (k + 1)) / n, a[1] + ((b[1] - a[1]) * (k + 1)) / n];
        out.push([
          [p[0] + nx, p[1] + ny],
          [q[0] + nx, q[1] + ny],
          [q[0] - nx, q[1] - ny],
          [p[0] - nx, p[1] - ny],
        ]);
      }
    }
  return out;
}
const WALL_SEGMENTS = wallSegments();

interface Tree {
  at: V2;
  r: number;
  h: number;
}

/** Деревья — один раз: по контурам садов из плана и аллея от ворот. */
function makeTrees(hotspots: PlanHotspot[]): Tree[] {
  const out: Tree[] = [];
  const rnd = seeded(7);
  for (const id of TREE_AREAS) {
    const h = hotspots.find((x) => x.id === `ab-${id}`);
    if (!h) continue;
    for (const at of scatter(h.poly, id === 'orchard' ? 25 : 23, id.length * 31))
      out.push({ at, r: 8 + rnd() * 3, h: 14 + rnd() * 5 });
  }
  for (const at of AVENUE) out.push({ at, r: 8.5, h: 16 });
  return out;
}

/** Грань, готовая к показу: нормаль, центр и цвет не зависят от камеры — считаются один раз. */
interface ReadyFace {
  f: Face;
  n: V3;
  c: V3;
  fill: string;
  /** Проём в грани (колодец Эдифиция в кровле корпуса). */
  hole?: V3[];
}

const ready = (f: Face, center: V3, hole?: V3[]): ReadyFace => {
  const n = outwardNormal(f, center);
  return { f, n, c: centroid3(f.pts), fill: shade(f.mat, n), hole };
};

interface SceneBuilding {
  h: PlanHotspot;
  faces: ReadyFace[];
  /** Внутренние стены двора-колодца (смотрят внутрь) и его дно. */
  court?: { floor: V3[]; walls: ReadyFace[] };
  c: V2;
  midZ: number;
}

/**
 * Всё, что не зависит от камеры: грани зданий и стены, тени, контактное затенение.
 * Пересчитывается только при росте зданий (первый показ), а не при каждом повороте.
 */
function buildScene(buildings: PlanHotspot[], trees: Tree[], grow: number) {
  const shadows: V2[][] = [];
  const footprints: V2[][] = [];
  const out: SceneBuilding[] = buildings.map((h, bi) => {
    const model = BUILDINGS[h.id.replace(/^ab-/, '')]!;
    // при первом показе здания вырастают по очереди
    const g = Math.max(0, Math.min(1, grow * 1.6 - (bi / buildings.length) * 0.6));
    const faces: ReadyFace[] = [];
    let maxH = 0;
    const court = model.court?.kind === 'well' && g > 0.02 ? model.court : undefined;
    model.parts.forEach((part, pi) => {
      const c2 = centroid2(part.pts);
      const center: V3 = [c2[0], c2[1], ((part.z0 ?? 0) + part.h / 2) * g];
      for (const f of buildPart(part, g)) {
        const hole =
          court && pi === 0 && f.kind === 'top' ? court.pts.map((p) => [p[0], p[1], court.h * g] as V3) : undefined;
        faces.push(ready(f, center, hole));
      }
      const rise = 'rise' in part.roof ? part.roof.rise : 0;
      if (g > 0.02) shadows.push(shadowOf(part.pts, (part.h + rise * 0.55) * g));
      footprints.push(part.pts);
      maxH = Math.max(maxH, part.h);
    });
    let courtData: SceneBuilding['court'];
    if (court) {
      const cc = centroid2(court.pts);
      const walls = court.pts.map((p, i) => {
        const q = court.pts[(i + 1) % court.pts.length]!;
        const f: Face = {
          pts: [
            [p[0], p[1], 0],
            [q[0], q[1], 0],
            [q[0], q[1], court.h * g],
            [p[0], p[1], court.h * g],
          ],
          mat: 'stoneDark',
          kind: 'wall',
        };
        let n = normalOf(f.pts);
        const mid = centroid3(f.pts);
        if (dot(n, [cc[0] - mid[0], cc[1] - mid[1], 0]) < 0) n = [-n[0], -n[1], -n[2]];
        return { f, n, c: mid, fill: shade('stoneDark', n) };
      });
      courtData = { floor: court.pts.map((p) => [p[0], p[1], 0] as V3), walls };
    }
    return { h, faces, court: courtData, c: centroid2(h.poly), midZ: (maxH * g) / 2 };
  });

  const wg = Math.min(1, grow * 1.4);
  const walls =
    grow > 0.02
      ? WALL_SEGMENTS.map((seg) => {
          const c = centroid2(seg);
          const center: V3 = [c[0], c[1], (WALL.h * wg) / 2];
          shadows.push(shadowOf(seg, WALL.h * wg));
          const faces = buildPart(
            { pts: seg, h: WALL.h, roof: { type: 'flat' }, wall: 'stoneDark', roofMat: 'coping' },
            wg,
          );
          return { c, midZ: center[2], faces: faces.map((f) => ready(f, center)) };
        })
      : [];

  const tg = Math.max(0, Math.min(1, grow * 1.5 - 0.4));
  if (tg > 0.02) for (const t of trees) shadows.push(circleShadow(t.at, t.r * tg, t.h * tg));

  return {
    buildings: out,
    walls,
    tg,
    shadowPath: shadows.map(path).join(''),
    aoPath: footprints.map(path).join(''),
  };
}

interface Drawable {
  depth: number;
  node: ReactNode;
}

/**
 * Объёмный макет аббатства: подставка, земля с отпечатанным планом, тени, здания, стена, деревья.
 * Здания и открытые зоны остаются теми же интерактивными зонами плана (data-spot, роль кнопки, подписи).
 */
export function AbbeyModel({ proj, hotspots, spotProps, selectedId, outlines, printOpacity, grow, detail }: Props) {
  const trees = useMemo(() => makeTrees(hotspots), [hotspots]);
  const crosses = useMemo(() => {
    const c = hotspots.find((x) => x.id === 'ab-cemetery');
    return c ? scatter(c.poly, 15, 11, 0.25) : [];
  }, [hotspots]);
  const ground = hotspots.filter((h) => !BUILDINGS[h.id.replace(/^ab-/, '')]);
  const P = proj.pt;
  const selectedGround = ground.find((h) => h.id === selectedId);
  const cam = proj.toCamera;

  const buildings = useMemo(() => hotspots.filter((h) => BUILDINGS[h.id.replace(/^ab-/, '')]), [hotspots]);
  const scene = useMemo(() => buildScene(buildings, trees, grow), [buildings, trees, grow]);
  const pp = (p: V3) => P(p[0], p[1], p[2]);

  /** Грани объекта: видимые камере, от дальних к ближним. */
  const renderFaces = (faces: ReadyFace[]) =>
    faces
      .filter(({ f, n }) => facesCamera(f, cam, n))
      .sort((a, b) => dot(a.c, cam) - dot(b.c, cam))
      .map(({ f, fill, hole }, i) => {
        const pts2 = f.pts.map(pp);
        return (
          <g key={i}>
            {hole ? (
              <path
                d={path(pts2) + path(hole.map(pp))}
                fillRule="evenodd"
                fill={fill}
                className={`face face-${f.kind}`}
              />
            ) : (
              <polygon points={poly(pts2)} fill={fill} className={`face face-${f.kind}`} />
            )}
            {f.foot && <polygon points={poly(f.foot.map(pp))} className="face-foot" />}
            {detail && f.openings && f.openings.length > 0 && (
              <path className="face-openings" d={f.openings.map((o) => path(o.map(pp))).join('')} />
            )}
            {detail && f.courses && f.courses.length > 0 && (
              <path
                className="face-courses"
                d={f.courses
                  .map(([a, b]) => {
                    const pa = pp(a);
                    const pb = pp(b);
                    return `M${r1(pa[0])} ${r1(pa[1])}L${r1(pb[0])} ${r1(pb[1])}`;
                  })
                  .join('')}
              />
            )}
          </g>
        );
      });

  const items: Drawable[] = [];
  /** Выбранное здание поверх затемнения — копия без обработчиков (кнопкой остаётся оригинал). */
  let lifted: ReactNode = null;

  // ── здания ──
  for (const b of scene.buildings) {
    const isSel = selectedId === b.h.id;
    const sp = spotProps(b.h);
    // двор-колодец рисуется первым: его закрывают стены и кровля
    const courtNodes = b.court && (
      <>
        <polygon points={poly(b.court.floor.map(pp))} className="court-floor" />
        {b.court.walls
          .filter((w) => dot(w.n, cam) > 1e-3)
          .sort((x, y) => dot(x.c, cam) - dot(y.c, cam))
          .map((w, i) => (
            <polygon key={i} points={poly(w.f.pts.map(pp))} fill={w.fill} className="face face-wall" />
          ))}
      </>
    );
    const facesNodes = renderFaces(b.faces);
    items.push({
      depth: proj.depth(b.c[0], b.c[1], b.midZ),
      node: (
        <g key={b.h.id} {...sp} className={`bld ${sp.className}${isSel ? ' is-selected' : ''}`}>
          {courtNodes}
          {facesNodes}
        </g>
      ),
    });
    if (isSel)
      lifted = (
        <g className="bld is-selected is-lifted" aria-hidden="true">
          {courtNodes}
          {facesNodes}
        </g>
      );
  }

  // ── стена ограды ──
  scene.walls.forEach((w, i) =>
    items.push({
      depth: proj.depth(w.c[0], w.c[1], w.midZ),
      node: (
        <g key={`w${i}`} className="enclosure">
          {renderFaces(w.faces)}
        </g>
      ),
    }),
  );

  // ── деревья: ствол и шарообразная крона, освещённая с той же стороны, что и здания ──
  const tg = scene.tg;
  if (tg > 0.02) {
    trees.forEach((t, i) => {
      const base = P(t.at[0], t.at[1], 0);
      const crown = P(t.at[0], t.at[1], t.h * tg);
      items.push({
        depth: proj.depth(t.at[0], t.at[1], t.h * tg * 0.5),
        node: (
          <g key={`t${i}`} className="tree" aria-hidden="true">
            <line x1={base[0]} y1={base[1]} x2={crown[0]} y2={crown[1]} className="tree-trunk" />
            <circle cx={crown[0]} cy={crown[1]} r={t.r * proj.scale * tg} fill="url(#model-crown)" />
          </g>
        ),
      });
    });
    // кресты кладбища — маленькие, светлого камня
    crosses.forEach((cpt, i) => {
      const b = P(cpt[0], cpt[1], 0);
      const t = P(cpt[0], cpt[1], 7 * tg);
      const arm = P(cpt[0], cpt[1], 5 * tg);
      const w = 2.2 * proj.scale;
      items.push({
        depth: proj.depth(cpt[0], cpt[1], 2),
        node: (
          <path
            key={`x${i}`}
            className="grave"
            aria-hidden="true"
            d={`M${r1(b[0])} ${r1(b[1])}L${r1(t[0])} ${r1(t[1])}M${r1(arm[0] - w)} ${r1(arm[1])}L${r1(arm[0] + w)} ${r1(arm[1])}`}
          />
        ),
      });
    });
  }

  items.sort((a, b) => a.depth - b.depth);

  // ── подставка макета: видимые торцы ──
  const corners: V2[] = [
    [BOARD.x0, BOARD.y0],
    [BOARD.x1, BOARD.y0],
    [BOARD.x1, BOARD.y1],
    [BOARD.x0, BOARD.y1],
  ];
  const outward: V3[] = [
    [0, -1, 0],
    [1, 0, 0],
    [0, 1, 0],
    [-1, 0, 0],
  ];
  const plinth = corners
    .map((p, i) => ({ p, q: corners[(i + 1) % 4]!, n: outward[i]! }))
    .filter((e) => dot(e.n, cam) > 1e-3);

  const lightDir = screenLight(proj);

  return (
    <g className={`abbey-model${lifted ? ' has-selection' : ''}`}>
      <defs>
        <radialGradient
          id="model-crown"
          cx="0.5"
          cy="0.5"
          r="0.62"
          fx={0.5 + lightDir[0] * 0.28}
          fy={0.5 + lightDir[1] * 0.28}
        >
          <stop offset="0" stopColor="#8f9670" />
          <stop offset="0.55" stopColor="#66704c" />
          <stop offset="1" stopColor="#3e4530" />
        </radialGradient>
        <pattern id="model-beds" patternUnits="userSpaceOnUse" width="9" height="9">
          <rect width="9" height="9" fill="#a9a37c" />
          <rect width="9" height="4" fill="#8c8f62" />
        </pattern>
        <pattern id="model-rock" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(35)">
          <rect width="8" height="8" fill="#8a8071" />
          <rect width="1.4" height="8" fill="#6f665a" />
        </pattern>
        <filter id="model-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
        <filter id="model-ao" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <clipPath id="model-board">
          <rect x={BOARD.x0 + 4} y={BOARD.y0 + 4} width={W - 8} height={H - 8} />
        </clipPath>
      </defs>

      {plinth.map(({ p, q, n }, i) => {
        const pts: V3[] = [
          [p[0], p[1], 0],
          [q[0], q[1], 0],
          [q[0], q[1], -BOARD.depth],
          [p[0], p[1], -BOARD.depth],
        ];
        return (
          <polygon
            key={`pl${i}`}
            points={poly(pts.map((v) => P(v[0], v[1], v[2])))}
            fill={shade('wood', n)}
            className="plinth"
          />
        );
      })}

      <g transform={proj.ground}>
        <rect x={BOARD.x0} y={BOARD.y0} width={W} height={H} className="ground-meadow" />
        <path d={path(INTERIOR)} className="ground-yard" />
        {ground.map((h) => {
          const sp = spotProps(h);
          const material =
            h.id === 'ab-garden' || h.id === 'ab-plots'
              ? 'beds'
              : h.id === 'ab-cliff'
                ? 'rock'
                : h.id.replace(/^ab-/, '');
          return (
            <polygon
              key={h.id}
              points={poly(h.poly)}
              {...sp}
              className={`gz gz-${material} ${sp.className}${selectedId === h.id ? ' is-selected' : ''}`}
            />
          );
        })}
        {BUILDINGS.cloister?.court && <path d={path(BUILDINGS.cloister.court.pts)} className="ground-lawn" />}
        <image
          href={abbeyInkUrl}
          x={0}
          y={0}
          width={PLAN_W}
          height={PLAN_H}
          preserveAspectRatio="none"
          clipPath="url(#model-board)"
          opacity={printOpacity}
          className="model-print"
        />
        <path className="model-shadows" d={scene.shadowPath} filter={detail ? 'url(#model-soft)' : undefined} />
        <path className="model-ao" d={scene.aoPath} filter={detail ? 'url(#model-ao)' : undefined} />
        {/* выбранная открытая зона — на земле, под зданиями */}
        {selectedGround && <polygon points={poly(selectedGround.poly)} className="zone-selected" />}
        {outlines && hotspots.map((h) => <polygon key={`o-${h.id}`} points={poly(h.poly)} className="zone-outline" />)}
      </g>

      {items.map((it) => it.node)}

      {/* Выбор: макет отступает в тень, выбранное остаётся на свету */}
      {lifted && (
        <>
          <rect x={-8000} y={-8000} width={16000} height={16000} className="spotlight" />
          {lifted}
        </>
      )}
    </g>
  );
}

/** Тень кроны: круг, сдвинутый по свету на высоту кроны. */
function circleShadow(at: V2, r: number, h: number): V2[] {
  const c: V2 = [at[0] + SHADOW_STEP[0] * h, at[1] + SHADOW_STEP[1] * h];
  return Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r * 0.9] as V2;
  });
}

/** Откуда падает свет на экране: блик на кронах поворачивается вместе с макетом. */
function screenLight(proj: Projector): V2 {
  const o = proj.pt(0, 0, 0);
  const l = proj.pt(LIGHT[0] * 100, LIGHT[1] * 100, LIGHT[2] * 100);
  const d: V2 = [l[0] - o[0], l[1] - o[1]];
  const len = Math.hypot(d[0], d[1]) || 1;
  return [d[0] / len, d[1] / len];
}
