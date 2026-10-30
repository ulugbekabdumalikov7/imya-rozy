import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import abbeyPlanUrl from '../../assets/abbey-plan.webp';
import libraryPlanUrl from '../../assets/library-plan.webp';
import {
  anchorIn,
  characterById,
  clues,
  dayLabel,
  deaths,
  eventById,
  events,
  hotspotAnchor,
  hotspotIn,
  locationById,
  plans,
  routeByCharacter,
} from '../../data';
import { LIBRARY_PASSAGE_MARK, LIBRARY_RED_GLYPHS } from '../../data/planGeometry';
import type { PlanHotspot } from '../../data/plans';
import type { MapView, Route, RouteStep, StoryEvent } from '../../data/types';
import { FOOT_PATH, type Footprint, footprints } from '../../lib/footsteps';
import { happenedBy } from '../../lib/moments';
import { firstTimeThisSession, reducedMotion } from '../../lib/motion';
import { usePanZoom } from '../../lib/usePanZoom';
import { type DeathView, deathView, eventTitle } from '../../lib/visible';
import { useSpoiler } from '../../state/spoiler';
import { MEETING_EVENT_ID, MEETING_SCENE_DELAY_MS, MEETING_SCENE_MS, MeetingMarker, MeetingScene } from './MeetingRose';
import { MomentLayer } from './MomentLayer';
import { PeopleBadge, PeoplePopover } from './PeopleBadge';

const IMAGES: Record<MapView, string> = { abbey: abbeyPlanUrl, library: libraryPlanUrl };

export type LayerKey = 'arch' | 'people' | 'deaths' | 'clues' | 'route' | 'investigation';
export type FocusReason = 'event' | 'location' | 'step' | 'none';

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

