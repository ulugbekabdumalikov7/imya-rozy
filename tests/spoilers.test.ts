import { describe, expect, it } from 'vitest';

import {
  characters,
  clues,
  deaths,
  events,
  historicalNotes,
  hotspotById,
  hypotheses,
  locations,
  relationships,
  routes,
  sources,
} from '../src/data';
import { filterVisible, isVisible, opensCritical, type SpoilerState } from '../src/lib/spoilers';
import { deathView, relationPhaseAt, visibleCharacterText, visibleEventText, visibleTexts } from '../src/lib/visible';

const SAFE: SpoilerState = { mode: 'safe', day: 1 };
const DAY3: SpoilerState = { mode: 'progress', day: 3 };
const DAY6: SpoilerState = { mode: 'progress', day: 6 };
const DAY7: SpoilerState = { mode: 'progress', day: 7 };
const FULL: SpoilerState = { mode: 'full', day: 7 };

/** Слова, которые прямо раскрывают разгадку. */
const SOLUTION = [
  /Поэтик/i,
  /отравленн[а-я]* книг/i,
  /яд[а-я]* на страниц/i,
  /по наущению/i,
  /Хорхе (запер|отравил)/i,
  /пожар/i,
  /Беренгар (спрятал|бросил|перен)/i,
];

function assertClean(text: string, where: string) {
  for (const re of SOLUTION) expect(re.test(text), `${where}: «${text.slice(0, 120)}» совпадает с ${re}`).toBe(false);
}

describe('правило видимости', () => {
  it('без спойлеров видны только день 0–1 и никаких критичных сведений', () => {
    expect(isVisible({ revealDay: 1 }, SAFE)).toBe(true);
    expect(isVisible({ revealDay: 2 }, SAFE)).toBe(false);
    expect(isVisible({ revealDay: 0, critical: true }, SAFE)).toBe(false);
  });
  it('по ходу чтения раскрытие ограничено выбранным днём, разгадка — только с седьмого', () => {
    expect(isVisible({ revealDay: 3 }, DAY3)).toBe(true);
    expect(isVisible({ revealDay: 4 }, DAY3)).toBe(false);
    expect(isVisible({ revealDay: 6, critical: true }, DAY6)).toBe(false);
    expect(isVisible({ revealDay: 6, critical: true }, DAY7)).toBe(true);
  });
  it('переход, открывающий разгадку, распознаётся для предупреждения', () => {
    expect(opensCritical(SAFE, FULL)).toBe(true);
    expect(opensCritical(DAY6, DAY7)).toBe(true);
    expect(opensCritical(DAY3, DAY6)).toBe(false);
    expect(opensCritical(FULL, DAY7)).toBe(false);
  });
});

describe('в режиме без спойлеров разгадка не просачивается', () => {
  it('в событиях', () => {
    for (const e of filterVisible(events, SAFE)) assertClean(visibleEventText(e, SAFE), e.id);
  });
  it('в досье и судьбах персонажей', () => {
    for (const c of filterVisible(characters, SAFE)) assertClean(visibleCharacterText(c, SAFE), c.id);
  });
  it('в делах о смертях: виден только Адельм, и без итоговой природы смерти', () => {
    const shown = deaths.map((d) => deathView(d, SAFE)).filter(Boolean);
    expect(shown.map((d) => d!.death.id)).toEqual(['d-adelmo']);
    expect(shown[0]!.finalKind).toBeNull();
  });
  it('в связях и уликах', () => {
    for (const r of relationships) {
      const p = relationPhaseAt(r, SAFE);
      if (p) assertClean(p.note, r.id);
    }
    for (const c of filterVisible(clues, SAFE)) assertClean(c.description, c.id);
    expect(filterVisible(hypotheses, SAFE).every((h) => !h.critical)).toBe(true);
  });
  it('в маршрутах', () => {
    for (const r of routes) for (const st of filterVisible(r.steps, SAFE)) assertClean(st.note, r.id);
  });
});

