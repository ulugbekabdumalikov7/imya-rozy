import { describe, expect, it } from 'vitest';

import { bend, footprints } from '../src/lib/footsteps';

describe('следы маршрута', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 300, y: 0 };

  it('следы лежат на той же кривой, что и прежняя линия маршрута', () => {
    const c = bend(a, b);
    const gait = 3;
    for (const f of footprints(a, b, 15, gait, 10)) {
      // ближайшая точка кривой — не дальше смещения шага (плюс погрешность дискретизации)
      let best = Infinity;
      for (let i = 0; i <= 400; i++) {
        const t = i / 400,
          u = 1 - t;
        const x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
        const y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
        best = Math.min(best, Math.hypot(f.x - x, f.y - y));
      }
      expect(best).toBeLessThan(gait + 0.5);
      expect(best).toBeGreaterThan(gait - 0.5);
    }
  });

  it('ноги чередуются, шаги равномерны и идут от начала к концу', () => {
    const fp = footprints(a, b, 15, 3, 10);
    expect(fp.length).toBeGreaterThan(10);
    fp.forEach((f, i) => {
      if (i) expect(f.side).not.toBe(fp[i - 1]!.side);
    });
    fp.forEach((f, i) => {
      if (i) expect(f.at).toBeGreaterThan(fp[i - 1]!.at);
    });
    expect(fp[0]!.at).toBeGreaterThan(0);
    expect(fp.at(-1)!.at).toBeLessThan(1);
  });

  it('левый след слева по ходу движения, правый — справа', () => {
    const fp = footprints({ x: 0, y: 0 }, { x: 0, y: 200 }, 15, 3, 10); // идём вниз по экрану
    // при движении вниз (y растёт) левая сторона — +x
    const l = fp.find((f) => f.side === 'l')!;
    const r = fp.find((f) => f.side === 'r')!;
    expect(l.x).toBeGreaterThan(r.x);
    expect(Math.round(l.angle)).toBeGreaterThan(60); // носок смотрит вниз (около 90°)
  });

  it('продолжает чередование с прошлого отрезка и не ставит следов в слишком коротком отрезке', () => {
    expect(footprints(a, b, 15, 3, 10, 'r')[0]!.side).toBe('r');
    expect(footprints(a, { x: 12, y: 0 }, 15, 3, 10)).toEqual([]);
  });
});
