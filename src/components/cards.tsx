import { ArrowLeft, ArrowRight, Clock3, Footprints, Map as MapIcon, Search, Skull } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  characterById,
  clueById,
  cluesAtLocation,
  deaths,
  descendantsOf,
  eventById,
  eventsAtLocation,
  eventsSorted,
  isOnPlan,
  locationById,
  preferredView,
  relationLabels,
  relationshipById,
  relationships,
  routes,
  sourceById,
} from '../data';
import type { LocationType, MapView } from '../data/types';
import { href } from '../lib/router';
import { deathKindLabels, deathView, eventTitle, relationPhaseAt, visibleTexts } from '../lib/visible';
import { useSpoiler } from '../state/spoiler';
import { CertaintyBadge, CharChip, ChipRow, EventChip, LocChip, When, Withheld } from './ui';

export const locationTypeLabels: Record<LocationType, string> = {
  church: 'Церковь',
  aedificium: 'Главное здание',
  library: 'Библиотечный комплекс',
  service: 'Хозяйственное помещение',
  residence: 'Жилое и общее помещение',
  garden: 'Сад',
  medical: 'Лечебница',
  outer: 'Внешняя территория',
  passage: 'Тайный ход',
};

export function Sources({ ids }: { ids: string[] }) {
  const { critical } = useSpoiler();
  const items = ids.map((id) => sourceById.get(id)).filter((s) => s && (!s.critical || critical));
  if (!items.length) return null;
  return (
    <p className="sources-line">
      Источники:{' '}
      {items.map((s, i) => (
        <span key={s!.id}>
          {i > 0 && '; '}
          <a href={href('sources', { s: s!.id })} lang={s!.lang}>
            {s!.title}
          </a>
        </span>
      ))}
    </p>
  );
}

// ───────────────────────── Помещение ─────────────────────────

interface LocationCardProps {
  id: string;
  onPickEvent: (id: string) => void;
  onPickLocation: (id: string) => void;
  onPickRoute?: (characterId: string) => void;
  onOpenView?: (v: MapView) => void;
  /** Сведения с эталонного плана (буква, легенда, описание). */
  planBlock?: ReactNode;
}

