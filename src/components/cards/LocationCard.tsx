import { Clock3, Footprints, Search, Skull } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  characterById,
  cluesAtLocation,
  deaths,
  descendantsOf,
  eventsAtLocation,
  isOnPlan,
  locationById,
  routes,
} from '../../data';
import type { LocationType, MapView } from '../../data/types';
import { href } from '../../lib/router';
import { deathView, eventTitle, visibleTexts } from '../../lib/visible';
import { useSpoiler } from '../../state/spoiler';
import { CertaintyBadge, CharChip, ChipRow, LocChip, Withheld } from '../ui';
import { Sources } from './Sources';

const locationTypeLabels: Record<LocationType, string> = {
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
