import { ArrowLeft, ArrowRight, Map as MapIcon, Search, Skull } from 'lucide-react';

import {
  characterById,
  clueById,
  deaths,
  eventById,
  eventsSorted,
  locationById,
  preferredView,
  relationLabels,
  relationships,
} from '../../data';
import { href } from '../../lib/router';
import { deathKindLabels, deathView, eventTitle, relationPhaseAt, visibleTexts } from '../../lib/visible';
import { useSpoiler } from '../../state/spoiler';
import { CertaintyBadge, CharChip, ChipRow, EventChip, LocChip, When, Withheld } from '../ui';
import { Sources } from './Sources';

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
