import { describe, expect, it } from 'vitest';

import { FLAT_GEOMETRY, modelGeometry } from '../src/components/map/projection';
import { hotspotAnchor, plans } from '../src/data';
import { BOARD, BUILDINGS, ENCLOSURE, PEAKS } from '../src/data/abbeyModel';
import {
  buildPart,
  type Camera,
  facesCamera,
  hull,
  inside,
  makeProjector,
  outwardNormal,
  shadowOf,
  type V2,
  type V3,
} from '../src/lib/model3d';

const W = plans.abbey.width;
const H = plans.abbey.height;
const FULL = { x0: 0, y0: 0, x1: W, y1: H, depth: 0 };
const TOP: Camera = { yaw: 0, tilt: 0 };
const MODEL: Camera = { yaw: -14, tilt: 50 };

const parseMatrix = (m: string) =>
  m.match(/-?[\d.e-]+/g)!.map(Number) as [number, number, number, number, number, number];
const near = (a: number, b: number, eps = 0.05) => Math.abs(a - b) < eps;

describe('камера макета', () => {
  it('вид сверху без поворота совпадает с исходным планом', () => {
    const p = makeProjector(TOP, W, H, FULL);
    for (const [x, y] of [
      [0, 0],
      [883, 350],
      [W, H],
    ] as V2[]) {
      const [sx, sy] = p.pt(x, y, 40); // высота при виде сверху не сдвигает точку
      expect(near(sx, x) && near(sy, y), `${x},${y}`).toBe(true);
    }
  });

  it('матрица земли совпадает с проекцией точек на земле при любом повороте', () => {
    for (const cam of [MODEL, { yaw: 137, tilt: 35 }, { yaw: -90, tilt: 65 }]) {
      const p = makeProjector(cam, W, H, BOARD, PEAKS);
      const [a, b, c, d, e, f] = parseMatrix(p.ground);
      for (const [x, y] of [
        [100, 200],
        [1200, 900],
      ] as V2[]) {
        const [sx, sy] = p.pt(x, y, 0);
        expect(near(a * x + c * y + e, sx, 0.5) && near(b * x + d * y + f, sy, 0.5), JSON.stringify(cam)).toBe(true);
      }
    }
  });

  it('макет целиком в кадре: основание и вершины башен', () => {
    for (const yaw of [0, 45, 90, 180, 270]) {
      const p = makeProjector({ yaw, tilt: 60 }, W, H, BOARD, PEAKS);
      const pts = [
        ...PEAKS.map(([x, y, z]) => p.pt(x, y, z)),
        p.pt(BOARD.x0, BOARD.y0),
        p.pt(BOARD.x1, BOARD.y1),
        p.pt(BOARD.x1, BOARD.y0),
        p.pt(BOARD.x0, BOARD.y1),
      ];
      for (const [x, y] of pts) expect(x >= -0.5 && x <= W + 0.5 && y >= -0.5 && y <= H + 0.5, `yaw ${yaw}`).toBe(true);
    }
  });

  it('высокое — выше на экране, ближнее к зрителю — глубже по порядку отрисовки', () => {
    const p = makeProjector(MODEL, W, H, BOARD, PEAKS);
    expect(p.pt(600, 600, 50)[1]).toBeLessThan(p.pt(600, 600, 0)[1]);
    // при взгляде с юга южная точка ближе
    const south = makeProjector({ yaw: 0, tilt: 50 }, W, H, BOARD, PEAKS);
    expect(south.depth(600, 900)).toBeGreaterThan(south.depth(600, 100));
  });
});

describe('здания', () => {
  const quad: V2[] = [
    [0, 0],
    [100, 0],
    [100, 40],
    [0, 40],
  ];
  const center = (z: number): V3 => [50, 20, z];

  it('двускатная крыша: четыре стены (два фронтона) и два ската до конька', () => {
    const faces = buildPart({ pts: quad, h: 30, roof: { type: 'gable', rise: 15 } });
    expect(faces.filter((f) => f.kind === 'wall')).toHaveLength(4);
    expect(faces.filter((f) => f.kind === 'roof')).toHaveLength(2);
    expect(faces.filter((f) => f.kind === 'wall' && f.pts.length === 5)).toHaveLength(2);
    expect(Math.max(...faces.flatMap((f) => f.pts.map((q) => q[2])))).toBe(45);
  });

  it('вальмовая крыша: четыре ската; шатёр над многоугольной башней — по скату на сторону', () => {
    expect(
      buildPart({ pts: quad, h: 30, roof: { type: 'hip', rise: 15 } }).filter((f) => f.kind === 'roof'),
    ).toHaveLength(4);
    const seven = BUILDINGS.aedificium!.parts[1]!;
    expect(buildPart(seven).filter((f) => f.kind === 'roof')).toHaveLength(seven.pts.length);
  });

  it('при виде сверху стен не видно, крыши видны; с юга видна южная стена, северная — нет', () => {
    const faces = buildPart({ pts: quad, h: 30, roof: { type: 'gable', rise: 15 } });
    const top = makeProjector(TOP, W, H, FULL);
    for (const f of faces) {
      const n = outwardNormal(f, center(15));
      expect(facesCamera(f, top.toCamera, n), f.kind).toBe(f.kind !== 'wall');
    }
    const fromSouth = makeProjector({ yaw: 0, tilt: 50 }, W, H, FULL);
    const wallAt = (y: number) => faces.find((f) => f.kind === 'wall' && f.pts.every((q) => q[1] === y))!;
    expect(facesCamera(wallAt(40), fromSouth.toCamera, outwardNormal(wallAt(40), center(15)))).toBe(true);
    expect(facesCamera(wallAt(0), fromSouth.toCamera, outwardNormal(wallAt(0), center(15)))).toBe(false);
  });

  it('тень накрывает основание и тянется от света', () => {
    const s = shadowOf(quad, 30);
    for (const q of quad)
      expect(inside([q[0] + 0.01 * Math.sign(50 - q[0]), q[1] + 0.01 * Math.sign(20 - q[1])], s)).toBe(true);
    expect(hull(s).length).toBe(s.length);
  });
});

