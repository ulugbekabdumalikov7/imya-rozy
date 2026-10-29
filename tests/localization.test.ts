import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  characters, clues, deaths, events, hypotheses, historicalNotes, hotspotById, locations, relationships, routes, sources,
} from '../src/data';
import { ABBEY_LEGEND } from '../src/data/plans';
import { byGender, count, EPISODES, plural, SHARED_EPISODES, SOURCES } from '../src/lib/ru';
import { statusText } from '../src/sections/HeroesSection';

/**
 * Латинские, итальянские и собственные имена, которые законно встречаются в русском тексте:
 * термины плана, латинские слова романа, названия трудов.
 */
const ALLOWED_LATIN = new Set(`
  Finis Africae Aedificium Septentrio Oriens Meridies Occidens Chiesa Chiostro Fucina Edificio Stabbi Ospedale Balnea
  Dormitori Sala capitolare Stalle Abbazia quatuor Brunellus Coena Cypriani Cum inter nonnullos Regula Benedicti
  Practica inquisitionis heretice pravitatis Arbor vitae crucifixae Jesu Fra Dolcino Postille nome della rosa Il
  Ecclesia Claustrum Capitulum Hospitale Balneum Scriptorium Refectorium Poetics Wikipedia LitCharts
  finis Secretum manus supra idolum age primum et septimum de Super thronos viginti Dies irae tertius equi
`.split(/\s+/).filter(Boolean));

const latinWords = (t: string) => (t.match(/[A-Za-z][A-Za-z’'-]+/g) ?? []).filter((w) => w.length > 1 && !ALLOWED_LATIN.has(w) && !/^[IVXLCDM]+$/.test(w));
const hasCyrillic = (t: string) => /[а-яё]/i.test(t);

/** Все тексты интерфейса, которые хранятся в данных и должны быть русскими. */
function russianTexts(): [string, string][] {
  const out: [string, string][] = [];
  const add = (where: string, t: string | undefined) => { if (t) out.push([where, t]); };
  for (const c of characters) {
    add(`character ${c.id}.name`, c.name); add(`character ${c.id}.role`, c.role); add(`character ${c.id}.summary`, c.summary);
    add(`character ${c.id}.affiliation`, c.affiliation);
    c.dossier.forEach((d, i) => { add(`character ${c.id}.dossier[${i}]`, d.heading); add(`character ${c.id}.dossier[${i}]`, d.text); });
    c.fate.forEach((f, i) => add(`character ${c.id}.fate[${i}]`, f.text));
    c.personality.forEach((p) => add(`character ${c.id}.personality`, p));
  }
  for (const l of locations) {
    add(`location ${l.id}.name`, l.name); add(`location ${l.id}.description`, l.description); add(`location ${l.id}.offPlan`, l.offPlan);
    l.significance.forEach((s, i) => add(`location ${l.id}.significance[${i}]`, s.text));
  }
  for (const e of events) {
    add(`event ${e.id}.title`, e.title); add(`event ${e.id}.safeTitle`, e.safeTitle); add(`event ${e.id}.description`, e.description);
    add(`event ${e.id}.significance`, e.significance); e.later?.forEach((t, i) => add(`event ${e.id}.later[${i}]`, t.text));
  }
  for (const c of clues) { add(`clue ${c.id}.title`, c.title); add(`clue ${c.id}.description`, c.description); }
  for (const h of hypotheses) { add(`hyp ${h.id}.title`, h.title); add(`hyp ${h.id}.statement`, h.statement); add(`hyp ${h.id}.verdict`, h.verdict.text); }
  for (const d of deaths) { add(`death ${d.id}`, d.circumstances); add(`death ${d.id}`, d.finalExplanation.text); }
  for (const r of relationships) r.phases.forEach((p, i) => add(`rel ${r.id}[${i}]`, p.note));
  for (const r of routes) r.steps.forEach((s, i) => add(`route ${r.id}[${i}]`, s.note));
  for (const n of historicalNotes) { add(`history ${n.id}.title`, n.title); add(`history ${n.id}.detail`, n.detail); add(`history ${n.id}.inNovel`, n.inNovel); }
  for (const s of sources) add(`source ${s.id}.note`, s.note);
  for (const h of hotspotById.values()) {
    add(`hotspot ${h.id}.name`, h.name); add(`hotspot ${h.id}.description`, h.description); add(`hotspot ${h.id}.note`, h.note);
    add(`hotspot ${h.id}.zone`, h.zone); add(`hotspot ${h.id}.safeName`, h.safeName); add(`hotspot ${h.id}.safeDescription`, h.safeDescription);
  }
  for (const l of ABBEY_LEGEND) add(`legend ${l.letter}.ru`, l.ru);
  return out;
}

describe('локализация данных', () => {
  const texts = russianTexts();

  it('каждый текст интерфейса из данных написан по-русски', () => {
    // имена собственные на латинице (Finis Africae, буквы плана) допустимы, только если в тексте есть и кириллица
    const notRussian = texts.filter(([, t]) => !hasCyrillic(t) && latinWords(t).length > 0 && !/^Finis Africae$/.test(t));
    expect(notRussian.map(([w, t]) => `${w}: ${t}`)).toEqual([]);
  });

  it('в русских текстах нет английских слов, кроме разрешённых терминов', () => {
    const bad = texts.map(([w, t]) => [w, latinWords(t)] as const).filter(([, ws]) => ws.length > 0);
    expect(bad.map(([w, ws]) => `${w}: ${ws.join(', ')}`)).toEqual([]);
  });

  it('у каждой зоны плана есть русское название и описание, английский — только дополнительно', () => {
    for (const h of hotspotById.values()) {
      expect(hasCyrillic(h.name) || h.name === 'Finis Africae', h.id).toBe(true);
      expect(hasCyrillic(h.description), h.id).toBe(true);
      if (h.safeName) expect(hasCyrillic(h.safeName), h.id).toBe(true);
    }
  });

  it('у английских и латинских названий источников указан язык', () => {
    for (const s of sources) {
      if (!hasCyrillic(s.title)) expect(s.lang, s.id).toBeDefined();
    }
  });
});

describe('имена героев', () => {
  it('краткое имя входит в полное, имена не повторяются', () => {
    const names = new Set<string>();
    for (const c of characters) {
      expect(c.name.includes(c.short) || c.short === 'Девушка' || c.short === 'Бернард Ги', `${c.id}: ${c.short} / ${c.name}`).toBe(true);
      expect(names.has(c.name), c.name).toBe(false);
      names.add(c.name);
    }
  });

  it('устаревшие варианты имён хранятся только как альтернативные', () => {
    const deprecated = ['Аймарий', 'Санкт-Вендельский', 'Аббон Фоссанова'];
    for (const c of characters) for (const d of deprecated) expect(c.name.includes(d), `${c.id}: ${c.name}`).toBe(false);
    const severinus = characters.find((c) => c.id === 'severinus')!;
    expect(severinus.name).toContain('Эммеран'); // как в оригинале: Severino da Sant’Emmerano
    expect(severinus.alternativeNames).toContain('Северин Санкт-Вендельский'); // поиск по варианту перевода
  });
});

describe('согласование слов', () => {
  it('числительные', () => {
    const cases: [number, string][] = [[0, 'эпизодов'], [1, 'эпизод'], [2, 'эпизода'], [4, 'эпизода'], [5, 'эпизодов'], [11, 'эпизодов'], [12, 'эпизодов'], [14, 'эпизодов'], [21, 'эпизод'], [22, 'эпизода'], [25, 'эпизодов'], [111, 'эпизодов'], [121, 'эпизод']];
    for (const [n, w] of cases) expect(plural(n, EPISODES), String(n)).toBe(w);
    expect(count(31, EPISODES)).toBe('31 эпизод');
    expect(count(19, SHARED_EPISODES)).toBe('19 общих эпизодов');
    expect(count(1, SOURCES)).toBe('1 источник откроется');
    expect(count(3, SOURCES)).toBe('3 источника откроются');
  });

  it('род: подписи статуса согласуются с героем', () => {
    expect(byGender('f', 'обвинён', 'обвинена')).toBe('обвинена');
    const girl = characters.find((c) => c.id === 'girl')!;
    expect(girl.gender).toBe('f');
    expect(statusText('accused', girl.gender)).toBe('Обвинена');
    expect(statusText('accused', undefined)).toBe('Обвинён');
    expect(statusText('dead', 'f')).toBe('Погибла');
  });
});

// ───────────── Разметка интерфейса ─────────────

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? tsxFiles(p) : p.endsWith('.tsx') ? [p] : [];
  });
}