const isMobile = () => {
  try {
    return window.matchMedia('(max-width: 900px)').matches;
  } catch {
    return false;
  }
};
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

  // Встреча Адсона и девушки: знак-роза на плане аббатства и короткая сцена при её открытии.
  const meetingEvent = eventById.get(MEETING_EVENT_ID);
  // в «Час за часом» роза появляется только после самой встречи
  const meetingShown =
    p.view === 'abbey' &&
    !!meetingEvent &&
    visible(meetingEvent) &&
    (!p.moment || meetingEvent.sequence <= p.moment.sequence);
  const meetingSelected = meetingShown && p.selectedEventId === MEETING_EVENT_ID;
  const [sceneKey, setSceneKey] = useState(0);
  const [scenePlaying, setScenePlaying] = useState(false);
  useEffect(() => {
    // каждое новое открытие встречи проигрывает сцену заново; при уменьшении движения сцены нет
    if (!meetingSelected || reducedMotion()) {
      setScenePlaying(false);
      return;
    }
    const start = window.setTimeout(() => {
      setSceneKey((k) => k + 1);
      setScenePlaying(true);
    }, MEETING_SCENE_DELAY_MS);
    const end = window.setTimeout(() => setScenePlaying(false), MEETING_SCENE_DELAY_MS + MEETING_SCENE_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [meetingSelected]);

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

  // Камера: событие — подлёт с приближением; шаг маршрута — перевод; зона — если план уже приближен.
  const firstFocus = useRef(true);
  useEffect(() => {
    const a = p.focusLocationId ? anchorIn(p.view, p.focusLocationId) : selected ? hotspotAnchor(selected) : null;
    if (!a) {
      firstFocus.current = false;
      return;
    }
    const mobileSheet = isMobile() && p.panelOpen;
    // на компьютере полоса «Час за часом» закрывает низ карты — место момента поднимаем выше центра
    const momentBar = !!p.moment && !p.panelOpen && !isMobile();
    const oy = mobileSheet
      ? (pz.visibleBox.y1 - pz.visibleBox.y0) * 0.36
      : momentBar
        ? (pz.visibleBox.y1 - pz.visibleBox.y0) * 0.22
        : 0;
    const go = () => {
      if (p.focusReason === 'event') pz.focus(a[0], a[1], 2, 950, false, oy);
      else if (p.focusReason === 'step') pz.focus(a[0], a[1], 1.5, 800, false, oy);
      else if (mobileSheet) pz.focus(a[0], a[1], 1.7, 700, false, oy);
      else if (pz.view.k > 1.05) pz.focus(a[0], a[1], undefined, 700);
    };
    if (firstFocus.current) {
      firstFocus.current = false;
      const t = window.setTimeout(go, settleDelay);
      return () => window.clearTimeout(t);
    }
    go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.focusKey]);

  const dayOk = (d: number) => p.dayFilter === null || d === p.dayFilter;
  const timeOk = happenedBy(p.moment);
  const momentKey = p.moment?.id ?? '';

  const deathViews = useMemo(
    () => deaths.map((d) => deathView(d, spoiler)).filter((v): v is DeathView => !!v),
    [spoiler],
  );

  const peopleAt = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of events) {
      if (!visible(e) || !e.locationId || !dayOk(e.day) || !timeOk(e.sequence)) continue;
      const h = hotspotIn(p.view, e.locationId);
      if (!h) continue;
      const set = m.get(h.id) ?? new Set<string>();
      e.characterIds.forEach((c) => visible(characterById.get(c)!) && set.add(c));
      m.set(h.id, set);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spoiler, p.view, p.dayFilter, momentKey]);

  const cluesAt = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clues) {
      if (!visible(c) || !c.locationId) continue;
      const ev = events.find((e) => e.id === c.eventId);
      if (ev && (!dayOk(ev.day) || !timeOk(ev.sequence))) continue;
      const h = hotspotIn(p.view, c.locationId);
      if (h) m.set(h.id, (m.get(h.id) ?? 0) + 1);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spoiler, p.view, p.dayFilter, momentKey]);

  const deathMarkers = useMemo(() => {
    const out: { v: DeathView; x: number; y: number; site?: { x: number; y: number } }[] = [];
    const counter = new Map<string, number>();
    for (const v of deathViews) {
      if (!dayOk(v.death.day)) continue;
      const found = eventById.get(v.death.eventId);
      if (found && !timeOk(found.sequence)) continue; // тело ещё не нашли
      const a = anchorIn(p.view, v.death.foundLocationId);
      const site = v.deathLocation ? anchorIn(p.view, v.deathLocation.locationId) : null;
      if (!a && !site) continue;
      const base = a ?? site!;
      const key = `${base[0]},${base[1]}`;
      const n = counter.get(key) ?? 0;
      counter.set(key, n + 1);
      out.push({
        v,
        x: base[0] + 14 * unit + n * 22 * unit,
        y: base[1] - 14 * unit,
        site:
          a && site && (site[0] !== a[0] || site[1] !== a[1])
            ? { x: site[0] + 12 * unit, y: site[1] + 12 * unit }
            : undefined,
      });
    }
    return out.sort((a, b) => a.v.death.day - b.v.death.day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deathViews, p.view, p.dayFilter, unit, momentKey]);

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

  // Подпись зоны при наведении/выборе: буква с плана и название.
  const label = (h: PlanHotspot) => {
    const loc = h.locationId ? locationById.get(h.locationId) : undefined;
    const known = !h.revealDay || visible({ revealDay: h.revealDay });
    const name = known ? h.name : (h.safeName ?? h.name);
    const atlasName = loc && known && visible({ revealDay: loc.revealDay ?? 0 }) ? loc.name : undefined;
    if (!h.printed) return { title: atlasName ?? name, sub: atlasName && atlasName !== name ? name : undefined };
    // У зоны с буквой главное — буква и название по легенде плана;
    // если в романе место называется иначе («Храмина» — Эдифиций), даём это второй строкой.
    const stem = (t: string) => t.toLowerCase().split(' ')[0]!.slice(0, 5);
    const differs = atlasName && stem(atlasName) !== stem(name);
    const sub = differs ? `в романе: ${atlasName}` : undefined;
    // в библиотеке буква уже входит в название («Комната «A»»)
    return { title: h.plan === 'abbey' ? `${h.printed} — ${name}` : name, sub };
  };
  const tip = hovered ?? selected;

  return (
    <div className="map-canvas" style={{ ['--plan-ratio' as string]: `${W} / ${H}` }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={`plan-svg tone-${p.tone} plan-${p.view}${p.layers.has('arch') ? ' layers-arch' : ''}${scenePlaying ? ' is-meeting-scene' : ''}`}
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
                <g className="layer-clues">
                  {[...cluesAt.entries()].map(([id, n]) => {
                    const h = hotspots.find((x) => x.id === id);
                    if (!h) return null;
                    const a = hotspotAnchor(h);
                    const s = 8 * unit;
                    return (
                      <g
                        key={id}
                        transform={`translate(${a[0] + 8 * unit} ${a[1] + 16 * unit})`}
                        onClick={click(() => p.onPickHotspot(h))}
                        className="marker marker-clue"
                      >
                        <title>{`Улики и предметы: ${n}`}</title>
                        <rect x={-s} y={-s} width={2 * s} height={2 * s} transform="rotate(45)" />
                        <text style={{ fontSize: 9.5 * unit }} textAnchor="middle" dominantBaseline="central">
                          {n}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {p.layers.has('investigation') && p.layers.has('deaths') && deathMarkers.length > 1 && (
                <polyline
                  className="investigation-thread"
                  points={deathMarkers.map((m) => `${m.x},${m.y}`).join(' ')}
                  style={{ strokeWidth: 1.4 * unit, strokeDasharray: `${5 * unit} ${5 * unit}` }}
                />
              )}

              {p.layers.has('deaths') && (
                <g className={`layer-deaths${p.layers.has('investigation') ? ' show-death-labels' : ''}`}>
                  {deathMarkers.map((m, idx) => {
                    const victim = characterById.get(m.v.death.characterId)!;
                    const sel = p.selectedEventId === m.v.death.eventId;
                    const kindLabel =
                      m.v.marker === 'unresolved'
                        ? 'обстоятельства не выяснены'
                        : m.v.marker === 'murder'
                          ? 'убийство'
                          : 'иная смерть';
                    return (
                      <g key={m.v.death.id}>
                        {m.site && (
                          <>
                            <line
                              x1={m.x}
                              y1={m.y}
                              x2={m.site.x}
                              y2={m.site.y}
                              className="death-link"
                              style={{ strokeWidth: unit, strokeDasharray: `${3 * unit} ${4 * unit}` }}
                            />
                            <g
                              transform={`translate(${m.site.x} ${m.site.y})`}
                              className="marker marker-death-site"
                              onClick={click(() => p.onPickEvent(m.v.death.eventId))}
                            >
                              <title>{`${victim.short}: место смерти`}</title>
                              <circle
                                r={8 * unit}
                                style={{ strokeWidth: 1.2 * unit, strokeDasharray: `${2.5 * unit} ${2 * unit}` }}
                              />
                              <circle r={2.5 * unit} className="dot" />
                            </g>
                          </>
                        )}
                        <g
                          transform={`translate(${m.x} ${m.y})`}
                          className={`marker marker-death marker-${m.v.marker}${sel ? ' is-selected' : ''}`}
                          role="button"
                          tabIndex={0}
                          aria-label={`${victim.short}: ${kindLabel}, ${dayLabel(m.v.death.day).toLowerCase()}`}
                          onClick={click(() => p.onPickEvent(m.v.death.eventId))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') p.onPickEvent(m.v.death.eventId);
                          }}
                          style={{ ['--pd' as string]: `${idx * 0.9}s` }}
                        >
                          <circle r={14 * unit} className="hit" />
                          <circle r={7 * unit} className="pulse" style={{ strokeWidth: unit }} />
                          <circle r={13 * unit} className="halo" style={{ strokeWidth: unit }} />
                          <g className="death-core">
                            <DeathGlyph kind={m.v.marker} u={unit} />
                          </g>
                          <text
                            x={16 * unit}
                            y={0}
                            style={{ fontSize: 11.5 * unit }}
                            dominantBaseline="middle"
                            className="marker-label"
                          >
                            {p.layers.has('investigation') ? `${idx + 1}. ` : ''}
                            {victim.short}
                            <tspan className="ml-day">
                              {' '}
                              · {m.v.death.day === 0 ? 'до прибытия' : `д. ${m.v.death.day}`}
                            </tspan>
                          </text>
                        </g>
                      </g>
                    );
                  })}
                </g>
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

              {meetingSelected && scenePlaying && (
                <MeetingScene key={sceneKey} uid={String(sceneKey)} unit={unit} width={W} height={H} />
              )}
              {meetingShown && (
                <MeetingMarker
                  unit={unit}
                  selected={meetingSelected}
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

/**
 * Маршрут: следы героя идут по той же кривой, что связывала эпизоды, шаг за шагом;
 * кружок эпизода появляется, когда к нему подходят следы.
 */
function RouteLines({
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

function DeathGlyph({ kind, u }: { kind: DeathView['marker']; u: number }) {
  const r = 7 * u;
  if (kind === 'murder')
    return (
      <>
        <circle r={r} className="glyph-bg" style={{ strokeWidth: 1.2 * u }} />
        <path
          d={`M${-r * 0.42},${-r * 0.42} L${r * 0.42},${r * 0.42} M${r * 0.42},${-r * 0.42} L${-r * 0.42},${r * 0.42}`}
          className="glyph-fg"
          style={{ strokeWidth: 1.5 * u }}
        />
      </>
    );
  if (kind === 'other')
    return (
      <>
        <circle r={r} className="glyph-bg" style={{ strokeWidth: 1.4 * u }} />
        <path
          d={`M0,${-r * 0.55} L0,${r * 0.55} M${-r * 0.34},${-r * 0.15} L${r * 0.34},${-r * 0.15}`}
          className="glyph-fg"
          style={{ strokeWidth: 1.3 * u }}
        />
      </>
    );
  return (
    <>
      <circle r={r} className="glyph-bg" style={{ strokeWidth: 1.4 * u }} />
      <text style={{ fontSize: 10 * u }} textAnchor="middle" dominantBaseline="central" className="glyph-text">
        ?
      </text>
    </>
  );
}