describe('макет построен на контурах плана', () => {
  const abbey = plans.abbey.hotspots;

  it('у каждой постройки плана есть объём, и стоит он на её контуре', () => {
    for (const h of abbey.filter((x) => x.kind === 'building' || x.kind === 'opening')) {
      const model = BUILDINGS[h.id.replace(/^ab-/, '')];
      expect(model, h.id).toBeDefined();
      for (const part of model!.parts) {
        const cx = part.pts.reduce((a, q) => a + q[0], 0) / part.pts.length;
        const cy = part.pts.reduce((a, q) => a + q[1], 0) / part.pts.length;
        const xs = h.poly.map((q) => q[0]);
        const ys = h.poly.map((q) => q[1]);
        const pad = 12;
        expect(
          cx > Math.min(...xs) - pad &&
            cx < Math.max(...xs) + pad &&
            cy > Math.min(...ys) - pad &&
            cy < Math.max(...ys) + pad,
          `${h.id}: часть вне контура`,
        ).toBe(true);
      }
    }
  });

  it('у объёма нет лишних зданий, которых нет на плане', () => {
    const ids = new Set(abbey.map((h) => h.id.replace(/^ab-/, '')));
    for (const id of Object.keys(BUILDINGS)) expect(ids.has(id), id).toBe(true);
  });

  it('стена ограды и основание охватывают все зоны плана', () => {
    for (const line of ENCLOSURE)
      for (const [x, y] of line) expect(x >= BOARD.x0 && x <= BOARD.x1 && y >= BOARD.y0 && y <= BOARD.y1).toBe(true);
    for (const h of abbey.filter((x) => x.kind !== 'terrain'))
      for (const [x, y] of h.poly)
        expect(x >= BOARD.x0 && x <= BOARD.x1 && y >= BOARD.y0 && y <= BOARD.y1, h.id).toBe(true);
  });

  it('знаки слоёв на макете стоят над своей зоной, а при виде сверху — ровно в точке привязки плана', () => {
    const top = modelGeometry(makeProjector(TOP, W, H, FULL));
    for (const h of abbey) {
      const a = hotspotAnchor(h);
      const b = top.anchor(h);
      expect(near(a[0], b[0], 0.1) && near(a[1], b[1], 0.1), h.id).toBe(true);
    }
    const model = modelGeometry(makeProjector(MODEL, W, H, BOARD, PEAKS));
    const library = plans.library.hotspots[0]!;
    expect(model.anchor(library)).toBeDefined();
    expect(model.anchorIn('library', 'library')).toEqual(FLAT_GEOMETRY.anchorIn('library', 'library'));
  });
});

describe('обрыв', () => {
  it('склон идёт от бровки (z = 0) вниз к подошве и обращён вверх', async () => {
    const { buildSlope } = await import('../src/lib/terrain');
    const { CLIFF } = await import('../src/data/abbeyModel');
    const { tris } = buildSlope(CLIFF.rim, CLIFF.foot, CLIFF.drop);
    expect(tris.length).toBeGreaterThan(100);
    const zs = tris.flat().map((p) => p[2]);
    expect(Math.max(...zs)).toBeLessThanOrEqual(CLIFF.drop * 0.1);
    expect(Math.min(...zs)).toBeGreaterThanOrEqual(-CLIFF.drop * 1.1);
    // бровка обрыва проходит по внутреннему краю зоны плана «Обрыв»
    const cliff = plans.abbey.hotspots.find((h) => h.id === 'ab-cliff')!;
    for (const p of cliff.poly)
      expect(
        CLIFF.rim.some((q) => q[0] === p[0] && q[1] === p[1]) || CLIFF.foot.some((q) => q[0] === p[0] && q[1] === p[1]),
        String(p),
      ).toBe(true);
  });
});
