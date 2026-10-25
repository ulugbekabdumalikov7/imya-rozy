import { useEffect, useRef, useState } from 'react';
import { Lock, MapPin, Skull } from 'lucide-react';
import { useSwap, DURATION, reducedMotion } from '../lib/motion';
import { days, descendantsOf, eventById, eventsSorted, hourLabels, hourOrder, locationById } from '../data';
import type { StoryEvent } from '../data/types';
import { horizon } from '../lib/spoilers';
import { patchParams, type Route as AppRoute } from '../lib/router';
import { eventTitle, visibleTexts } from '../lib/visible';
import { useSpoiler } from '../state/spoiler';
import { EventCard } from '../components/cards';
import { DetailPanel, SectionHead } from '../components/ui';

const LIBRARY_SCOPE = new Set(descendantsOf('library').concat(['scriptorium']));

const FILTERS: { key: string; label: string; test: (e: StoryEvent) => boolean }[] = [
  { key: 'death', label: 'Смерти', test: (e) => e.kinds.includes('death') },
  { key: 'discovery', label: 'Обнаружение тел', test: (e) => e.kinds.includes('discovery') },
  { key: 'investigators', label: 'Вильгельм и Адсон', test: (e) => e.characterIds.includes('william') || e.characterIds.includes('adso') },
  { key: 'library', label: 'Библиотека', test: (e) => e.kinds.includes('library') || (!!e.locationId && LIBRARY_SCOPE.has(e.locationId)) },
  { key: 'meeting', label: 'Ключевые встречи', test: (e) => e.kinds.includes('meeting') },
  { key: 'clue', label: 'Появление улик', test: (e) => e.kinds.includes('clue') || e.clueIds.length > 0 },
  { key: 'political', label: 'Политика и вера', test: (e) => e.kinds.includes('political') || e.kinds.includes('trial') },
  { key: 'finale', label: 'Финал', test: (e) => e.kinds.includes('finale') || e.kinds.includes('epilogue') },
];

