import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Footprints,
  Layers,
  Pause,
  Play,
  ScanLine,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { EventCard, LocationCard } from '../components/cards';
import { AbbeyLegend, HotspotCard, PlanFacts } from '../components/PlanCards';
import { DetailPanel, LocChip } from '../components/ui';
import {
  anchorIn,
  characterById,
  dayLabel,
  eventById,
  hotspotById,
  hotspotIn,
  isOnPlan,
  locationById,
  locations,
  preferredView,
  routeByCharacter,
  routes,
  viewLabels,
} from '../data';
import type { PlanHotspot } from '../data/plans';
import type { MapView } from '../data/types';
import { dayMarks, dayThread, firstMomentOfDay, momentLabel, momentSteps, resolveMoment } from '../lib/moments';
import { reducedMotion } from '../lib/motion';
import { href, patchParams, type Route as AppRoute } from '../lib/router';
import { count, EPISODES } from '../lib/ru';
import { horizon } from '../lib/spoilers';
import { type Theme, useTheme } from '../lib/theme';
import { eventTitle } from '../lib/visible';
import { useSpoiler } from '../state/spoiler';
import { type FocusReason, type LayerKey, PlanMap } from './PlanMap';

const LAYERS: { key: LayerKey; label: string; hint: string }[] = [
  { key: 'arch', label: 'Контуры зон', hint: 'Обводка построек и комнат по плану' },
  { key: 'people', label: 'Персонажи', hint: 'Сколько героев бывало в месте; нажмите — имена' },
  { key: 'deaths', label: 'Смерти', hint: 'Места обнаружения тел и гибели' },
  { key: 'clues', label: 'Улики', hint: 'Предметы и свидетельства' },
  { key: 'route', label: 'Маршрут', hint: 'Путь выбранного героя' },
  { key: 'investigation', label: 'Режим расследования', hint: 'Нить смертей по порядку' },
];
const DEFAULT_LAYERS = 'arch,people,deaths';
/** «Час за часом»: пауза между моментами при воспроизведении. */
const PLAY_MS = 2600;
const dayShort = (d: number) => (d === 0 ? 'Пролог' : d === 8 ? 'Эп.' : String(d));
const VIEWS: MapView[] = ['abbey', 'library'];
const TONE_KEY = 'rose-atlas:plan-tone';
type Tone = 'night' | 'scan';

/** Гамма плана запоминается отдельно для каждой темы: по умолчанию ночная — в тёмной, исходный скан — в светлой. */
function loadTone(theme: Theme): Tone {
  try {
    const v = window.localStorage.getItem(theme === 'dark' ? TONE_KEY : `${TONE_KEY}:${theme}`);
    if (v === 'scan' || v === 'night') return v;
  } catch {
    /* хранилище недоступно */
  }
  return theme === 'light' ? 'scan' : 'night';
}