describe('по ходу чтения', () => {
  // тело Беренгара Вильгельм и Адсон находят в ночь третьего дня (глава «День третий. Ночь»)
  it('на второй день ещё не известно о смерти Беренгара, на третий — известно', () => {
    const at = (s: SpoilerState) =>
      deaths
        .map((d) => deathView(d, s))
        .filter(Boolean)
        .map((d) => d!.death.id);
    expect(at({ mode: 'progress', day: 2 })).not.toContain('d-berengar');
    expect(at(DAY3)).toContain('d-berengar');
  });
  // на четвёртый день Ремигий признаётся, что видел тело Венанция в кухне, — но механизм смерти остаётся тайной
  it('место смерти Венанция известно с четвёртого дня, а итог — только при открытой разгадке', () => {
    const v3 = deathView(
      deaths.find((d) => d.id === 'd-venantius')!,
      DAY3,
    )!;
    expect(v3.deathLocation).toBeNull();
    const v6 = deathView(
      deaths.find((d) => d.id === 'd-venantius')!,
      DAY6,
    )!;
    expect(v6.deathLocation?.locationId).toBe('kitchen');
    expect(v6.final).toBeNull();
  });
  it('итог Адельма открывается на второй день, итог Венанция — только в полном режиме', () => {
    expect(deathView(deaths[0]!, { mode: 'progress', day: 1 })!.final).toBeNull();
    expect(deathView(deaths[0]!, { mode: 'progress', day: 2 })!.final).not.toBeNull();
    expect(deathView(deaths[1]!, FULL)!.finalKind).toBe('poison');
  });
  it('тип связи меняется по ходу сюжета', () => {
    const r = relationships.find((x) => x.id === 'r-william-abbo')!;
    expect(relationPhaseAt(r, SAFE)!.type).toBe('cooperation');
    expect(relationPhaseAt(r, FULL)!.type).toBe('conflict');
  });
});

describe('места, справки и источники без спойлеров', () => {
  it('значение мест в безопасном режиме не раскрывает разгадку', () => {
    for (const l of locations)
      for (const t of visibleTexts(l.significance, SAFE)) assertClean(`${l.description} ${t.text}`, l.id);
  });
  it('у справок, раскрывающих сюжет, есть безопасная версия', () => {
    for (const n of historicalNotes) {
      const text = [
        n.safe?.title ?? n.title,
        n.safe?.short ?? n.short,
        n.safe?.detail ?? n.detail,
        n.safe?.inNovel ?? n.inNovel,
      ].join(' ');
      assertClean(text, n.id);
    }
  });
  it('источники, видимые без разгадки, её не называют', () => {
    for (const s of sources.filter((x) => !x.critical)) assertClean(`${s.title} ${s.note}`, s.id);
  });
});

describe('тексты зон планов', () => {
  it('ни одна зона не называет разгадку', () => {
    for (const h of hotspotById.values()) {
      const t = [
        h.name,
        h.description,
        h.note ?? '',
        h.safeName ?? '',
        h.safeDescription ?? '',
        h.en?.name ?? '',
        h.en?.description ?? '',
        h.en?.note ?? '',
      ].join(' ');
      expect(/Poetics|poison|Jorge|murder|killed|comedy|Поэтик|(?<![а-яё])яд|Хорхе|убий|комеди/i.test(t), h.id).toBe(
        false,
      );
    }
  });
  it('до второго дня Finis Africae и комната с зеркалом не названы', () => {
    for (const id of ['lib-S-tower-center', 'lib-S-arm-right']) {
      const h = hotspotById.get(id)!;
      expect(isVisible({ revealDay: h.revealDay ?? 0 }, SAFE), id).toBe(false);
    }
    expect(hotspotById.get('lib-S-tower-center')!.safeName).not.toMatch(/Africae|Африк/);
  });
});