export function TimelineSection({ route }: { route: AppRoute }) {
  const { spoiler, visible } = useSpoiler();
  const active = new Set((route.params.get('f') ?? '').split(',').filter(Boolean));
  const locFilter = route.params.get('loc');
  const eventId = route.params.get('event');
  const set = (patch: Record<string, string | null>) => patchParams(route, patch);
  const scope = locFilter ? new Set(descendantsOf(locFilter)) : null;
  const h = horizon(spoiler);

  // Выбранный день; если пришли к событию другого дня — показываем все дни.
  const dParam = route.params.get('d');
  const arrivedEvent = eventId ? eventById.get(eventId) : undefined;
  const dayFilter = dParam !== null && !(arrivedEvent && String(arrivedEvent.day) !== dParam) ? Number(dParam) : null;

  const evs = eventsSorted.filter((e) => visible(e))
    .filter((e) => dayFilter === null || e.day === dayFilter)
    .filter((e) => !active.size || FILTERS.some((f) => active.has(f.key) && f.test(e)))
    .filter((e) => !scope || (e.locationId && scope.has(e.locationId)));

  // Старые события уходят, новые проявляются: смена дня, фильтров или режима.
  const listKey = `${dayFilter}|${[...active].sort().join(',')}|${locFilter}|${spoiler.mode}${spoiler.day}`;
  const { shown, phase, shownKey } = useSwap(evs, listKey, DURATION.fast);

  // Пришли к событию извне (с карты, из досье): прокрутить к нему и коротко отметить.
  const internal = useRef(false);
  const [arrived, setArrived] = useState<string | null>(null);
  useEffect(() => {
    if (!eventId) return;
    if (internal.current) { internal.current = false; return; }
    const t = window.setTimeout(() => {
      document.getElementById(`ev-${eventId}`)?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
      setArrived(eventId);
    }, DURATION.medium);
    const t2 = window.setTimeout(() => setArrived(null), 2400);
    return () => { window.clearTimeout(t); window.clearTimeout(t2); };
  }, [eventId]);
  const pick = (id: string) => { internal.current = true; set({ event: id }); };

  const toggle = (k: string) => {
    const n = new Set(active);
    if (n.has(k)) n.delete(k); else n.add(k);
    set({ f: [...n].join(',') || null });
  };

  return (
    <div className="page page-wide timeline-page">
      <SectionHead latin="Tempus" title="Ход расследования">
        <p>Семь дней, разделённых службами канонических часов. Где роман не называет час, событие стоит в конце дня с пометкой «время не уточнено».</p>
      </SectionHead>

      <div className="filters">
        <div className="chips" role="group" aria-label="Фильтры событий">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={`chip${active.has(f.key) ? ' is-active' : ''}`} aria-pressed={active.has(f.key)} onClick={() => toggle(f.key)}>{f.label}</button>
          ))}
          {(active.size > 0 || locFilter) && <button type="button" className="chip chip-clear" onClick={() => set({ f: null, loc: null })}>Сбросить</button>}
        </div>
        {locFilter && <p className="small"><MapPin size={14} aria-hidden="true" /> Только место: <strong>{locationById.get(locFilter)?.name}</strong></p>}
      </div>

      <div className="day-strip" role="group" aria-label="День">
        <button type="button" className={dayFilter === null ? 'is-active' : ''} aria-pressed={dayFilter === null} onClick={() => set({ d: null })}>Все дни</button>
        {days.map((d) => {
          const open = d.day <= Math.max(1, h) && (d.day < 7 || h >= 7);
          const label = d.day === 0 ? 'Пролог' : d.day === 8 ? 'Эпилог' : String(d.day);
          return open
            ? <button key={d.day} type="button" className={dayFilter === d.day ? 'is-active' : ''} aria-pressed={dayFilter === d.day} onClick={() => set({ d: String(d.day), event: null })} aria-label={d.title}>{label}</button>
            : <span key={d.day} className="is-locked" title="Откроется позже"><Lock size={12} aria-hidden="true" /> {d.day === 8 ? 'Эп.' : d.day}</span>;
        })}
      </div>

      <div className="timeline-layout">
        <div className={`timeline tl-swap${phase === 'out' ? ' is-out' : ''}`} key={shownKey}>
          {days.filter((d) => dayFilter === null || d.day === dayFilter).map((d) => {
            const dayEvents = shown.filter((e) => e.day === d.day);
            const summary = visibleTexts(d.summary, spoiler);
            if (!summary.length && !dayEvents.length) return null;
            return (
              <section key={d.day} id={`day-${d.day}`} className="tl-day" aria-labelledby={`day-h-${d.day}`}>
                <header className="tl-day-head">
                  <span className="tl-day-num" aria-hidden="true">{d.day === 0 ? '·' : d.day === 8 ? '∞' : ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][d.day]}</span>
                  <div>
                    <h2 id={`day-h-${d.day}`}>{d.title}</h2>
                    {summary.map((s, i) => <p key={i} className="small muted">{s.text}</p>)}
                  </div>
                </header>
                {dayEvents.length === 0 ? <p className="muted small tl-none">Нет событий под выбранный фильтр.</p> : (
                  <ol className="tl-events">
                    {hourOrder.flatMap((hr) => dayEvents.filter((e) => e.hour === hr)).map((e, i) => { const hr = e.hour; return (
                      <li key={e.id} id={`ev-${e.id}`} style={{ ['--i' as string]: Math.min(i, 12) }} className={`tl-event${e.kinds.includes('death') ? ' is-death' : ''}${eventId === e.id ? ' is-selected' : ''}${arrived === e.id ? ' is-arrived' : ''}`}>
                        <span className="tl-hour">{hourLabels[hr]}</span>
                        <button type="button" className="tl-card" onClick={() => pick(e.id)} aria-pressed={eventId === e.id}>
                          <span className="tl-title">{e.kinds.includes('death') && <Skull size={14} aria-hidden="true" />} {eventTitle(e, spoiler)}</span>
                          <span className="tl-desc">{e.description}</span>
                          {e.locationId && <span className="tl-place"><MapPin size={12} aria-hidden="true" /> {locationById.get(e.locationId)!.name}</span>}
                        </button>
                      </li>
                    ); })}
                  </ol>
                )}
              </section>
            );
          })}
          {shown.length === 0 && <p className="empty">Нет событий, подходящих под фильтр на этом этапе чтения.</p>}
          {spoiler.mode !== 'full' && <p className="withheld-note"><Lock size={14} aria-hidden="true" /> Дальнейшие события скрыты режимом чтения. Его можно изменить в шапке.</p>}
        </div>

        <DetailPanel open={!!eventId} onClose={() => set({ event: null })} label="Событие">
          {eventId && <EventCard key={eventId} id={eventId} context="timeline" onPickEvent={(id) => set({ event: id })} />}
        </DetailPanel>
      </div>
    </div>
  );
}
