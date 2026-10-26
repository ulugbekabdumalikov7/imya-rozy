import { anchorIn, characterById, plans } from '../data';
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
  const rows = nameRows(people.map((c) => ({ id: c.id, name: c.short, lead: c.group === 'investigators' })));
  // У нижнего края плана камера не может поднять место выше полосы времени — там имена ставим над подписью.
  const above = !!cur && cur[1] > plans[view].height * 0.66;
  const labelTop = -(R + 12 * unit);
  const namesY = above ? labelTop - 14 * unit - rows.length * 15 * unit : R + 18 * unit;

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
          <g className="moment-label" transform={`translate(0 ${labelTop})`}>
            <text textAnchor="middle" style={{ fontSize: 10.5 * unit }} className="moment-when">{label}</text>
            <text textAnchor="middle" y={15 * unit} style={{ fontSize: 13.5 * unit }} className="moment-title">{title(moment)}</text>
          </g>
          {people.length > 0 && (
            // положение — атрибутом внешней группы, анимация появления — у внутренней (CSS-transform заменил бы атрибут)
            <g transform={`translate(0 ${namesY})`}>
              <g className="moment-people" aria-label={`Участники: ${people.map((c) => c.short).join(', ')}`}>
                {rows.map((row, ri) => (
                  <text key={ri} textAnchor="middle" y={ri * 15 * unit} style={{ fontSize: 11.5 * unit }} className="moment-names">
                    {row.map((n, i) => (
                      <tspan key={n.id}>
                        {i > 0 && <tspan className="moment-sep"> · </tspan>}
                        <tspan className={n.lead ? 'moment-name is-lead' : 'moment-name'}>{n.name}</tspan>
                      </tspan>
                    ))}
                  </text>
                ))}
              </g>
            </g>
          )}
        </g>
      )}
    </g>
  );
}

type NameItem = { id: string; name: string; lead: boolean };
const ROW_CHARS = 26; // примерно столько символов помещается в строку без перекрытия соседних зон
const MAX_ROWS = 4;

/** Имена участников строками по 3–4 имени; если не помещаются в четыре строки — остаток числом «и ещё N». */
export function nameRows(items: NameItem[]): NameItem[][] {
  const rows: NameItem[][] = [];
  let cur: NameItem[] = [];
  let len = 0;
  for (const it of items) {
    const add = (cur.length ? 3 : 0) + it.name.length;
    if (cur.length && len + add > ROW_CHARS) { rows.push(cur); cur = []; len = 0; }
    cur.push(it);
    len += (cur.length > 1 ? 3 : 0) + it.name.length;
  }
  if (cur.length) rows.push(cur);
  if (rows.length <= MAX_ROWS) return rows;
  const kept = rows.slice(0, MAX_ROWS);
  const shown = kept.reduce((n, r) => n + r.length, 0);
  kept[MAX_ROWS - 1] = [...kept[MAX_ROWS - 1]!, { id: '__more', name: `и ещё ${items.length - shown}`, lead: false }];
  return kept;
}
