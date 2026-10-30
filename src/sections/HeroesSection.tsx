import { ArrowLeft, Footprints, GitCompare, Network, Search, Skull } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Sources } from '../components/cards';
import { CertaintyBadge, CharChip, ChipRow, Chronicle, Emblem, LocChip, SectionHead, Withheld } from '../components/ui';
import {
  characterById,
  characters,
  cluesOfCharacter,
  deaths,
  events,
  eventsOfCharacter,
  locationById,
  relationLabels,
  relationshipsOf,
  routeByCharacter,
} from '../data';
import {
  groupLabels,
  importanceLabels,
  libraryLabels,
  statusLabels,
  statusOf,
  statusText,
} from '../lib/characterStatus';
import { href, patchParams, type Route as AppRoute } from '../lib/router';
import { count, FOUND } from '../lib/ru';
import { isVisible, type SpoilerState } from '../lib/spoilers';
import { deathKindLabels, deathView, eventTitle, relationPhaseAt, visibleTexts } from '../lib/visible';
import { useSpoiler } from '../state/spoiler';

export function HeroesSection({ route }: { route: AppRoute }) {
  const id = route.path[1];
  if (id) return <HeroProfile id={id} />;
  return <HeroCatalog route={route} />;
}

function HeroCatalog({ route }: { route: AppRoute }) {
  const { spoiler, visible } = useSpoiler();
  const [q, setQ] = useState(route.params.get('q') ?? '');
  const group = route.params.get('group') ?? '';
  const lib = route.params.get('lib') ?? '';
  const imp = route.params.get('imp') ?? '';
  const status = route.params.get('status') ?? '';
  const ev = route.params.get('ev') ?? '';
  const set = (patch: Record<string, string | null>) => patchParams(route, patch);

  const keyEvents = events.filter(
    (e) => visible(e) && e.kinds.some((k) => ['death', 'discovery', 'trial', 'political', 'finale'].includes(k)),
  );
  const evObj = keyEvents.find((e) => e.id === ev);

  const list = useMemo(() => {
    const norm = q.trim().toLowerCase();
    return characters.filter((c) => {
      if (!visible(c)) return false;
      if (norm && ![c.name, c.short, c.originalName, ...c.alternativeNames].some((n) => n.toLowerCase().includes(norm)))
        return false;
      if (group && c.group !== group) return false;
      if (lib && c.libraryRelation !== lib) return false;
      if (imp && c.importance !== imp) return false;
      if (status && statusOf(c, spoiler) !== status) return false;
      if (evObj && !evObj.characterIds.includes(c.id)) return false;
      return true;
    });
  }, [q, group, lib, imp, status, evObj, spoiler, visible]);

  const anyFilter = q || group || lib || imp || status || ev;

  return (
    <div className="page">
      <SectionHead latin="Personae" title="Герои">
        <p>
          Все, кто влияет на расследование: монахи, гости, судьи и те, о ком говорят другие. Карточка каждого героя
          ведёт к его событиям, местам и связям.
        </p>
      </SectionHead>

      <div className="filters" role="search">
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Поиск по имени</span>
          <input
            id="hero-search"
            type="search"
            placeholder="Имя: Вильгельм, Хорхе, Adso…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              set({ q: e.target.value || null });
            }}
          />
        </label>
        <Select
          id="f-group"
          label="Принадлежность"
          value={group}
          onChange={(v) => set({ group: v })}
          options={groupLabels}
        />
        <Select id="f-lib" label="Библиотека" value={lib} onChange={(v) => set({ lib: v })} options={libraryLabels} />
        <Select id="f-imp" label="Роль" value={imp} onChange={(v) => set({ imp: v })} options={importanceLabels} />
        <Select
          id="f-status"
          label="Статус"
          value={status}
          onChange={(v) => set({ status: v })}
          options={statusLabels}
        />
        <Select
          id="f-ev"
          label="Участие в событии"
          value={ev}
          onChange={(v) => set({ ev: v })}
          options={Object.fromEntries(
            keyEvents.map((e) => [e.id, `${e.day ? `д.${e.day} · ` : ''}${eventTitle(e, spoiler)}`]),
          )}
        />
        {anyFilter && (
          <button
            type="button"
            className="btn btn-small"
            onClick={() => {
              setQ('');
              set({ q: null, group: null, lib: null, imp: null, status: null, ev: null });
            }}
          >
            Сбросить
          </button>
        )}
      </div>

      <p className="muted small" aria-live="polite">
        Найдено: {count(list.length, FOUND)}
      </p>
      {list.length === 0 ? (
        <div className="empty">
          <p>
            Никого не нашлось. Попробуйте другое написание имени — например, «Адельм» и «Адельмо» относятся к одному
            герою — или сбросьте фильтры.
          </p>
        </div>
      ) : (
        <ul className="hero-grid">
          {list.map((c, i) => {
            const st = statusOf(c, spoiler);
            return (
              <li key={c.id} style={{ ['--i' as string]: i }}>
                <a className="hero-card" href={href(`heroes/${c.id}`)}>
                  <Emblem c={c} size={44} />
                  <span className="hero-card-body">
                    <span className="hero-name">{c.name}</span>
                    <span className="hero-role">{c.role}</span>
                    <span className="hero-meta">
                      {groupLabels[c.group]}
                      {st === 'dead' && (
                        <span className="is-dead">
                          {' '}
                          · <Skull size={12} aria-hidden="true" /> {statusText('dead', c.gender).toLowerCase()}
                        </span>
                      )}
                      {st === 'accused' && ` · ${statusText('accused', c.gender).toLowerCase()}`}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Select({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string | null) => void;
  options: Record<string, string>;
}) {
  return (
    <label className="select-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">все</option>
        {Object.entries(options).map(([k, v]) => (
          <option key={k} value={k}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}

function HeroProfile({ id }: { id: string }) {
  const { spoiler, visible } = useSpoiler();
  const c = characterById.get(id);
  if (!c)
    return (
      <div className="page">
        <p>
          Такого героя нет в атласе. <a href={href('heroes')}>К списку героев</a>
        </p>
      </div>
    );
  if (!visible(c))
    return (
      <div className="page">
        <a className="back" href={href('heroes')}>
          <ArrowLeft size={16} /> Все герои
        </a>
        <Withheld>Этот герой появится в повествовании позже.</Withheld>
      </div>
    );

  const dossier = c.dossier.filter((d) => visible(d));
  const hiddenDossier = c.dossier.length - dossier.length;
  const fate = visibleTexts(c.fate, spoiler);
  const evs = eventsOfCharacter(c.id).filter((e) => visible(e));
  const places = [
    ...new Set([
      ...(evs.map((e) => e.locationId).filter(Boolean) as string[]),
      ...(routeByCharacter
        .get(c.id)
        ?.steps.filter((s) => visible(s) && s.kind !== 'gap')
        .map((s) => s.locationId) ?? []),
    ]),
  ];
  const rels = relationshipsOf(c.id)
    .map((r) => ({ r, p: relationPhaseAt(r, spoiler) }))
    .filter((x) => x.p);
  const relatedDeaths = deaths
    .filter((d) => d.characterId === c.id || d.relatedCharacterIds.includes(c.id))
    .map((d) => deathView(d, spoiler))
    .filter(Boolean);
  const clues = cluesOfCharacter(c.id).filter((x) => visible(x));
  const route = routeByCharacter.get(c.id);
  const hasRoute = route && route.steps.some((s) => visible(s));
  const st = statusOf(c, spoiler);

  return (
    <div className="page profile">
      <a className="back" href={href('heroes')}>
        <ArrowLeft size={16} aria-hidden="true" /> Все герои
      </a>
      <div className="profile-sheet sheet" key={c.id}>
        <header className="profile-head stagger">
          <Emblem c={c} size={72} />
          <div className="stagger">
            <p className="rubric">{groupLabels[c.group]}</p>
            <h1>{c.name}</h1>
            <p className="profile-alt">
              <span lang="it">{c.originalName}</span>
              {c.alternativeNames.map((n) => (
                <span key={n} lang={/[а-яё]/i.test(n) ? undefined : 'en'}>
                  {' '}
                  · {n}
                </span>
              ))}
            </p>
            <p className="profile-role">
              {c.role}. {c.affiliation}.
            </p>
            <p className="small">
              <span className={`status status-${st}`}>{statusText(st, c.gender)}</span>{' '}
              <CertaintyBadge c={c.certainty} />
            </p>
          </div>
        </header>

        <div className="btn-row">
          {hasRoute && (
            <a className="btn" href={href('map', { route: c.id, step: 0, layers: 'arch,deaths,route' })}>
              <Footprints size={16} aria-hidden="true" /> Маршрут на карте
            </a>
          )}
          <a className="btn" href={href('relations', { focus: c.id })}>
            <Network size={16} aria-hidden="true" /> Связи на графе
          </a>
          <a className="btn" href={href('compare', { a: c.id, b: c.id === 'william' ? 'adso' : 'william' })}>
            <GitCompare size={16} aria-hidden="true" /> Сравнить судьбу
          </a>
        </div>

        <div className="profile-grid">
          <div className="profile-main stagger">
            <p className="lead initial">{c.summary}</p>
            {(c.age || c.appearance) && (
              <dl className="facts">
                {c.age && (
                  <>
                    <dt>Возраст</dt>
                    <dd>{c.age}</dd>
                  </>
                )}
                {c.appearance && (
                  <>
                    <dt>Внешность</dt>
                    <dd>{c.appearance}</dd>
                  </>
                )}
              </dl>
            )}
            <section>
              <h2>Характер и способ мышления</h2>
              <ul className="traits">
                {c.personality.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>

            {dossier.map((d) => (
              <section key={d.heading} className="dossier">
                <h2>
                  {d.heading} <CertaintyBadge c={d.certainty} />
                </h2>
                <p>{d.text}</p>
              </section>
            ))}
            {hiddenDossier > 0 && <Withheld>Часть досье откроется позже по ходу чтения.</Withheld>}

            <section>
              <h2>Хроника</h2>
              {evs.length ? (
                <Chronicle events={evs} characterId={c.id} />
              ) : (
                <p className="muted">На этом этапе чтения событий с участием героя нет.</p>
              )}
            </section>

            <section>
              <h2>Итог судьбы</h2>
              {fate.length ? (
                fate.map((f, i) => (
                  <p key={i}>
                    {f.text} <CertaintyBadge c={f.certainty} />
                  </p>
                ))
              ) : (
                <Withheld>Судьба героя раскрывается позже.</Withheld>
              )}
              {fate.length > 0 && fate.length < c.fate.length && <Withheld />}
            </section>
          </div>

          <aside className="profile-side">
            <h2>Связи</h2>
            {rels.length ? (
              <ul className="rel-list">
                {rels.map(({ r, p }) => {
                  const other = r.fromCharacterId === c.id ? r.toCharacterId : r.fromCharacterId;
                  return (
                    <li key={r.id}>
                      <a href={href('relations', { focus: c.id, edge: r.id })}>
                        <span className={`rel-tag rel-${p!.type}`}>{relationLabels[p!.type]}</span>{' '}
                        {characterById.get(other)!.short}
                      </a>
                      <p className="small">{p!.note}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="muted small">Связи откроются позже.</p>
            )}

            <ChipRow title="Места">
              {places
                .filter((l) => visible({ revealDay: locationById.get(l)?.revealDay ?? 0 }))
                .map((l) => (
                  <LocChip key={l} id={l} />
                ))}
            </ChipRow>

            {relatedDeaths.length > 0 && (
              <div className="chip-block">
                <h4>Связанные смерти</h4>
                <ul className="plain-list">
                  {relatedDeaths.map((v) => (
                    <li key={v!.death.id}>
                      <a href={href('map', { event: v!.death.eventId, layers: 'arch,deaths' })}>
                        <Skull size={13} aria-hidden="true" /> {characterById.get(v!.death.characterId)!.short}
                      </a>
                      {v!.finalKind && (
                        <span className="small muted"> — {deathKindLabels[v!.finalKind].toLowerCase()}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {clues.length > 0 && (
              <ChipRow title="Улики и свидетельства">
                {clues.map((x) => (
                  <a key={x.id} className="chip chip-clue" href={href('clues', { item: x.id })}>
                    {x.title}
                  </a>
                ))}
              </ChipRow>
            )}
            <ChipRow title="Чаще всего рядом">
              {coPresence(c.id, spoiler).map((o) => (
                <CharChip key={o} id={o} />
              ))}
            </ChipRow>
            <Sources ids={c.sourceIds} />
          </aside>
        </div>
      </div>
    </div>
  );
}

/** Персонажи, чаще всего участвующие в тех же событиях. */
function coPresence(id: string, s: SpoilerState): string[] {
  const counts = new Map<string, number>();
  for (const e of eventsOfCharacter(id)) {
    if (!isVisible(e, s)) continue;
    for (const o of e.characterIds)
      if (o !== id && isVisible(characterById.get(o)!, s)) counts.set(o, (counts.get(o) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([o]) => o);
}
