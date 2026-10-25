import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Footprints, Layers, ScanLine, X } from 'lucide-react';
import {
  anchorIn, characterById, dayLabel, eventById, hotspotById, hotspotIn, isOnPlan, locationById, locations, preferredView,
  routes, routeByCharacter, viewLabels,
} from '../data';
import type { PlanHotspot } from '../data/plans';
import type { MapView } from '../data/types';
import { horizon } from '../lib/spoilers';
import { count, EPISODES } from '../lib/ru';
import { patchParams, type Route as AppRoute } from '../lib/router';
import { useSpoiler } from '../state/spoiler';
import { PlanMap, type FocusReason, type LayerKey } from './PlanMap';
import { EventCard, LocationCard } from '../components/cards';
import { AbbeyLegend, HotspotCard, PlanFacts } from '../components/PlanCards';
import { DetailPanel, LocChip } from '../components/ui';

const LAYERS: { key: LayerKey; label: string; hint: string }[] = [
  { key: 'arch', label: 'Контуры зон', hint: 'Обводка построек и комнат по плану' },
  { key: 'people', label: 'Персонажи', hint: 'Сколько героев бывало в месте' },
  { key: 'deaths', label: 'Смерти', hint: 'Места обнаружения тел и гибели' },
  { key: 'clues', label: 'Улики', hint: 'Предметы и свидетельства' },
  { key: 'route', label: 'Маршрут', hint: 'Путь выбранного героя' },
  { key: 'investigation', label: 'Режим расследования', hint: 'Нить смертей по порядку' },
];
const DEFAULT_LAYERS = 'arch,people,deaths';
const VIEWS: MapView[] = ['abbey', 'library'];
const TONE_KEY = 'rose-atlas:plan-tone';

function loadTone(): 'night' | 'scan' {
  try { return window.localStorage.getItem(TONE_KEY) === 'scan' ? 'scan' : 'night'; } catch { return 'night'; }
}

