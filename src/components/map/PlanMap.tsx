import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import abbeyPlanUrl from '../../assets/abbey-plan.webp';
import libraryPlanUrl from '../../assets/library-plan.webp';
import { characterById, eventById, hotspotAnchor, plans, routeByCharacter } from '../../data';
import { LIBRARY_PASSAGE_MARK, LIBRARY_RED_GLYPHS } from '../../data/planGeometry';
import type { PlanHotspot } from '../../data/plans';
import type { MapView, Route, RouteStep, StoryEvent } from '../../data/types';
import { firstTimeThisSession, reducedMotion } from '../../lib/motion';
import { usePanZoom } from '../../lib/usePanZoom';
import { eventTitle } from '../../lib/visible';
import { useSpoiler } from '../../state/spoiler';
import { ClueLayer } from './ClueLayer';
import { DeathLayer } from './DeathLayer';
import { hotspotLabel } from './hotspotLabel';
import { MEETING_EVENT_ID, MeetingMarker, MeetingScene } from './MeetingRose';
import { MomentLayer } from './MomentLayer';
import { PeopleBadge, PeoplePopover } from './PeopleBadge';
import { RouteLines } from './RouteLines';
import { type FocusReason, useMapFocus } from './useMapFocus';
import { useMapMarkers } from './useMapMarkers';
import { useMeetingScene } from './useMeetingScene';

const IMAGES: Record<MapView, string> = { abbey: abbeyPlanUrl, library: libraryPlanUrl };

export type LayerKey = 'arch' | 'people' | 'deaths' | 'clues' | 'route' | 'investigation';
export type { FocusReason } from './useMapFocus';

interface Props {
  view: MapView;
  layers: Set<LayerKey>;
  /** Подсвеченная зона плана. */
  selectedSpot?: string;
  selectedEventId?: string;
  dayFilter: number | null;
  route?: Route;
  routeStep: number | null;
  /** Ночная гамма (чёрный фон, светлые линии) либо исходный скан. */
  tone: 'night' | 'scan';
  onPickHotspot: (h: PlanHotspot) => void;
  onPickEvent: (id: string) => void;
  focusKey: string;
  focusReason: FocusReason;
  /** Точка, к которой подвести камеру (место выбранного события, шага маршрута и т. п.). */
  focusLocationId?: string;
  panelOpen: boolean;
  /** «Час за часом»: текущий момент — на плане только то, что к нему уже произошло. */
  moment?: StoryEvent;
  momentThread?: StoryEvent[];
  momentLabel?: string;
}

const pts = (poly: [number, number][]) => poly.map((p) => p.join(',')).join(' ');
/** Порядок отрисовки: местность и открытые пространства — под постройками. */
const LAYER_ORDER: Record<PlanHotspot['kind'], number> = { terrain: 0, open: 1, opening: 2, building: 3, room: 3 };