export function MapSection({ route }: { route: AppRoute }) {
  const { spoiler, visible } = useSpoiler();
  const [controlsOpen, setControlsOpen] = useState(false);
  const theme = useTheme();
  const [tones, setTones] = useState<Record<Theme, Tone>>(() => ({ dark: loadTone('dark'), light: loadTone('light') }));
  const tone = tones[theme];
  const setTone = (v: Tone) => {
    setTones((t) => ({ ...t, [theme]: v }));
    try {
      window.localStorage.setItem(theme === 'dark' ? TONE_KEY : `${TONE_KEY}:${theme}`, v);
    } catch {
      /* ignore */
    }
  };

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

  // «Час за часом»: текущий момент в адресе (?at=событие), шаги — события в порядке романа.
  const moments = useMemo(() => momentSteps(spoiler), [spoiler]);
  const atId = prm.get('at');
  const now = resolveMoment(atId, moments);
  const moment = now?.event;
  const thread = moment ? dayThread(moment, moments) : undefined;
  const [playing, setPlaying] = useState(false);

  const set = (patch: Record<string, string | number | null | undefined>) => patchParams(route, patch);
  const toggleLayer = (k: LayerKey) => {
    const next = new Set(layers);
    if (next.has(k)) next.delete(k);
    else next.add(k);
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
    const nextLayers = new Set(layers);
    nextLayers.add('route');
    set({ route: charId, step: 0, layers: [...nextLayers].join(','), loc: null, spot: null, event: null });
  };
  const goStep = (i: number) => {
    const s = steps[i];
    if (!s) return;
    set({
      step: i,
      event: s.eventId ?? null,
      loc: s.eventId ? null : s.locationId,
      spot: null,
      view: anchorIn(view, s.locationId) ? undefined : viewFor(s.locationId),
    });
  };
  const openPlan = (v: MapView) => set({ view: v, loc: null, spot: null, event: null });

  const goMoment = (i: number) => {
    const e = moments[i];
    if (!e) return;
    const lid = e.locationId;
    set({
      at: e.id,
      day: null,
      loc: null,
      spot: null,
      event: null,
      view: lid && !anchorIn(view, lid) ? viewFor(lid) : undefined,
    });
  };
  const startMoments = () => {
    const first = (dayFilter !== null ? firstMomentOfDay(dayFilter, moments) : undefined) ?? moments[0];
    if (!first) return;
    set({ at: first.id, day: null, loc: null, spot: null, event: null });
    setControlsOpen(false);
  };
  const stopMoments = () => {
    setPlaying(false);
    set({ at: null });
  };

  // Воспроизведение: шаг за шагом до конца прочитанного, затем остановка.
  useEffect(() => {
    if (!playing || !now) return;
    if (now.index >= moments.length - 1) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => goMoment(now.index + 1), reducedMotion() ? PLAY_MS + 800 : PLAY_MS);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, now?.index, moments.length]);
  useEffect(() => {
    if (!moment) setPlaying(false);
  }, [moment]);

  // Что изменилось последним — от этого зависит движение камеры.
  const prev = useRef({ locId, eventId, step, spotId, at: moment?.id });
  let focusReason: FocusReason = 'none';
  if (prev.current.at !== moment?.id && moment && !eventId && !locId) focusReason = 'step';
  else if (prev.current.step !== step && step !== null) focusReason = 'step';
  else if (prev.current.eventId !== eventId && eventId) focusReason = 'event';
  else if ((prev.current.locId !== locId && locId) || (prev.current.spotId !== spotId && spotId))
    focusReason = 'location';
  else if (eventId) focusReason = 'event';
  else if (step !== null) focusReason = 'step';
  // Запоминаем выбор после фиксации рендера, а не во время него: иначе двойной рендер StrictMode
  // видит уже обновлённое значение и неверно определяет причину движения камеры.
  useEffect(() => {
    prev.current = { locId, eventId, step, spotId, at: moment?.id };
  });

  const event = eventId ? eventById.get(eventId) : undefined;
  // Выбранное место подсвечивается зоной плана; момент «Час за часом» — только ведёт камеру (у него своё кольцо и подпись).
  const selectedLocationId = step !== null ? steps[step]?.locationId : (locId ?? event?.locationId);
  const focusLocationId = selectedLocationId ?? moment?.locationId;
  const spot = spotId ? hotspotById.get(spotId) : undefined;
  const selectedHotspot =
    spot?.plan === view ? spot : selectedLocationId ? (hotspotIn(view, selectedLocationId) ?? undefined) : undefined;

  const availableRoutes = useMemo(
    () => routes.filter((r) => visible(characterById.get(r.characterId)!) && r.steps.some((s) => visible(s))),
    [visible],
  );
  const panelOpen = !!(locId || eventId || spot);
  const currentStep = step !== null ? steps[step] : undefined;
  const offPlan = locations.filter((l) => !isOnPlan(l.id) && visible({ revealDay: l.revealDay ?? 0 }));

  const locHotspot = locId ? hotspotIn(view, locId) : null;
  const locPartOf =
    locHotspot && locHotspot.locationId !== locId
      ? locHotspot.locationId
        ? locationById.get(locHotspot.locationId)?.name
        : locHotspot.name
      : undefined;

  return (
    <div className="map-layout">
      <h1 className="sr-only">{viewLabels[view]}</h1>
      <div className={`map-controls${controlsOpen ? ' is-open' : ''}`} id="map-controls">
        <div className="controls-head">
          <p className="rubric" lang="la">
            Locus
          </p>
          <button
            type="button"
            className="icon-btn only-mobile"
            onClick={() => setControlsOpen(false)}
            aria-label="Скрыть настройки карты"
          >
            <X size={18} />
          </button>
        </div>
        <fieldset className="ctl-group">
          <legend>План</legend>
          <div className="seg seg-vertical">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                className={v === view ? 'is-active' : ''}
                aria-pressed={v === view}
                onClick={() => openPlan(v)}
              >
                {viewLabels[v]}
              </button>
            ))}
          </div>
          <label className="check">
            <input
              type="checkbox"
              id="plan-tone"
              checked={tone === 'scan'}
              onChange={() => setTone(tone === 'scan' ? 'night' : 'scan')}
            />
            <span>
              Исходный скан<span className="check-hint">Показать план в цветах оригинала</span>
            </span>
          </label>
        </fieldset>

        <fieldset className="ctl-group">
          <legend>Слои</legend>
          {LAYERS.map((l) => (
            <label key={l.key} className="check">
              <input
                type="checkbox"
                id={`layer-${l.key}`}
                checked={layers.has(l.key)}
                onChange={() => toggleLayer(l.key)}
              />
              <span className={`legend-swatch swatch-${l.key}`} aria-hidden="true" />
              <span>
                {l.label}
                <span className="check-hint">{l.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <fieldset className="ctl-group">
          <legend>События дня</legend>
          <div className="seg seg-wrap">
            <button
              type="button"
              className={dayFilter === null ? 'is-active' : ''}
              aria-pressed={dayFilter === null}
              onClick={() => set({ day: null })}
            >
              Все
            </button>
            {[1, 2, 3, 4, 5, 6, 7]
              .filter((d) => d <= h)
              .map((d) => (
                <button
                  key={d}
                  type="button"
                  className={dayFilter === d ? 'is-active' : ''}
                  aria-pressed={dayFilter === d}
                  onClick={() => set({ day: d })}
                  aria-label={dayLabel(d)}
                >
                  {d}
                </button>
              ))}
          </div>
        </fieldset>

        <fieldset className="ctl-group">
          <legend>Маршрут героя</legend>
          <select
            id="route-select"
            value={routeVisible?.characterId ?? ''}
            onChange={(e) => pickRoute(e.target.value || null)}
          >
            <option value="">— не показывать —</option>
            {availableRoutes.map((r) => (
              <option key={r.id} value={r.characterId}>
                {characterById.get(r.characterId)!.name}
              </option>
            ))}
          </select>
          <p className="small muted">
            Отпечатки следов — путь по тексту, контуры следов — реконструкция, «?» — где герой был, неизвестно. Эпизоды
            внутри Эдифиция на плане аббатства сходятся в одну точку.
          </p>
        </fieldset>

        <div className="legend" aria-label="Обозначения смертей">
          <p className="legend-title">Обозначения смертей</p>
          <ul>
            <li>
              <span className="lg lg-unresolved" aria-hidden="true">
                ?
              </span>{' '}
              Обстоятельства не выяснены
            </li>
            <li>
              <span className="lg lg-murder" aria-hidden="true">
                ✕
              </span>{' '}
              Убийство
            </li>
            <li>
              <span className="lg lg-other" aria-hidden="true">
                ✝
              </span>{' '}
              Иная смерть
            </li>
            <li>
              <span className="lg lg-site" aria-hidden="true" /> Место смерти, если отличается
            </li>
          </ul>
        </div>
      </div>

      <div className="map-stage">
        <div className="map-toolbar">
          <button
            type="button"
            className="btn btn-small only-mobile"
            onClick={() => setControlsOpen(true)}
            aria-expanded={controlsOpen}
            aria-controls="map-controls"
          >
            <Layers size={15} aria-hidden="true" /> Слои
          </button>
          <div className="seg seg-compact" role="group" aria-label="План">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                className={v === view ? 'is-active' : ''}
                aria-pressed={v === view}
                onClick={() => openPlan(v)}
              >
                {v === 'abbey' ? 'Аббатство' : 'Библиотека'}
              </button>
            ))}
          </div>
          {view === 'library' && (
            <button
              type="button"
              className="btn btn-small"
              onClick={() => set({ view: 'abbey', loc: 'aedificium', spot: null, event: null })}
            >
              <ArrowLeft size={14} aria-hidden="true" />{' '}
              <span className="only-desktop">К Эдифицию на плане аббатства</span>
              <span className="only-mobile">Назад</span>
            </button>
          )}
          <button
            type="button"
            className={`icon-btn tone-btn only-desktop${tone === 'scan' ? ' is-on' : ''}`}
            onClick={() => setTone(tone === 'scan' ? 'night' : 'scan')}
            aria-pressed={tone === 'scan'}
            title="Исходный скан / ночная гамма"
            aria-label="Исходный скан"
          >
            <ScanLine size={16} />
          </button>
          <button
            type="button"
            className={`btn btn-small moment-toggle${moment ? ' is-on' : ''}`}
            onClick={() => (moment ? stopMoments() : startMoments())}
            aria-pressed={!!moment}
            title="Пройти роман по часам: что где происходит и что уже случилось к этому моменту"
          >
            <Clock3 size={15} aria-hidden="true" /> <span className="only-desktop">Час за часом</span>
            <span className="only-mobile">Часы</span>
          </button>
          <p className="map-view-title only-desktop">{dayFilter && !moment ? dayLabel(dayFilter) : ''}</p>
        </div>

        <PlanMap
          view={view}
          layers={layers}
          selectedSpot={selectedHotspot?.id}
          selectedEventId={eventId}
          dayFilter={moment ? null : dayFilter}
          route={layers.has('route') ? routeVisible : undefined}
          routeStep={step}
          tone={tone}
          onPickHotspot={pickHotspot}
          onPickEvent={pickEvent}
          focusKey={`${locId}|${spotId}|${eventId}|${step}|${view}|${moment?.id ?? ''}`}
          focusReason={focusReason}
          focusLocationId={focusLocationId}
          panelOpen={panelOpen}
          moment={moment}
          momentThread={thread}
          momentLabel={moment ? momentLabel(moment) : undefined}
        />

        {moment && now && (
          <div className="time-bar" role="region" aria-label="Час за часом">
            <div className="time-row">
              <button
                type="button"
                className="icon-btn time-play"
                onClick={() => setPlaying((v) => !v)}
                disabled={!playing && now.index >= moments.length - 1}
                aria-label={playing ? 'Пауза' : 'Воспроизвести по часам'}
                aria-pressed={playing}
              >
                {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className="icon-btn"
                disabled={now.index === 0}
                onClick={() => {
                  setPlaying(false);
                  goMoment(now.index - 1);
                }}
                aria-label="Предыдущий момент"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                className="icon-btn"
                disabled={now.index >= moments.length - 1}
                onClick={() => {
                  setPlaying(false);
                  goMoment(now.index + 1);
                }}
                aria-label="Следующий момент"
              >
                <ChevronRight size={18} />
              </button>
              <div className="time-text" aria-live="polite">
                <span className="time-when">
                  {momentLabel(moment)}
                  {moment.locationId ? ` · ${locationById.get(moment.locationId)!.name}` : ''} · {now.index + 1} /{' '}
                  {moments.length}
                </span>
                <strong className="time-title">{eventTitle(moment, spoiler)}</strong>
              </div>
              <button type="button" className="icon-btn" onClick={stopMoments} aria-label="Закрыть «Час за часом»">
                <X size={16} />
              </button>
            </div>
            <div className="time-scale">
              <input
                type="range"
                className="time-range"
                min={0}
                max={Math.max(0, moments.length - 1)}
                step={1}
                value={now.index}
                onChange={(e) => {
                  setPlaying(false);
                  goMoment(Number(e.target.value));
                }}
                aria-label="Момент романа"
                aria-valuetext={`${momentLabel(moment)}: ${eventTitle(moment, spoiler)}`}
                style={{ ['--p' as string]: `${moments.length > 1 ? (now.index / (moments.length - 1)) * 100 : 0}%` }}
              />
              <div className="time-days" aria-hidden="true">
                {dayMarks(moments).map((m) => (
                  <button
                    key={m.day}
                    type="button"
                    tabIndex={-1}
                    className={moment.day === m.day ? 'is-current' : ''}
                    style={{ left: `${moments.length > 1 ? (m.index / (moments.length - 1)) * 100 : 0}%` }}
                    onClick={() => {
                      setPlaying(false);
                      goMoment(m.index);
                    }}
                  >
                    {dayShort(m.day)}
                  </button>
                ))}
              </div>
            </div>
            <div className="time-meta">
              <span className="time-desc">{moment.description}</span>
              <span className="time-links">
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setPlaying(false);
                    pickEvent(moment.id);
                  }}
                >
                  Подробнее
                </button>
                <a href={href('timeline', { d: moment.day, event: moment.id })}>В хронологии</a>
                {moment.day >= 1 && moment.day <= 7 && (
                  <a href={href('relations', { upto: moment.day })}>Связи к этому дню</a>
                )}
              </span>
            </div>
          </div>
        )}

        {routeVisible && layers.has('route') && !moment && (
          <div
            className="route-bar"
            role="region"
            aria-label={`Маршрут: ${characterById.get(routeVisible.characterId)!.short}`}
          >
            <Footprints size={16} aria-hidden="true" />
            <button
              type="button"
              className="icon-btn"
              disabled={!step}
              onClick={() => goStep((step ?? 0) - 1)}
              aria-label="Предыдущий эпизод"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="route-bar-text">
              <strong>{step !== null ? `${step + 1} / ${steps.length}` : count(steps.length, EPISODES)}</strong>
              {currentStep && (
                <span>
                  {dayLabel(currentStep.day)} · {locationById.get(currentStep.locationId)!.name} — {currentStep.note}
                  {currentStep.kind !== 'confirmed' && (
                    <em className="route-kind">
                      {' '}
                      ({currentStep.kind === 'gap' ? 'пропуск в тексте' : 'реконструкция'})
                    </em>
                  )}
                  {!isOnPlan(currentStep.locationId) && <em className="route-kind"> (места нет на планах)</em>}
                </span>
              )}
            </div>
            <button
              type="button"
              className="btn btn-small btn-accent"
              disabled={step !== null && step >= steps.length - 1}
              onClick={() => goStep(step === null ? 0 : step + 1)}
            >
              Следующий эпизод <ChevronRight size={16} aria-hidden="true" />
            </button>
            <button type="button" className="icon-btn" onClick={() => pickRoute(null)} aria-label="Скрыть маршрут">
              <X size={16} />
            </button>
          </div>
        )}
      </div>

      <DetailPanel open={panelOpen} onClose={() => set({ loc: null, spot: null, event: null })} label="Подробности">
        {event ? (
          <EventCard key={event.id} id={event.id} context="map" onPickEvent={pickEvent} onPickLocation={pickLocation} />
        ) : locId ? (
          <div key={locId}>
            <LocationCard
              id={locId}
              onPickEvent={pickEvent}
              onPickLocation={pickLocation}
              onPickRoute={pickRoute}
              onOpenView={openPlan}
              planBlock={
                locHotspot ? <PlanFacts h={locHotspot} asPartOf={locPartOf} onOpenPlan={openPlan} /> : undefined
              }
            />
          </div>
        ) : spot ? (
          <HotspotCard key={spot.id} h={spot} onOpenPlan={openPlan} onPickLocation={pickLocation} />
        ) : null}
      </DetailPanel>
      {!panelOpen && (
        <aside className="map-hint" aria-label="Подсказка">
          <p className="rubric" lang="la">
            Ad lectorem
          </p>
          {view === 'abbey' ? (
            <>
              <p>
                Это план из книги. Каждая постройка, сад и участок местности — отдельная зона: нажмите на неё, чтобы
                увидеть надпись на плане, описание и связанные события. Эдифиций открывает план библиотеки.
              </p>
              <AbbeyLegend />
            </>
          ) : (
            <>
              <p>
                План верхнего этажа Эдифиция: 56 комнат, у 54 есть буква. Буквы, нарисованные на плане красным, в ночной
                гамме окрашены бордовым. Подписи стран — так, как они напечатаны на плане.
              </p>
              <p className="small muted">
                Дверные проёмы на плане показаны разрывами в стенах; атлас их не пересказывает и не прокладывает пути
                между комнатами.
              </p>
            </>
          )}
          {offPlan.length > 0 && (
            <div className="chip-block">
              <h4>Нет на планах</h4>
              <div className="chips">
                {offPlan.map((l) => (
                  <LocChip key={l.id} id={l.id} onPick={pickLocation} />
                ))}
              </div>
            </div>
          )}
          <p className="small muted">Колесо мыши или щипок — масштаб, перетаскивание — перемещение.</p>
        </aside>
      )}
    </div>
  );
}