export function MapSection({ route }: { route: AppRoute }) {
  const { spoiler, visible } = useSpoiler();
  const [controlsOpen, setControlsOpen] = useState(false);
  const [tone, setTone] = useState<'night' | 'scan'>(loadTone);
  useEffect(() => { try { window.localStorage.setItem(TONE_KEY, tone); } catch { /* ignore */ } }, [tone]);

  const prm = route.params;
  const view = (VIEWS.includes(prm.get('view') as MapView) ? prm.get('view') : 'abbey') as MapView;
  const layers = new Set((prm.get('layers') ?? DEFAULT_LAYERS).split(',').filter(Boolean) as LayerKey[]);
  const locId = prm.get('loc') ?? undefined;
  const spotId = prm.get('spot') ?? undefined;
  const eventId = prm.get('event') ?? undefined;
  const routeChar = prm.get('route') ?? undefined;
  const dayParam = prm.get('day');
  const dayFilter = dayParam ? Number(dayParam) : null;
  const h = horizon(spoiler);

  const activeRoute = routeChar ? routeByCharacter.get(routeChar) : undefined;
  const routeVisible = activeRoute && visible(characterById.get(activeRoute.characterId)!) ? activeRoute : undefined;
  const steps = routeVisible ? routeVisible.steps.filter((s) => visible(s)) : [];
  const stepRaw = prm.get('step');
  const step = stepRaw !== null && steps.length ? Math.min(steps.length - 1, Math.max(0, Number(stepRaw))) : null;

  const set = (patch: Record<string, string | number | null | undefined>) => patchParams(route, patch);
  const toggleLayer = (k: LayerKey) => {
    const next = new Set(layers);
    if (next.has(k)) next.delete(k); else next.add(k);
    set({ layers: [...next].join(',') || 'none' });
  };

  /** План, на котором место видно: текущий, если оно на нём есть, иначе наиболее подробный. */
  const viewFor = (locationId: string | undefined): MapView | undefined => {
    if (!locationId || !isOnPlan(locationId)) return undefined;
    if (anchorIn(view, locationId) && preferredView(locationId) === view) return undefined;
    return preferredView(locationId);
  };

  const pickLocation = (id: string) => {
    set({ loc: id, spot: null, event: null, view: viewFor(id) });
    setControlsOpen(false);
  };
  const pickHotspot = (hs: PlanHotspot) => {
    const loc = hs.locationId ? locationById.get(hs.locationId) : undefined;
    if (loc && visible({ revealDay: loc.revealDay ?? 0 })) set({ loc: loc.id, spot: null, event: null });
    else set({ spot: hs.id, loc: null, event: null });
  };
  const pickEvent = (id: string) => {
    const e = eventById.get(id);
    const lid = e?.locationId;
    set({ event: id, loc: null, spot: null, view: lid && !anchorIn(view, lid) ? viewFor(lid) : undefined });
  };
  const pickRoute = (charId: string | null) => {
    if (!charId) return set({ route: null, step: null });
    const nextLayers = new Set(layers); nextLayers.add('route');
    set({ route: charId, step: 0, layers: [...nextLayers].join(','), loc: null, spot: null, event: null });
  };
  const goStep = (i: number) => {
    const s = steps[i];
    if (!s) return;
    set({ step: i, event: s.eventId ?? null, loc: s.eventId ? null : s.locationId, spot: null, view: anchorIn(view, s.locationId) ? undefined : viewFor(s.locationId) });
  };
  const openPlan = (v: MapView) => set({ view: v, loc: null, spot: null, event: null });

  // Что изменилось последним — от этого зависит движение камеры.
  const prev = useRef({ locId, eventId, step, spotId });
  let focusReason: FocusReason = 'none';
  if (prev.current.step !== step && step !== null) focusReason = 'step';
  else if (prev.current.eventId !== eventId && eventId) focusReason = 'event';
  else if ((prev.current.locId !== locId && locId) || (prev.current.spotId !== spotId && spotId)) focusReason = 'location';
  else if (eventId) focusReason = 'event';
  else if (step !== null) focusReason = 'step';
  // Запоминаем выбор после фиксации рендера, а не во время него: иначе двойной рендер StrictMode
  // видит уже обновлённое значение и неверно определяет причину движения камеры.
  useEffect(() => { prev.current = { locId, eventId, step, spotId }; });

  const event = eventId ? eventById.get(eventId) : undefined;
  const focusLocationId = step !== null ? steps[step]?.locationId : locId ?? event?.locationId;
  const spot = spotId ? hotspotById.get(spotId) : undefined;
  const selectedHotspot = spot?.plan === view ? spot : focusLocationId ? hotspotIn(view, focusLocationId) ?? undefined : undefined;

  const availableRoutes = useMemo(() => routes.filter((r) => visible(characterById.get(r.characterId)!) && r.steps.some((s) => visible(s))), [visible]);
  const panelOpen = !!(locId || eventId || spot);
  const currentStep = step !== null ? steps[step] : undefined;
  const offPlan = locations.filter((l) => !isOnPlan(l.id) && visible({ revealDay: l.revealDay ?? 0 }));

  const locHotspot = locId ? hotspotIn(view, locId) : null;
  const locPartOf = locHotspot && locHotspot.locationId !== locId
    ? (locHotspot.locationId ? locationById.get(locHotspot.locationId)?.name : locHotspot.name) : undefined;

  return (
    <div className="map-layout">
      <h1 className="sr-only">{viewLabels[view]}</h1>
      <div className={`map-controls${controlsOpen ? ' is-open' : ''}`} id="map-controls">
        <div className="controls-head">
          <p className="rubric" lang="la">Locus</p>
          <button type="button" className="icon-btn only-mobile" onClick={() => setControlsOpen(false)} aria-label="Скрыть настройки карты"><X size={18} /></button>
        </div>
        <fieldset className="ctl-group">
          <legend>План</legend>
          <div className="seg seg-vertical">
            {VIEWS.map((v) => (
              <button key={v} type="button" className={v === view ? 'is-active' : ''} aria-pressed={v === view} onClick={() => openPlan(v)}>{viewLabels[v]}</button>
            ))}
          </div>
          <label className="check">
            <input type="checkbox" id="plan-tone" checked={tone === 'scan'} onChange={() => setTone(tone === 'scan' ? 'night' : 'scan')} />
            <span>Исходный скан<span className="check-hint">Показать план в цветах оригинала</span></span>
          </label>
        </fieldset>

        <fieldset className="ctl-group">
          <legend>Слои</legend>
          {LAYERS.map((l) => (
            <label key={l.key} className="check">
              <input type="checkbox" id={`layer-${l.key}`} checked={layers.has(l.key)} onChange={() => toggleLayer(l.key)} />
              <span className={`legend-swatch swatch-${l.key}`} aria-hidden="true" />
              <span>{l.label}<span className="check-hint">{l.hint}</span></span>
            </label>
          ))}
        </fieldset>

        <fieldset className="ctl-group">
          <legend>События дня</legend>
          <div className="seg seg-wrap">
            <button type="button" className={dayFilter === null ? 'is-active' : ''} aria-pressed={dayFilter === null} onClick={() => set({ day: null })}>Все</button>
            {[1, 2, 3, 4, 5, 6, 7].filter((d) => d <= h).map((d) => (
              <button key={d} type="button" className={dayFilter === d ? 'is-active' : ''} aria-pressed={dayFilter === d} onClick={() => set({ day: d })} aria-label={dayLabel(d)}>{d}</button>
            ))}
          </div>
        </fieldset>

        <fieldset className="ctl-group">
          <legend>Маршрут героя</legend>
          <select id="route-select" value={routeVisible?.characterId ?? ''} onChange={(e) => pickRoute(e.target.value || null)}>
            <option value="">— не показывать —</option>
            {availableRoutes.map((r) => <option key={r.id} value={r.characterId}>{characterById.get(r.characterId)!.name}</option>)}
          </select>
          <p className="small muted">Сплошная линия — по тексту, пунктир — реконструкция, «?» — где герой был, неизвестно. Эпизоды внутри Эдифиция на плане аббатства сходятся в одну точку.</p>
        </fieldset>

        <div className="legend" aria-label="Обозначения смертей">
          <p className="legend-title">Обозначения смертей</p>
          <ul>
            <li><span className="lg lg-unresolved" aria-hidden="true">?</span> Обстоятельства не выяснены</li>
            <li><span className="lg lg-murder" aria-hidden="true">✕</span> Убийство</li>
            <li><span className="lg lg-other" aria-hidden="true">✝</span> Иная смерть</li>
            <li><span className="lg lg-site" aria-hidden="true" /> Место смерти, если отличается</li>
          </ul>
        </div>
      </div>

      <div className="map-stage">
        <div className="map-toolbar">
          <button type="button" className="btn btn-small only-mobile" onClick={() => setControlsOpen(true)} aria-expanded={controlsOpen} aria-controls="map-controls">
            <Layers size={15} aria-hidden="true" /> Слои
          </button>
          <div className="seg seg-compact" role="group" aria-label="План">
            {VIEWS.map((v) => (
              <button key={v} type="button" className={v === view ? 'is-active' : ''} aria-pressed={v === view} onClick={() => openPlan(v)}>
                {v === 'abbey' ? 'Аббатство' : 'Библиотека'}
              </button>
            ))}
          </div>
          {view === 'library' && (
            <button type="button" className="btn btn-small" onClick={() => set({ view: 'abbey', loc: 'aedificium', spot: null, event: null })}>
              <ArrowLeft size={14} aria-hidden="true" /> <span className="only-desktop">К Эдифицию на плане аббатства</span><span className="only-mobile">Назад</span>
            </button>
          )}
          <button type="button" className={`icon-btn tone-btn only-desktop${tone === 'scan' ? ' is-on' : ''}`} onClick={() => setTone(tone === 'scan' ? 'night' : 'scan')} aria-pressed={tone === 'scan'} title="Исходный скан / ночная гамма" aria-label="Исходный скан">
            <ScanLine size={16} />
          </button>
          <p className="map-view-title only-desktop">{dayFilter ? dayLabel(dayFilter) : ''}</p>
        </div>

        <PlanMap
          view={view}
          layers={layers}
          selectedSpot={selectedHotspot?.id}
          selectedEventId={eventId}
          dayFilter={dayFilter}
          route={layers.has('route') ? routeVisible : undefined}
          routeStep={step}
          tone={tone}
          onPickHotspot={pickHotspot}
          onPickEvent={pickEvent}
          focusKey={`${locId}|${spotId}|${eventId}|${step}|${view}`}
          focusReason={focusReason}
          focusLocationId={focusLocationId}
          panelOpen={panelOpen}
        />

        {routeVisible && layers.has('route') && (
          <div className="route-bar" role="region" aria-label={`Маршрут: ${characterById.get(routeVisible.characterId)!.short}`}>
            <Footprints size={16} aria-hidden="true" />
            <button type="button" className="icon-btn" disabled={!step} onClick={() => goStep((step ?? 0) - 1)} aria-label="Предыдущий эпизод"><ChevronLeft size={18} /></button>
            <div className="route-bar-text">
              <strong>{step !== null ? `${step + 1} / ${steps.length}` : count(steps.length, EPISODES)}</strong>
              {currentStep && (
                <span>
                  {dayLabel(currentStep.day)} · {locationById.get(currentStep.locationId)!.name} — {currentStep.note}
                  {currentStep.kind !== 'confirmed' && <em className="route-kind"> ({currentStep.kind === 'gap' ? 'пропуск в тексте' : 'реконструкция'})</em>}
                  {!isOnPlan(currentStep.locationId) && <em className="route-kind"> (места нет на планах)</em>}
                </span>
              )}
            </div>
            <button type="button" className="btn btn-small btn-accent" disabled={step !== null && step >= steps.length - 1} onClick={() => goStep(step === null ? 0 : step + 1)}>
              Следующий эпизод <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn" onClick={() => pickRoute(null)} aria-label="Скрыть маршрут"><X size={16} /></button>
          </div>
        )}
      </div>

      <DetailPanel open={panelOpen} onClose={() => set({ loc: null, spot: null, event: null })} label="Подробности">
        {event ? (
          <EventCard key={event.id} id={event.id} context="map" onPickEvent={pickEvent} onPickLocation={pickLocation} />
        ) : locId ? (
          <div key={locId}>
            <LocationCard id={locId} onPickEvent={pickEvent} onPickLocation={pickLocation} onPickRoute={pickRoute} onOpenView={openPlan}
              planBlock={locHotspot ? <PlanFacts h={locHotspot} asPartOf={locPartOf} onOpenPlan={openPlan} /> : undefined} />
          </div>
        ) : spot ? (
          <HotspotCard key={spot.id} h={spot} onOpenPlan={openPlan} onPickLocation={pickLocation} />
        ) : null}
      </DetailPanel>
      {!panelOpen && (
        <aside className="map-hint only-desktop" aria-label="Подсказка">
          <p className="rubric" lang="la">Ad lectorem</p>
          {view === 'abbey' ? (
            <>
              <p>Это план из книги. Каждая постройка, сад и участок местности — отдельная зона: нажмите на неё, чтобы увидеть надпись на плане, описание и связанные события. Эдифиций открывает план библиотеки.</p>
              <AbbeyLegend />
            </>
          ) : (
            <>
              <p>План верхнего этажа Эдифиция: 56 комнат, у 54 есть буква. Буквы, нарисованные на плане красным, в ночной гамме окрашены бордовым. Подписи стран — так, как они напечатаны на плане.</p>
              <p className="small muted">Дверные проёмы на плане показаны разрывами в стенах; атлас их не пересказывает и не прокладывает пути между комнатами.</p>
            </>
          )}
          {offPlan.length > 0 && (
            <div className="chip-block">
              <h4>Нет на планах</h4>
              <div className="chips">{offPlan.map((l) => <LocChip key={l.id} id={l.id} onPick={pickLocation} />)}</div>
            </div>
          )}
          <p className="small muted">Колесо мыши или щипок — масштаб, перетаскивание — перемещение.</p>
        </aside>
      )}
    </div>
  );
}
