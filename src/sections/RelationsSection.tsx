import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

import { RelationDetail } from '../components/cards';
import { Chronicle, DetailPanel, Emblem, SectionHead } from '../components/ui';
import { characterById, characters, eventsOfCharacter, relationLabels, relationships } from '../data';
import type { RelationType } from '../data/types';
import { groupLabels } from '../lib/characterStatus';
import { reducedMotion } from '../lib/motion';
import { href, patchParams, type Route as AppRoute } from '../lib/router';
import { horizon } from '../lib/spoilers';
import { usePanZoom } from '../lib/usePanZoom';
import { relationPhaseAt, visibleTexts } from '../lib/visible';
import { useSpoiler } from '../state/spoiler';
import { CompareView } from './CompareView';

const GW = 1000;
const GH = 720;

/** Фиксированная раскладка: следствие в центре, библиотека слева, власть и посольства справа. */
const POS: Record<string, [number, number]> = {
  william: [480, 350],
  adso: [545, 480],
  abbo: [470, 175],
  jorge: [300, 195],
  malachi: [270, 340],
  berengar: [120, 300],
  venantius: [160, 140],
  adelmo: [85, 450],
  benno: [285, 490],
  alinardo: [345, 70],
  aymaro: [140, 600],
  severinus: [395, 610],
  nicholas: [650, 230],
  remigio: [770, 360],
  salvatore: [895, 460],
  girl: [735, 600],
  ubertino: [610, 660],
  bernard: [875, 250],
  bertrand: [860, 105],
  michael: [690, 95],
  jerome: [955, 170],
};

/** Начертание линии по смыслу отношения: союз — тонкая, конфликт — пунктир, тайна — едва заметная. */
const LINE_KIND: Record<RelationType, string> = {
  mentor: 'edge-solid',
  superior: 'edge-solid',
  trust: 'edge-solid',
  cooperation: 'edge-solid',
  attachment: 'edge-solid',
  'shared-interest': 'edge-solid',
  conflict: 'edge-dashed',
  ideological: 'edge-dashed',
  political: 'edge-dashed',
  secret: 'edge-thin',
  dependence: 'edge-thin',
  suspicion: 'edge-suspicion',
  complicity: 'edge-blood',
};

/** Расстояние в графе от центрального героя — по нему узлы и связи появляются волнами. */
function bfs(center: string, adj: Map<string, string[]>): Map<string, number> {
  const dist = new Map<string, number>([[center, 0]]);
  const q = [center];
  while (q.length) {
    const cur = q.shift()!;
    for (const n of adj.get(cur) ?? [])
      if (!dist.has(n)) {
        dist.set(n, dist.get(cur)! + 1);
        q.push(n);
      }
  }
  return dist;
}

const TYPE_ORDER: RelationType[] = [
  'mentor',
  'superior',
  'trust',
  'cooperation',
  'attachment',
  'shared-interest',
  'dependence',
  'secret',
  'complicity',
  'suspicion',
  'conflict',
  'ideological',
  'political',
];

export function RelationsSection({ route }: { route: AppRoute }) {
  const isCompare = route.path[0] === 'compare';
  return (
    <div className="page page-wide">
      <SectionHead latin="Fata" title="Судьбы и связи">
        <p>
          Отношения между героями меняются по ходу семи дней: доверие сменяется подозрением, союз — враждой. Нажмите на
          героя или на линию связи.
        </p>
      </SectionHead>
      <nav className="tabs" aria-label="Режим">
        <a
          className={!isCompare ? 'is-active' : ''}
          aria-current={!isCompare ? 'page' : undefined}
          href={href('relations')}
        >
          Граф связей
        </a>
        <a
          className={isCompare ? 'is-active' : ''}
          aria-current={isCompare ? 'page' : undefined}
          href={href('compare', { a: route.params.get('a') ?? 'william', b: route.params.get('b') ?? 'adso' })}
        >
          Сравнение судеб
        </a>
      </nav>
      {isCompare ? <CompareView route={route} /> : <Graph route={route} />}
    </div>
  );
}