export function PlanMap(p: Props) {
  const { spoiler, visible } = useSpoiler();
  const plan = plans[p.view];
  const W = plan.width;
  const H = plan.height;
  const svgRef = useRef<SVGSVGElement>(null);
  const pz = usePanZoom(svgRef, W, H, 1, p.view === 'library' ? 5 : 6);
  const unit = 1 / (pz.pxPerUnit * pz.view.k || 1); // одна экранная точка в единицах плана
  const [hoverId, setHoverId] = useState<string | null>(null);
  // «Здесь бывали»: открытое окошко слоя «Персонажи» (id зоны плана)
  const [peopleOpen, setPeopleOpen] = useState<string | null>(null);
  useEffect(() => {
    setPeopleOpen(null);
  }, [p.focusKey, p.view]);
  useEffect(() => {
    if (!peopleOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPeopleOpen(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [peopleOpen]);

  // Проявление плана: полное — при первом открытии за сессию, короткое — при смене плана.
  const [drawMode] = useState(() =>
    reducedMotion() ? 'none' : firstTimeThisSession('map-draw') ? 'drawing' : 'settling',
  );
  const settleDelay = drawMode === 'drawing' ? 1400 : drawMode === 'settling' ? 300 : 0;

  const meeting = useMeetingScene(p.view, p.selectedEventId, p.moment);

  const hotspots = useMemo(() => [...plan.hotspots].sort((a, b) => LAYER_ORDER[a.kind] - LAYER_ORDER[b.kind]), [plan]);
  const selected = p.selectedSpot ? hotspots.find((h) => h.id === p.selectedSpot) : undefined;
  const hovered = hoverId ? hotspots.find((h) => h.id === hoverId) : undefined;
  // «Час за часом»: следы маршрута — только до текущего момента (шаг со ссылкой на событие — по его порядку, иначе — по дню)
  const stepHappened = (st: RouteStep) => {
    if (!p.moment) return true;
    const ev = st.eventId ? eventById.get(st.eventId) : undefined;
    return ev ? ev.sequence <= p.moment.sequence : st.day <= p.moment.day;
  };
  const visibleSteps = p.route ? p.route.steps.filter((s) => visible(s) && stepHappened(s)) : [];

  useMapFocus({
    pz,
    view: p.view,
    focusKey: p.focusKey,
    focusReason: p.focusReason,
    focusLocationId: p.focusLocationId,
    selected,
    panelOpen: p.panelOpen,
    momentActive: !!p.moment,
    settleDelay,
  });

  const { peopleAt, cluesAt, deathMarkers } = useMapMarkers(p.view, p.dayFilter, p.moment, unit);

  const routeStyle =
    p.route?.characterId === 'william'
      ? 'route-lead'
      : p.route?.characterId === 'adso'
        ? 'route-follower'
        : 'route-default';
  const ghost = p.route?.characterId === 'adso' ? routeByCharacter.get('william') : undefined;
  const segMs = Math.min(420, Math.max(110, 4200 / Math.max(1, visibleSteps.length)));
  const routeKey = `${p.route?.id}|${p.view}|${spoiler.mode}${spoiler.day}`;

  const click = (fn: () => void) => () => {
    if (!pz.wasDrag()) fn();
  };
  const drawClass = drawMode === 'drawing' ? 'is-drawing' : drawMode === 'settling' ? 'is-settling' : '';

  const label = (h: PlanHotspot) => hotspotLabel(h, visible);
  const tip = hovered ?? selected;

  return (
    <div className="map-canvas" style={{ ['--plan-ratio' as string]: `${W} / ${H}` }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`plan-svg tone-${p.tone} plan-${p.view}${p.layers.has('arch') ? ' layers-arch' : ''}${meeting.playing ? ' is-meeting-scene' : ''}`}
        role="group"
        aria-label={p.view === 'abbey' ? 'План аббатства' : 'План библиотеки'}
        {...pz.handlers}
        onClick={() => {
          if (peopleOpen) setPeopleOpen(null);
        }} // нажатие мимо окошка «Здесь бывали» закрывает его
      >
        <defs>
          <filter id="tone-night" colorInterpolationFilters="sRGB">
            {/* Ночная гамма: яркость → инверсия; бумага становится чернотой, чернила — костью. */}
            <feColorMatrix
              type="matrix"
              values="-0.28 -0.55 -0.1 0 0.93  -0.27 -0.53 -0.1 0 0.9  -0.25 -0.5 -0.1 0 0.85  0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="gamma" amplitude="1" exponent="1.35" offset="0" />
              <feFuncG type="gamma" amplitude="1" exponent="1.35" offset="0" />
              <feFuncB type="gamma" amplitude="1" exponent="1.35" offset="0" />
            </feComponentTransfer>
          </filter>
          {/* край скана (корешок, тень) в ночной гамме становится светлой рамкой — обрезаем его */}
          <clipPath id={`scan-edge-${p.view}`}>
            <rect x={10} y={8} width={W - 20} height={H - 16} />
          </clipPath>
        </defs>
        <rect x={-W} y={-H} width={W * 3} height={H * 3} className="plan-ground" />
        <g transform={pz.transform}>
          <g key={p.view} className={drawClass}>
            <image
              href={IMAGES[p.view]}
              x={0}
              y={0}
              width={W}
              height={H}
              className="plan-image"
              filter={p.tone === 'night' ? 'url(#tone-night)' : undefined}
              clipPath={p.tone === 'night' && p.view === 'abbey' ? `url(#scan-edge-${p.view})` : undefined}
              preserveAspectRatio="none"
            />

            {/* Красные буквы плана библиотеки: в ночной гамме окрашиваются в бордовый поверх исходных пикселей. */}
            {p.view === 'library' && p.tone === 'night' && (
              <g className="glyph-tint" aria-hidden="true">
                {LIBRARY_RED_GLYPHS.map((g, i) => (
                  <rect key={i} x={g.x - 1} y={g.y - 1} width={g.w + 2} height={g.h + 2} />
                ))}
                <rect
                  x={LIBRARY_PASSAGE_MARK.x}
                  y={LIBRARY_PASSAGE_MARK.y}
                  width={LIBRARY_PASSAGE_MARK.w}
                  height={LIBRARY_PASSAGE_MARK.h}
                />
              </g>
            )}

            {/* Обводка зон проявляется линией при первом открытии */}
            {drawClass === 'is-drawing' && (
              <g aria-hidden="true">
                {hotspots.map((h, i) => (
                  <polygon
                    key={`s-${h.id}`}
                    points={pts(h.poly)}
                    className="sketch"
                    pathLength={1}
                    style={{ ['--d' as string]: i % 24 }}
                  />
                ))}
              </g>
            )}

            {/* Затемнение всего плана, кроме выбранной зоны */}
            {selected && (
              <path
                className="spotlight"
                fillRule="evenodd"
                d={`M${-W} ${-H}H${W * 2}V${H * 2}H${-W}Z M${selected.poly.map((q) => q.join(' ')).join(' L')}Z`}
              />
            )}

            <g className={`rooms${hoverId ? ' has-hover' : ''}`}>
              {hotspots.map((h) => {
                const isSel = selected?.id === h.id;
                const lb = label(h);
                return (
                  <polygon
                    key={h.id}
                    points={pts(h.poly)}
                    className={`spot spot-${h.kind}${isSel ? ' is-selected' : ''}${hoverId === h.id ? ' is-hover' : ''}${h.locationId ? ' is-linked' : ''}`}
                    style={{ strokeWidth: (isSel ? 2 : 1.3) * unit }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${lb.title}${lb.sub ? `, ${lb.sub}` : ''}`}
                    aria-pressed={isSel}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setHoverId(h.id)}
                    onPointerLeave={() => setHoverId((x) => (x === h.id ? null : x))}
                    onFocus={() => setHoverId(h.id)}
                    onBlur={() => setHoverId((x) => (x === h.id ? null : x))}
                    onClick={click(() => p.onPickHotspot(h))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        p.onPickHotspot(h);
                      }
                    }}
                  />
                );
              })}
            </g>

            <g className="markers">
              {p.layers.has('people') && (
                <g className="layer-people">
                  {[...peopleAt.entries()].map(([id, set]) => {
                    const h = hotspots.find((x) => x.id === id);
                    if (!h) return null;
                    const a = hotspotAnchor(h);
                    return (
                      <PeopleBadge
                        key={id}
                        x={a[0] - 18 * unit}
                        y={a[1] + 14 * unit}
                        unit={unit}
                        people={[...set].map((c) => characterById.get(c)!)}
                        open={peopleOpen === id}
                        placeName={label(h).title}
                        onToggle={() => {
                          if (!pz.wasDrag()) setPeopleOpen((cur) => (cur === id ? null : id));
                        }}
                      />
                    );
                  })}
                </g>
              )}

              {p.layers.has('clues') && (
                <ClueLayer counts={cluesAt} hotspots={hotspots} unit={unit} click={click} onPick={p.onPickHotspot} />
              )}

              {p.layers.has('deaths') && (
                <DeathLayer
                  markers={deathMarkers}
                  unit={unit}
                  numbered={p.layers.has('investigation')}
                  selectedEventId={p.selectedEventId}
                  click={click}
                  onPickEvent={p.onPickEvent}
                />
              )}

              {p.layers.has('route') && ghost && (
                <RouteLines
                  key={`ghost-${routeKey}`}
                  steps={ghost.steps.filter((s) => visible(s))}
                  view={p.view}
                  unit={unit}
                  cls="route-ghost"
                  animate={false}
                  segMs={0}
                  current={null}
                />
              )}
              {p.layers.has('route') && p.route && (
                <RouteLines
                  key={routeKey}
                  steps={visibleSteps}
                  view={p.view}
                  unit={unit}
                  cls={routeStyle}
                  animate={!reducedMotion()}
                  segMs={segMs}
                  current={p.routeStep}
                  startDelay={settleDelay}
                />
              )}

              {meeting.selected && meeting.playing && (
                <MeetingScene key={meeting.sceneKey} uid={String(meeting.sceneKey)} unit={unit} width={W} height={H} />
              )}
              {meeting.shown && (
                <MeetingMarker
                  unit={unit}
                  selected={meeting.selected}
                  onPick={click(() => p.onPickEvent(MEETING_EVENT_ID))}
                  onActivate={() => p.onPickEvent(MEETING_EVENT_ID)}
                />
              )}

              {/* момент — поверх розы: имена участников не должны прятаться под знаком */}
              {p.moment && (
                <MomentLayer
                  view={p.view}
                  unit={unit}
                  moment={p.moment}
                  thread={p.momentThread ?? [p.moment]}
                  label={p.momentLabel ?? ''}
                  title={(e) => eventTitle(e, spoiler)}
                  isVisibleCharacter={(id) => visible(characterById.get(id)!)}
                  onPick={(id) => p.onPickEvent(id)}
                />
              )}
            </g>

            {/* «Здесь бывали» — поверх всех слоёв */}
            {peopleOpen &&
              p.layers.has('people') &&
              (() => {
                const h = hotspots.find((x) => x.id === peopleOpen);
                const set = peopleAt.get(peopleOpen);
                if (!h || !set) return null;
                const a = hotspotAnchor(h);
                const bx = a[0] - 18 * unit;
                const by = a[1] + 14 * unit;
                return (
                  <PeoplePopover
                    unit={unit}
                    people={[...set].map((c) => characterById.get(c)!)}
                    x={bx}
                    y={by}
                    below={by < H * 0.3}
                    minX={8 * unit}
                    maxX={W - 8 * unit}
                    onOpenPlace={() => {
                      setPeopleOpen(null);
                      p.onPickHotspot(h);
                    }}
                  />
                );
              })()}

            {/* Подпись зоны под курсором или выбранной */}
            {tip &&
              (() => {
                const a = hotspotAnchor(tip);
                const lb = label(tip);
                const fs = 13 * unit;
                return (
                  <g className="spot-tip" aria-hidden="true" transform={`translate(${a[0]} ${a[1] - 22 * unit})`}>
                    <text className="tip-title" textAnchor="middle" style={{ fontSize: fs }}>
                      {lb.title}
                    </text>
                    {lb.sub && (
                      <text className="tip-sub" textAnchor="middle" y={fs * 1.15} style={{ fontSize: fs * 0.8 }}>
                        {lb.sub}
                      </text>
                    )}
                  </g>
                );
              })()}
          </g>
        </g>
      </svg>

      <div className="map-zoom" role="group" aria-label="Масштаб">
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
    </div>
  );
}
