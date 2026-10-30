import { ArrowLeftRight } from 'lucide-react';

import { Emblem, When, Withheld } from '../components/ui';
import {
  characterById,
  characters,
  dayLabel,
  eventsOfCharacter,
  locationById,
  relationLabels,
  relationships,
} from '../data';
import { href, patchParams, type Route as AppRoute } from '../lib/router';
import { count, EPISODES, plural, SHARED_EPISODES } from '../lib/ru';
import { eventTitle, visiblePhases, visibleTexts } from '../lib/visible';
import { useSpoiler } from '../state/spoiler';

export function CompareView({ route }: { route: AppRoute }) {
  const { spoiler, visible } = useSpoiler();
  const pool = characters.filter((c) => visible(c));
  const pick = (k: string, fallback: string) => {
    const v = route.params.get(k);
    return v && characterById.has(v) && visible(characterById.get(v)!) ? v : fallback;
  };
  const a = pick('a', 'william');
  const b = pick('b', 'adso');
  const ca = characterById.get(a)!;
  const cb = characterById.get(b)!;
  const set = (patch: Record<string, string>) => patchParams(route, patch);

  const ea = eventsOfCharacter(a).filter((e) => visible(e));
  const eb = eventsOfCharacter(b).filter((e) => visible(e));
  const ids = new Set([...ea, ...eb].map((e) => e.id));
  const all = [...ea, ...eb.filter((e) => !ea.some((x) => x.id === e.id))].sort((x, y) => x.sequence - y.sequence);
  const inA = new Set(ea.map((e) => e.id));
  const inB = new Set(eb.map((e) => e.id));
  const shared = all.filter((e) => inA.has(e.id) && inB.has(e.id));
  const sharedPlaces = [...new Set(shared.map((e) => e.locationId).filter(Boolean) as string[])];
  const rel = relationships.find(
    (r) => (r.fromCharacterId === a && r.toCharacterId === b) || (r.fromCharacterId === b && r.toCharacterId === a),
  );
  const phases = rel ? visiblePhases(rel, spoiler) : [];

  let lastDay = -1;
  return (
    <div className="compare">
      <div className="compare-pickers">
        <label className="select-field" htmlFor="cmp-a">
          <span>Первый герой</span>
          <select id="cmp-a" value={a} onChange={(e) => set({ a: e.target.value })}>
            {pool.map((c) => (
              <option key={c.id} value={c.id} disabled={c.id === b}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="icon-btn" onClick={() => set({ a: b, b: a })} aria-label="Поменять местами">
          <ArrowLeftRight size={18} />
        </button>
        <label className="select-field" htmlFor="cmp-b">
          <span>Второй герой</span>
          <select id="cmp-b" value={b} onChange={(e) => set({ b: e.target.value })}>
            {pool.map((c) => (
              <option key={c.id} value={c.id} disabled={c.id === a}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="compare-summary">
        <div className="compare-who">
          <Emblem c={ca} size={40} />
          <div>
            <strong>{ca.short}</strong>
            <span className="small muted">{count(ea.length, EPISODES)}</span>
          </div>
        </div>
        <div className="compare-mid">
          <p className="rubric">Общее</p>
          <p>
            <strong>{shared.length}</strong> {plural(shared.length, SHARED_EPISODES)}
            {sharedPlaces.length > 0 && (
              <> · места встреч: {sharedPlaces.map((l) => locationById.get(l)!.name).join(', ')}</>
            )}
          </p>
          {phases.length > 0 ? (
            <ol className="phase-inline">
              {phases.map((p, i) => (
                <li key={i}>
                  <span className={`rel-tag rel-${p.type}`}>{relationLabels[p.type]}</span>{' '}
                  <span className="small">{p.note}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="small muted">
              Прямая связь между героями в атласе не описана{rel ? ' на этом этапе чтения' : ''}.
            </p>
          )}
        </div>
        <div className="compare-who compare-who-b">
          <Emblem c={cb} size={40} />
          <div>
            <strong>{cb.short}</strong>
            <span className="small muted">{count(eb.length, EPISODES)}</span>
          </div>
        </div>
      </div>

      {ids.size === 0 ? (
        <p className="empty">На этом этапе чтения у этих героев нет событий.</p>
      ) : (
        <ol className="compare-rows" aria-label="Сравнение по событиям">
          <li className="compare-row compare-row-head" aria-hidden="true">
            <span>{ca.short}</span>
            <span>вместе</span>
            <span>{cb.short}</span>
          </li>
          {all.map((e) => {
            const both = inA.has(e.id) && inB.has(e.id);
            const side = both ? 'both' : inA.has(e.id) ? 'a' : 'b';
            const dayChange = e.day !== lastDay;
            lastDay = e.day;
            const cell = (
              <a className="cmp-event" href={href('timeline', { event: e.id })}>
                <span className="cmp-when">
                  <When e={e} />
                </span>
                <span className="cmp-title">{eventTitle(e, spoiler)}</span>
                {e.locationId && <span className="cmp-place">{locationById.get(e.locationId)!.name}</span>}
              </a>
            );
            return (
              <li key={e.id} className={`compare-row side-${side}${dayChange ? ' day-start' : ''}`}>
                {dayChange && <span className="cmp-day">{dayLabel(e.day)}</span>}
                <span className="cmp-a">{side === 'a' ? cell : null}</span>
                <span className="cmp-both">{side === 'both' ? cell : null}</span>
                <span className="cmp-b">{side === 'b' ? cell : null}</span>
                <span className="cmp-tag">{side === 'both' ? 'оба' : side === 'a' ? ca.short : cb.short}</span>
              </li>
            );
          })}
        </ol>
      )}

      <div className="compare-fates">
        {[ca, cb].map((c) => {
          const fate = visibleTexts(c.fate, spoiler);
          return (
            <section key={c.id}>
              <h3>Итог: {c.short}</h3>
              {fate.length ? (
                fate.map((f, i) => <p key={i}>{f.text}</p>)
              ) : (
                <Withheld>Судьба раскрывается позже.</Withheld>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