export function LocationCard({
  id,
  onPickEvent,
  onPickLocation,
  onPickRoute,
  onOpenView,
  planBlock,
}: LocationCardProps) {
  const { spoiler, visible } = useSpoiler();
  const loc = locationById.get(id);
  if (!loc) return <p>Помещение не найдено.</p>;
  if (!visible({ revealDay: loc.revealDay ?? 0 }))
    return <Withheld>Это место ещё не появилось в повествовании.</Withheld>;

  const sig = visibleTexts(loc.significance, spoiler);
  const hiddenSig = loc.significance.length > sig.length;
  const evs = eventsAtLocation(id).filter((e) => visible(e));
  const scope = new Set(descendantsOf(id));
  const people = [...new Set(evs.flatMap((e) => e.characterIds))].filter((c) => visible(characterById.get(c)!));
  const dvs = deaths
    .map((d) => deathView(d, spoiler))
    .filter(
      (v) => v && (scope.has(v.death.foundLocationId) || (v.deathLocation && scope.has(v.deathLocation.locationId))),
    );
  const clues = cluesAtLocation(id).filter((c) => visible(c));
  const children = [...scope]
    .filter((x) => x !== id)
    .map((x) => locationById.get(x)!)
    .filter((l) => visible({ revealDay: l.revealDay ?? 0 }));
  const routesHere = routes.filter(
    (r) => visible(characterById.get(r.characterId)!) && r.steps.some((s) => visible(s) && scope.has(s.locationId)),
  );

  return (
    <article className="card stagger">
      <p className="card-kicker">
        {locationTypeLabels[loc.type]} {loc.latin && <span className="latin">· {loc.latin}</span>}
      </p>
      <h2 className="card-title">{loc.name}</h2>
      <CertaintyBadge c={loc.certainty} />
      <p className="lead">{loc.description}</p>

      {planBlock}
      {!isOnPlan(loc.id) && <Withheld>{loc.offPlan ?? 'Этого места нет на эталонных планах.'}</Withheld>}
      {loc.id === 'aedificium' && (
        <p className="small muted">
          Этажи Эдифиция (кухня и трапезная, скрипторий) в книге не начерчены; на плане есть только верхний этаж —
          библиотека.
        </p>
      )}
      {loc.id === 'aedificium' && onOpenView && !planBlock && (
        <div className="btn-row">
          <button type="button" className="btn btn-small btn-accent" onClick={() => onOpenView('library')}>
            Открыть план библиотеки
          </button>
        </div>
      )}

      <h3>Значение для сюжета</h3>
      {sig.map((t, i) => (
        <p key={i}>{t.text}</p>
      ))}
      {hiddenSig && <Withheld />}

      {children.length > 0 && (
        <ChipRow title="Помещения внутри">
          {children.map((c) => (
            <LocChip key={c.id} id={c.id} onPick={onPickLocation} />
          ))}
        </ChipRow>
      )}

      {dvs.length > 0 && (
        <div className="chip-block">
          <h4>Смерти</h4>
          <ul className="plain-list">
            {dvs.map((v) => (
              <li key={v!.death.id}>
                <button type="button" className="link-btn" onClick={() => onPickEvent(v!.death.eventId)}>
                  <Skull size={14} aria-hidden="true" /> {characterById.get(v!.death.characterId)!.short}
                  {v!.death.bodyNotFound ||
                  (v!.deathLocation && scope.has(v!.deathLocation.locationId) && !scope.has(v!.death.foundLocationId))
                    ? ' — место гибели'
                    : ' — тело найдено здесь'}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="chip-block">
        <h4>События по порядку</h4>
        {evs.length ? (
          <ol className="event-list">
            {evs.map((e) => (
              <li key={e.id}>
                <button type="button" className="link-btn" onClick={() => onPickEvent(e.id)}>
                  <span className="mono">{e.day === 0 ? '—' : e.day === 8 ? 'эп.' : `д.${e.day}`}</span>{' '}
                  {eventTitle(e, spoiler)}
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted small">На этом этапе чтения событий здесь нет.</p>
        )}
      </div>

      <ChipRow title="Кто здесь бывал">
        {people.map((c) => (
          <CharChip key={c} id={c} />
        ))}
      </ChipRow>
      {clues.length > 0 && (
        <ChipRow title="Улики и предметы">
          {clues.map((c) => (
            <a key={c.id} className="chip chip-clue" href={href('clues', { item: c.id })}>
              <Search size={13} aria-hidden="true" /> {c.title}
            </a>
          ))}
        </ChipRow>
      )}

      <div className="btn-row">
        {onPickRoute &&
          routesHere.length > 0 &&
          routesHere.map((r) => (
            <button key={r.id} type="button" className="btn btn-small" onClick={() => onPickRoute(r.characterId)}>
              <Footprints size={14} aria-hidden="true" /> Маршрут: {characterById.get(r.characterId)!.short}
            </button>
          ))}
        <a className="btn btn-small" href={href('timeline', { loc: id })}>
          <Clock3 size={14} aria-hidden="true" /> В хронологию
        </a>
      </div>
      <Sources ids={loc.sourceIds} />
    </article>
  );
}

// ───────────────────────── Событие ─────────────────────────

interface EventCardProps {
  id: string;
  onPickEvent: (id: string) => void;
  onPickLocation?: (id: string) => void;
  /** Где открыта карточка: на карте не нужна кнопка «на карту». */
  context: 'map' | 'timeline' | 'other';
}

export function EventCard({ id, onPickEvent, onPickLocation, context }: EventCardProps) {
  const { spoiler, visible } = useSpoiler();
  const e = eventById.get(id);
  if (!e) return <p>Событие не найдено.</p>;
  if (!visible(e)) return <Withheld>Это событие откроется позже по ходу чтения.</Withheld>;

  const visibleSeq = eventsSorted.filter((x) => visible(x));
  const idx = visibleSeq.findIndex((x) => x.id === id);
  const prev = visibleSeq[idx - 1];
  const next = visibleSeq[idx + 1];
  const later = visibleTexts(e.later, spoiler);
  const hiddenLater = (e.later?.length ?? 0) > later.length;
  const related = e.relatedEventIds.map((r) => eventById.get(r)!).filter((x) => visible(x));
  const clues = e.clueIds.map((c) => clueById.get(c)!).filter((c) => visible(c));
  const rels = relationships
    .filter((r) => r.eventIds.includes(id))
    .map((r) => ({ r, p: relationPhaseAt(r, spoiler) }))
    .filter((x) => x.p);
  const death = deaths.find((d) => d.eventId === id);
  const dv = death ? deathView(death, spoiler) : null;
  const loc = e.locationId ? locationById.get(e.locationId) : undefined;

  return (
    <article className="card stagger">
      <p className="card-kicker">
        <When e={e} />
      </p>
      <h2 className="card-title">{eventTitle(e, spoiler)}</h2>
      <CertaintyBadge c={e.certainty} />
      <p className="lead">{e.description}</p>
      {later.map((t, i) => (
        <p key={i} className="later">
          <span className="later-mark">Позже выясняется:</span> {t.text}
        </p>
      ))}
      {hiddenLater && <Withheld />}

      {dv && <DeathBlock dv={dv} onPickLocation={onPickLocation} />}

      <h3>Значение для расследования</h3>
      <p>{e.significance}</p>

      {loc && (
        <div className="chip-block">
          <h4>Место</h4>
          <div className="chips">
            <LocChip id={loc.id} onPick={onPickLocation} />
            {context !== 'map' && (
              <a className="chip" href={href('map', { loc: loc.id, event: e.id, view: preferredView(loc.id) })}>
                <MapIcon size={13} aria-hidden="true" /> Показать на карте
              </a>
            )}
          </div>
        </div>
      )}
      <ChipRow title="Участники">
        {e.characterIds
          .filter((c) => visible(characterById.get(c)!))
          .map((c) => (
            <CharChip key={c} id={c} />
          ))}
      </ChipRow>
      {clues.length > 0 && (
        <ChipRow title="Открываемые улики">
          {clues.map((c) => (
            <a key={c.id} className="chip chip-clue" href={href('clues', { item: c.id })}>
              <Search size={13} aria-hidden="true" /> {c.title}
            </a>
          ))}
        </ChipRow>
      )}
      {related.length > 0 && (
        <ChipRow title="Связанные события">
          {related.map((r) => (
            <EventChip key={r.id} e={r} onPick={onPickEvent} />
          ))}
        </ChipRow>
      )}
      {rels.length > 0 && (
        <ChipRow title="Отношения, которые проявляются здесь">
          {rels.map(({ r, p }) => (
            <a key={r.id} className="chip chip-rel" href={href('relations', { edge: r.id })}>
              {characterById.get(r.fromCharacterId)!.short} — {characterById.get(r.toCharacterId)!.short}:{' '}
              {relationLabels[p!.type]}
            </a>
          ))}
        </ChipRow>
      )}

      <nav className="prevnext" aria-label="Соседние события">
        {prev ? (
          <button type="button" className="btn btn-small" onClick={() => onPickEvent(prev.id)}>
            <ArrowLeft size={14} aria-hidden="true" /> {eventTitle(prev, spoiler)}
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button type="button" className="btn btn-small" onClick={() => onPickEvent(next.id)}>
            {eventTitle(next, spoiler)} <ArrowRight size={14} aria-hidden="true" />
          </button>
        ) : (
          <span />
        )}
      </nav>
      {context !== 'timeline' && (
        <p className="small">
          <a href={href('timeline', { event: e.id })}>Открыть в хронологии</a>
        </p>
      )}
      <Sources ids={e.sourceIds} />
    </article>
  );
}

function DeathBlock({
  dv,
  onPickLocation,
}: {
  dv: NonNullable<ReturnType<typeof deathView>>;
  onPickLocation?: (id: string) => void;
}) {
  const d = dv.death;
  const victim = characterById.get(d.characterId)!;
  return (
    <section className="death-block" aria-label={`Дело: ${victim.short}`}>
      <h3>
        <Skull size={16} aria-hidden="true" /> Дело о смерти: {victim.short}
      </h3>
      <dl className="facts">
        <dt>{d.bodyNotFound ? 'Место гибели' : 'Тело найдено'}</dt>
        <dd>
          <LocChip id={d.foundLocationId} onPick={onPickLocation} />
          {d.bodyNotFound && <span className="small muted"> тело не найдено</span>}
        </dd>
        <dt>Место смерти</dt>
        <dd>
          {dv.deathLocation ? (
            <>
              <LocChip id={dv.deathLocation.locationId} onPick={onPickLocation} />{' '}
              <span className="small">{dv.deathLocation.text}</span> <CertaintyBadge c={dv.deathLocation.certainty} />
            </>
          ) : (
            <span className="muted">не установлено на этом этапе</span>
          )}
        </dd>
        <dt>Обстоятельства</dt>
        <dd>{d.circumstances}</dd>
        <dt>Первая версия</dt>
        <dd>{dv.initial ? dv.initial.text : <span className="muted">—</span>}</dd>
        {dv.later.length > 0 && (
          <>
            <dt>По ходу дела</dt>
            <dd>
              <ul className="plain-list">
                {dv.later.map((t, i) => (
                  <li key={i}>{t.text}</li>
                ))}
              </ul>
            </dd>
          </>
        )}
        <dt>Итог</dt>
        <dd>
          {dv.final ? (
            <>
              <strong>{deathKindLabels[dv.finalKind!]}.</strong> {dv.final.text}{' '}
              <CertaintyBadge c={dv.final.certainty} />
            </>
          ) : (
            <Withheld>Объяснение этой смерти откроется позже.</Withheld>
          )}
        </dd>
      </dl>
      <p className="small">
        <a href={href(`heroes/${victim.id}`)}>Досье: {victim.name}</a> ·{' '}
        <a href={href('relations', { focus: victim.id })}>Связи</a>
      </p>
    </section>
  );
}

export function RelationDetail({ id }: { id: string }) {
  const { visible } = useSpoiler();
  const r = relationshipById.get(id);
  if (!r || !visible(r)) return <Withheld>Эта связь откроется позже.</Withheld>;
  const a = characterById.get(r.fromCharacterId)!;
  const b = characterById.get(r.toCharacterId)!;
  const phases = r.phases.filter((p) => visible(p));
  const hidden = r.phases.length > phases.length;
  const evs = r.eventIds.map((x) => eventById.get(x)!).filter((e) => visible(e));
  return (
    <article className="card stagger">
      <p className="card-kicker">Связь {r.directed ? '→ направленная' : '↔ взаимная'}</p>
      <h2 className="card-title">
        {a.short} {r.directed ? '→' : '—'} {b.short}
      </h2>
      <CertaintyBadge c={r.certainty} />
      <h3>Как менялось отношение</h3>
      <ol className="phase-list">
        {phases.map((p, i) => (
          <li key={i}>
            <span className={`rel-tag rel-${p.type}`}>{relationLabels[p.type]}</span>
            <span className="mono small">{p.revealDay === 0 ? 'с начала' : `с ${p.revealDay}-го дня`}</span>
            <p>
              {p.note} <CertaintyBadge c={p.certainty} />
            </p>
          </li>
        ))}
      </ol>
      {hidden && <Withheld>Дальнейшее развитие этой связи откроется позже.</Withheld>}
      {evs.length > 0 && (
        <ChipRow title="Подтверждающие эпизоды">
          {evs.map((e) => (
            <EventChip key={e.id} e={e} />
          ))}
        </ChipRow>
      )}
      <div className="chips">
        <CharChip id={a.id} />
        <CharChip id={b.id} />
      </div>
      <p className="small">
        <a href={href('compare', { a: a.id, b: b.id })}>Сравнить судьбы</a>
      </p>
      <Sources ids={r.sourceIds} />
    </article>
  );
}