function Graph({ route }: { route: AppRoute }) {
  const { spoiler, visible } = useSpoiler();
  const svgRef = useRef<SVGSVGElement>(null);
  const pz = usePanZoom(svgRef, GW, GH, 1, 4);
  const h = Math.min(7, horizon(spoiler));
  const dayCap = Math.min(h, Number(route.params.get('upto') ?? h));
  const focus = route.params.get('focus') ?? '';
  const edgeId = route.params.get('edge') ?? '';
  const types = new Set((route.params.get('types') ?? '').split(',').filter(Boolean) as RelationType[]);
  const strongOnly = route.params.get('strong') === '1';
  const indirect = route.params.get('indirect') !== '0';
  const set = (patch: Record<string, string | number | null>) => patchParams(route, patch);

  const nodes = characters.filter((c) => visible(c) && c.revealDay <= dayCap && POS[c.id]);
  const nodeIds = new Set(nodes.map((n) => n.id));

  const edges = useMemo(
    () =>
      relationships
        .map((r) => ({ r, p: relationPhaseAt(r, spoiler, dayCap) }))
        .filter((x) => x.p && nodeIds.has(x.r.fromCharacterId) && nodeIds.has(x.r.toCharacterId))
        .filter((x) => !types.size || types.has(x.p!.type))
        .filter((x) => !strongOnly || x.r.strength > 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spoiler, dayCap, route.params.toString()],
  );

  const neighbors = new Set<string>();
  const second = new Set<string>();
  if (focus) {
    for (const { r } of edges) {
      if (r.fromCharacterId === focus) neighbors.add(r.toCharacterId);
      if (r.toCharacterId === focus) neighbors.add(r.fromCharacterId);
    }
    if (indirect)
      for (const { r } of edges) {
        if (neighbors.has(r.fromCharacterId) && r.toCharacterId !== focus && !neighbors.has(r.toCharacterId))
          second.add(r.toCharacterId);
        if (neighbors.has(r.toCharacterId) && r.fromCharacterId !== focus && !neighbors.has(r.fromCharacterId))
          second.add(r.fromCharacterId);
      }
  }
  const unit = 1 / (pz.pxPerUnit * pz.view.k || 1);
  // Порядок появления фиксируется при открытии графа: центр → ближние → дальние.
  const [wave] = useState(() => {
    const adj = new Map<string, string[]>();
    for (const r of relationships) {
      adj.set(r.fromCharacterId, [...(adj.get(r.fromCharacterId) ?? []), r.toCharacterId]);
      adj.set(r.toCharacterId, [...(adj.get(r.toCharacterId) ?? []), r.fromCharacterId]);
    }
    return bfs(focus || 'william', adj);
  });
  const STEP = reducedMotion() ? 0 : 380;
  const delayOf = (id: string) => Math.min(3, wave.get(id) ?? 3) * STEP;
  const presentTypes = TYPE_ORDER.filter((t) =>
    relationships.some((r) => relationPhaseAt(r, spoiler, dayCap)?.type === t),
  );
  const focusChar = focus ? characterById.get(focus) : undefined;

  return (
    <div className="graph-layout">
      <div className="graph-controls">
        <fieldset className="ctl-group">
          <legend>Типы связей</legend>
          <div className="chips">
            {presentTypes.map((t) => (
              <button
                key={t}
                type="button"
                className={`chip rel-chip rel-${t}${types.has(t) ? ' is-active' : ''}`}
                aria-pressed={types.has(t)}
                onClick={() => {
                  const n = new Set(types);
                  if (n.has(t)) n.delete(t);
                  else n.add(t);
                  set({ types: [...n].join(',') || null });
                }}
              >
                {relationLabels[t]}
              </button>
            ))}
          </div>
          {types.size > 0 && (
            <button type="button" className="link-btn small" onClick={() => set({ types: null })}>
              Показать все типы
            </button>
          )}
        </fieldset>
        <div className="ctl-row">
          <label className="check">
            <input
              id="g-strong"
              type="checkbox"
              checked={strongOnly}
              onChange={() => set({ strong: strongOnly ? null : '1' })}
            />{' '}
            <span>Скрыть второстепенные связи</span>
          </label>
          <label className="check">
            <input
              id="g-indirect"
              type="checkbox"
              checked={indirect}
              onChange={() => set({ indirect: indirect ? '0' : null })}
            />{' '}
            <span>Показывать косвенные связи</span>
          </label>
        </div>
        <label className="range-field" htmlFor="g-upto">
          <span>
            Граф на конец дня: <strong>{dayCap}</strong>
            {h < 7 && <span className="muted small"> (дальше — по режиму чтения)</span>}
          </span>
          <input
            id="g-upto"
            type="range"
            min={1}
            max={h}
            value={dayCap}
            onChange={(e) => set({ upto: e.target.value === String(h) ? null : e.target.value })}
          />
        </label>
        <label className="select-field" htmlFor="g-focus">
          <span>Выбрать героя</span>
          <select id="g-focus" value={focus} onChange={(e) => set({ focus: e.target.value || null, edge: null })}>
            <option value="">— никто —</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="graph-stage">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${GW} ${GH}`}
          className="graph-svg"
          role="group"
          aria-label="Граф отношений героев"
          {...pz.handlers}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="arrow-head" />
            </marker>
          </defs>
          <rect width={GW} height={GH} className="map-ground" />
          <g transform={pz.transform}>
            {edges.map(({ r, p }) => {
              const a = POS[r.fromCharacterId]!;
              const b = POS[r.toCharacterId]!;
              const involved = !focus || r.fromCharacterId === focus || r.toCharacterId === focus;
              const indirectEdge =
                focus && !involved && (neighbors.has(r.fromCharacterId) || neighbors.has(r.toCharacterId)) && indirect;
              const dim = focus && !involved && !indirectEdge;
              const dx = b[0] - a[0];
              const dy = b[1] - a[1];
              const len = Math.hypot(dx, dy) || 1;
              const rr = 26;
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const x1 = a[0] + (dx / len) * rr;
              const y1 = a[1] + (dy / len) * rr;
              const x2 = b[0] - (dx / len) * rr;
              const y2 = b[1] - (dy / len) * rr;
              const selected = edgeId === r.id;
              const d = Math.max(delayOf(r.fromCharacterId), delayOf(r.toCharacterId)) + (STEP ? 160 : 0);
              return (
                <g
                  key={r.id}
                  className={`edge ${LINE_KIND[p!.type]}${dim ? ' is-dim' : ''}${indirectEdge ? ' is-indirect' : ''}${focus && involved ? ' is-active' : ''}${selected ? ' is-selected' : ''}`}
                  onClick={() => {
                    if (!pz.wasDrag()) set({ edge: r.id });
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${characterById.get(r.fromCharacterId)!.short} и ${characterById.get(r.toCharacterId)!.short}: ${relationLabels[p!.type]}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') set({ edge: r.id });
                  }}
                >
                  <g transform={`translate(${x1} ${y1}) rotate(${angle})`}>
                    <line x1={0} y1={0} x2={len - 2 * rr} y2={0} className="edge-hit" />
                    <line
                      x1={0}
                      y1={0}
                      x2={len - 2 * rr}
                      y2={0}
                      className="edge-line edge-draw"
                      style={{ ['--d' as string]: `${d}ms` }}
                      markerEnd={r.directed ? 'url(#arrow)' : undefined}
                    />
                  </g>
                  {(selected || (focus && involved)) && (
                    <text
                      x={(x1 + x2) / 2}
                      y={(y1 + y2) / 2 - 6}
                      className="edge-label"
                      textAnchor="middle"
                      style={{ fontSize: 11 * Math.max(1, unit) }}
                    >
                      {relationLabels[p!.type]}
                    </text>
                  )}
                </g>
              );
            })}
            {nodes.map((n) => {
              const [x, y] = POS[n.id]!;
              const state = !focus
                ? ''
                : n.id === focus
                  ? ' is-focus'
                  : neighbors.has(n.id)
                    ? ' is-near'
                    : second.has(n.id)
                      ? ' is-second'
                      : ' is-dim';
              return (
                <g
                  key={n.id}
                  transform={`translate(${x} ${y})`}
                  className={`gnode gnode-${n.group}${state}`}
                  role="button"
                  tabIndex={0}
                  aria-label={n.name}
                  aria-pressed={n.id === focus}
                  onClick={() => {
                    if (!pz.wasDrag()) set({ focus: n.id === focus ? null : n.id, edge: null });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') set({ focus: n.id === focus ? null : n.id, edge: null });
                  }}
                >
                  <g className="gnode-body" style={{ ['--d' as string]: `${delayOf(n.id)}ms` }}>
                    <circle r={22} className="gnode-disc" />
                    <text y={1} className="gnode-initial" textAnchor="middle" dominantBaseline="central">
                      {n.short[0]}
                    </text>
                    <text y={38} className="gnode-label" textAnchor="middle">
                      {n.short}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
        <div className="map-zoom" role="group" aria-label="Масштаб графа">
          <button type="button" className="icon-btn" onClick={pz.zoomIn} aria-label="Приблизить">
            <Plus size={18} />
          </button>
          <button type="button" className="icon-btn" onClick={pz.zoomOut} aria-label="Отдалить">
            <Minus size={18} />
          </button>
          <button type="button" className="icon-btn" onClick={pz.reset} aria-label="Исходный масштаб">
            <RotateCcw size={16} />
          </button>
        </div>
        <ul className="graph-legend" aria-label="Обозначения">
          <li>
            <span className="line-sample" aria-hidden="true" /> союз, доверие
          </li>
          <li>
            <span className="line-sample ls-dashed" aria-hidden="true" /> конфликт
          </li>
          <li>
            <span className="line-sample ls-thin" aria-hidden="true" /> тайна, зависимость
          </li>
          <li>
            <span className="line-sample ls-susp" aria-hidden="true" /> подозрение
          </li>
          <li>
            <span className="line-sample ls-blood" aria-hidden="true" /> соучастие
          </li>
          {(['investigators', 'library', 'abbey', 'franciscans', 'papal', 'outside'] as const).map((g) => (
            <li key={g}>
              <span className={`gdot gnode-${g}`} aria-hidden="true" /> {groupLabels[g]}
            </li>
          ))}
        </ul>
        {edges.length === 0 && <p className="graph-empty">Нет связей, подходящих под фильтр.</p>}
      </div>

      <DetailPanel
        open={!!(edgeId || focusChar)}
        onClose={() => set({ edge: null, focus: null })}
        label="Подробности связи"
      >
        {edgeId ? (
          <RelationDetail key={edgeId} id={edgeId} />
        ) : focusChar ? (
          <FocusCard key={focusChar.id} id={focusChar.id} dayCap={dayCap} onEdge={(id) => set({ edge: id })} />
        ) : null}
      </DetailPanel>
    </div>
  );
}

function FocusCard({ id, dayCap, onEdge }: { id: string; dayCap: number; onEdge: (id: string) => void }) {
  const { spoiler, visible } = useSpoiler();
  const c = characterById.get(id)!;
  const evs = eventsOfCharacter(id).filter((e) => visible(e) && e.day <= dayCap);
  const rels = relationships
    .filter((r) => r.fromCharacterId === id || r.toCharacterId === id)
    .map((r) => ({ r, p: relationPhaseAt(r, spoiler, dayCap) }))
    .filter((x) => x.p);
  const fate = visibleTexts(c.fate, spoiler);
  return (
    <article className="card stagger">
      <div className="card-head-row">
        <Emblem c={c} size={44} />
        <div>
          <p className="card-kicker">{c.role}</p>
          <h2 className="card-title">{c.name}</h2>
        </div>
      </div>
      <p>{c.summary}</p>
      {fate.length > 0 && (
        <p className="small">
          <strong>Судьба:</strong> {fate[fate.length - 1]!.text}
        </p>
      )}
      <h3>Связи на конец дня {dayCap}</h3>
      <ul className="rel-list">
        {rels.map(({ r, p }) => {
          const other = r.fromCharacterId === id ? r.toCharacterId : r.fromCharacterId;
          return (
            <li key={r.id}>
              <button type="button" className="link-btn" onClick={() => onEdge(r.id)}>
                <span className={`rel-tag rel-${p!.type}`}>{relationLabels[p!.type]}</span>{' '}
                {characterById.get(other)!.short}
              </button>
            </li>
          );
        })}
      </ul>
      <h3>Хроника судьбы</h3>
      <Chronicle events={evs} characterId={id} />
      <p className="small">
        <a href={href(`heroes/${id}`)}>Открыть досье</a> ·{' '}
        <a href={href('compare', { a: id, b: id === 'william' ? 'adso' : 'william' })}>Сравнить судьбы</a>
      </p>
    </article>
  );
}
