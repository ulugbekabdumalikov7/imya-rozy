import { anchorIn, characterById } from '../data';
import type { MapView, StoryEvent } from '../data/types';

interface Props {
  view: MapView;
  unit: number;
  moment: StoryEvent;
  /** События того же дня до текущего момента включительно (по порядку). */
  thread: StoryEvent[];
  title: (e: StoryEvent) => string;
  label: string;
  isVisibleCharacter: (id: string) => boolean;
  onPick: (id: string) => void;
}

/**
 * «Час за часом» на плане: нить дня (где уже побывало действие), предыдущие точки дня
 * и текущий момент — пульсирующее кольцо, подпись и участники.
 */
export function MomentLayer({ view, unit, moment, thread, title, label, isVisibleCharacter, onPick }: Props) {
  // Точки нити: подряд идущие события в одном месте сливаются в одну точку.
  const pts: { e: StoryEvent; x: number; y: number }[] = [];
  for (const e of thread) {
    const a = e.locationId ? anchorIn(view, e.locationId) : null;
    if (!a) continue;
    const last = pts[pts.length - 1];
    if (last && last.x === a[0] && last.y === a[1]) { last.e = e; continue; }
    pts.push({ e, x: a[0], y: a[1] });
  }
  const cur = moment.locationId ? anchorIn(view, moment.locationId) : null;
  const people = moment.characterIds.filter(isVisibleCharacter).map((id) => characterById.get(id)!);
  const R = 15 * unit;

  return (
    <g className="layer-moment">
      {pts.length > 1 && (
        <polyline className="moment-thread" points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
          style={{ strokeWidth: 1.3 * unit, strokeDasharray: `${2 * unit} ${4 * unit}` }} />
      )}
      {pts.filter((p) => p.e.id !== moment.id && !(cur && p.x === cur[0] && p.y === cur[1])).map((p) => (
        <g key={p.e.id} transform={`translate(${p.x} ${p.y})`} className="moment-past" role="button" tabIndex={0}
          aria-label={`Ранее в этот день: ${title(p.e)}`} onClick={() => onPick(p.e.id)}
          onKeyDown={(ev) => { if (ev.key === 'Enter') onPick(p.e.id); }}>
          <circle r={9 * unit} className="hit" />
          <circle r={4 * unit} style={{ strokeWidth: unit }} />
        </g>
      ))}
      {cur && (
        // key — момент: при каждом шаге кольцо и подпись появляются заново
        <g key={moment.id} transform={`translate(${cur[0]} ${cur[1]})`} className="moment-now">
          <circle r={R} className="moment-pulse" style={{ strokeWidth: 1.4 * unit }} />
          <circle r={R} className="moment-ring" style={{ strokeWidth: 1.6 * unit }} />
          <circle r={4.5 * unit} className="moment-core" />
          <g className="moment-label" transform={`translate(0 ${-(R + 12 * unit)})`}>
            <text textAnchor="middle" style={{ fontSize: 10.5 * unit }} className="moment-when">{label}</text>
            <text textAnchor="middle" y={15 * unit} style={{ fontSize: 13.5 * unit }} className="moment-title">{title(moment)}</text>
          </g>
          {people.length > 0 && (
            <g className="moment-people" transform={`translate(${-((Math.min(people.length, 8) - 1) * 21 * unit) / 2} ${R + 16 * unit})`}>
              {people.slice(0, 8).map((c, i) => (
                // положение — атрибутом внешней группы, анимация появления — у внутренней (CSS-transform заменил бы атрибут)
                <g key={c.id} transform={`translate(${i * 21 * unit} 0)`}>
                  <g className={`moment-person gnode-${c.group}`} style={{ ['--i' as string]: i }}>
                    <title>{c.short}</title>
                    <circle r={9 * unit} style={{ strokeWidth: unit }} />
                    <text textAnchor="middle" dominantBaseline="central" style={{ fontSize: 10 * unit }}>{c.short.charAt(0)}</text>
                  </g>
                </g>
              ))}
              {people.length > 8 && (
                <text x={8 * 21 * unit - 6 * unit} dominantBaseline="central" style={{ fontSize: 10 * unit }} className="moment-more">+{people.length - 8}</text>
              )}
            </g>
          )}
        </g>
      )}
    </g>
  );
}