const SRC = join(__dirname, '..', 'src');
const UI_ALLOWED = new Set([...ALLOWED_LATIN, 'Locus', 'Ad', 'lectorem', 'Cave', 'lector', 'Quantum', 'legisti', 'Horarium', 'Opiniones', 'NOME', 'DELLA', 'ROSA', 'IL']);

describe('разметка интерфейса', () => {
  const files = tsxFiles(SRC).map((p) => [p.replace(SRC, 'src'), readFileSync(p, 'utf8')] as const);

  it('в JSX нет захардкоженного английского текста и английских подписей', () => {
    const bad: string[] = [];
    for (const [name, src] of files) {
      const texts = [
        ...[...src.matchAll(/>\s*([^<>{}]*[A-Za-z]{3,}[^<>{}]*)\s*</g)].map((m) => m[1]!),
        ...[...src.matchAll(/(?:aria-label|title|placeholder)="([^"]+)"/g)].map((m) => m[1]!),
      ];
      for (const t of texts) {
        if (/[=;()]|=>|&&|^\s*[:?]/.test(t)) continue; // фрагменты кода, а не текст
        const words = (t.match(/[A-Za-z][A-Za-z’'-]+/g) ?? []).filter((w) => !UI_ALLOWED.has(w) && w !== 'Adso');
        if (words.length) bad.push(`${name}: «${t.trim()}»`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('латинские рубрики помечены lang="la"', () => {
    const bad: string[] = [];
    for (const [name, src] of files) {
      for (const m of src.matchAll(/<(\w+) className="rubric"([^>]*)>([^<]*)</g)) {
        const [, , attrs, body] = m;
        const latin = /^[A-Za-z ?]+$/.test(body!.trim()) || /latin/.test(body!);
        if (latin && !/lang=/.test(attrs!)) bad.push(`${name}: ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('заголовок страницы оформлен по правилам русской типографики', () => {
    const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
    expect(html).toMatch(/<title>Атлас «Имени розы»<\/title>/);
    expect(html).toMatch(/<html lang="ru">/);
  });
});
