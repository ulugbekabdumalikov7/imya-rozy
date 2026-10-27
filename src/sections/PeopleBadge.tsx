import type { Character } from '../data/types';
import { nameRows } from './MomentLayer';

/** Силуэт человека (голова и плечи) в единицах «1 = 1px», центр в нуле. */
const PERSON = 'M0,-4.6 a2.3,2.3 0 1,0 0.01,0 Z M-4.2,4.6 C-4.2,1.2 -2.3,-0.6 0,-0.6 C2.3,-0.6 4.2,1.2 4.2,4.6 Z';

interface Props {
  x: number;
  y: number;
  unit: number;
  people: Character[];
  open: boolean;
  placeName: string;
  onToggle: () => void;
}

/**
 * Слой «Персонажи»: плашка «силуэт + число» — сколько героев бывало в месте.
 * Нажатие раскрывает окошко «Здесь бывали» с именами (на телефоне подсказки при наведении нет).
 */
export function PeopleBadge({ x, y, unit, people, open, placeName, onToggle }: Props) {
  const n = people.length;
  const w = (n >= 10 ? 34 : 28) * unit;
  const h = 18 * unit;
  const label = `Здесь бывали: ${people.map((c) => c.short).join(', ')}`;
  return (
    <g transform={`translate(${x} ${y})`} className={`marker marker-people${open ? ' is-open' : ''}`}>
      <g role="button" tabIndex={0} aria-expanded={open} aria-label={`${placeName}. ${label}`}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(); } }}>
        <title>{label}</title>
        <rect x={-w / 2 - 4 * unit} y={-h / 2 - 4 * unit} width={w + 8 * unit} height={h + 8 * unit} className="hit" />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} className="people-pill" style={{ strokeWidth: unit }} />
        <path d={PERSON} transform={`translate(${-w / 2 + 9 * unit} ${0.4 * unit}) scale(${unit})`} className="people-icon" />
        <text x={-w / 2 + 16 * unit} style={{ fontSize: 10.5 * unit }} dominantBaseline="central" className="people-count">{n}</text>
      </g>
    </g>
  );
}

/** Окошко «Здесь бывали»: рисуется поверх всех слоёв плана, в точке плашки (x, y). */
export function PeoplePopover({ unit, people, below, x, y, minX, maxX, onOpenPlace }: {
  unit: number; people: Character[]; below: boolean; x: number; y: number; minX: number; maxX: number; onOpenPlace: () => void;
}) {
  // в окошке — все имена: в нём и смысл (ограничение строк нужно только подписи под кольцом «Час за часом»)
  const rows = nameRows(people.map((c) => ({ id: c.id, name: c.short, lead: c.group === 'investigators' })), Infinity);
  const fs = 12 * unit;
  const lineH = 16 * unit;
  const charW = fs * 0.56; // средняя ширина буквы Alegreya Sans
  const head = `Здесь бывали · ${people.length}`;
  const longest = Math.max(head.length, 'О месте →'.length, ...rows.map((r) => r.map((n) => n.name).join(' · ').length));
  const pad = 10 * unit;
  const w = longest * charW + pad * 2;
  const hgt = pad * 2 + lineH * (rows.length + 2) - 4 * unit;
  // по горизонтали — не за край плана
  let dx = -w / 2;
  if (x + dx < minX) dx = minX - x;
  if (x + dx + w > maxX) dx = maxX - x - w;
  const dy = below ? 16 * unit : -16 * unit - hgt;
  return (
    <g className="people-pop" transform={`translate(${x + dx} ${y + dy})`} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={head}>
      <rect width={w} height={hgt} rx={3 * unit} className="people-pop-bg" style={{ strokeWidth: unit }} />
      <text x={pad} y={pad + fs * 0.85} style={{ fontSize: fs * 0.82 }} className="people-pop-head">{head}</text>
      {rows.map((row, i) => (
        <text key={i} x={pad} y={pad + fs * 0.85 + lineH * (i + 1)} style={{ fontSize: fs }} className="people-pop-names">
          {row.map((n, j) => (
            <tspan key={n.id}>
              {j > 0 && <tspan className="moment-sep"> · </tspan>}
              <tspan className={n.lead ? 'moment-name is-lead' : 'moment-name'}>{n.name}</tspan>
            </tspan>
          ))}
        </text>
      ))}
      <text x={pad} y={pad + fs * 0.85 + lineH * (rows.length + 1)} style={{ fontSize: fs * 0.88 }} className="people-pop-link"
        role="button" tabIndex={0} onClick={onOpenPlace} onKeyDown={(e) => { if (e.key === 'Enter') onOpenPlace(); }}>О месте →</text>
    </g>
  );
}
