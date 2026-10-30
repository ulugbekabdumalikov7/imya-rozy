import { useMemo, useRef } from 'react';

import { anchorIn } from '../../data';
import type { MapView, RouteStep } from '../../data/types';
import { FOOT_PATH, type Footprint, footprints } from '../../lib/footsteps';

/**
 * Маршрут: следы героя идут по той же кривой, что связывала эпизоды, шаг за шагом;
 * кружок эпизода появляется, когда к нему подходят следы.
 */
export function RouteLines({
  steps,
  view,
  unit,
  cls,
  animate,
  segMs,
  current,
  startDelay = 0,
}: {
  steps: RouteStep[];
  view: MapView;
  unit: number;
  cls: string;
  animate: boolean;
  segMs: number;
  current: number | null;
  startDelay?: number;
}) {
  const ptsList = steps.map((s) => {
    const a = anchorIn(view, s.locationId);
    return a ? { ...s, x: a[0], y: a[1] } : null;
  });
  const ghost = cls === 'route-ghost';
  // Размер следа задан в экранных пикселях; масштаб округляется до ступеней √2, чтобы следы не перестраивались при каждом движении колёсика.
  const u = Math.pow(2, Math.round(Math.log2(unit) * 2) / 2);
  const size = ghost ? 0.8 : cls === 'route-follower' ? 0.9 : 1;
  // Время отсчитывается от первого показа: следы, появившиеся позже (после масштабирования), не проигрывают анимацию заново.
  const born = useRef(performance.now());
  const elapsed = performance.now() - born.current;

  const stepsKey = steps.map((st) => `${st.locationId}:${st.kind}`).join('|');
  const prints = useMemo(() => {
    const out: (Footprint & { seg: number; faint: boolean })[] = [];
    let side: 'l' | 'r' = 'l';
    ptsList.forEach((b, i) => {
      if (i === 0) return;
      const a = ptsList[i - 1];
      const sa = steps[i - 1]!;
      const sb = steps[i]!;
      if (!a || !b) return;
      if (sa.kind === 'gap' || sb.kind === 'gap') return; // пропуск в тексте: следов нет
      if (a.x === b.x && a.y === b.y) return;
      const faint = sa.kind === 'reconstructed' || sb.kind === 'reconstructed';
      const fp = footprints(a, b, 15 * u * size, 3.2 * u * size, (ghost ? 4 : 11) * u, side);
      for (const f of fp) out.push({ ...f, seg: i - 1, faint });
      if (fp.length) side = fp[fp.length - 1]!.side === 'l' ? 'r' : 'l';
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepsKey, view, u, size, ghost]);

  return (
    <g className={`layer-route ${cls}${animate ? ' is-route-drawing' : ''}`} aria-hidden={ghost || undefined}>
      <g className="route-steps">
        {prints.map((f, k) => {
          const delay = startDelay + (f.seg + f.at) * segMs - elapsed;
          const sx = 1.45 * u * size;
          return (
            <path
              key={k}
              d={FOOT_PATH}
              className={`footprint${f.faint ? ' is-faint' : ''}`}
              transform={`translate(${f.x} ${f.y}) rotate(${f.angle}) scale(${sx} ${f.side === 'l' ? sx : -sx})`}
              style={animate ? { ['--step-delay' as string]: `${delay}ms` } : undefined}
            />
          );
        })}
      </g>
      {!ghost &&
        ptsList.map((pt, i) => {
          if (!pt) return null;
          const same = ptsList.slice(0, i).filter((q) => q && q.x === pt.x && q.y === pt.y).length;
          const ang = same * 0.9;
          const ox = same ? Math.cos(ang) * 15 * unit : 0;
          const oy = same ? Math.sin(ang) * 15 * unit : 0;
          const isCurrent = current === i;
          return (
            <g key={i} transform={`translate(${pt.x + ox} ${pt.y + oy})`}>
              <g
                className={`route-dot route-${pt.kind}${isCurrent ? ' is-current' : ''}`}
                style={{ ['--dot-delay' as string]: `${startDelay + i * segMs}ms` }}
              >
                <circle r={(isCurrent ? 10 : 7.5) * unit} style={{ strokeWidth: 1.4 * unit }} />
                <text style={{ fontSize: 9 * unit }} textAnchor="middle" dominantBaseline="central">
                  {pt.kind === 'gap' ? '?' : i + 1}
                </text>
              </g>
            </g>
          );
        })}
    </g>
  );
}
