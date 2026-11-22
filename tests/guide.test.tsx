// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Guide } from '../src/components/guide';
import { NARROW, placeCard } from '../src/components/guide/placement';
import { MAX_TARGETS, tourForRoute, TOURS } from '../src/components/guide/tours';
import { hotspotById } from '../src/data';
import { activeTour, closeGuide, GUIDE_KEY, guideKey, guideStatus, openGuide } from '../src/lib/guide';
import type { Route } from '../src/lib/router';
import { SpoilerProvider } from '../src/state/spoiler';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const GUIDE_STEPS = TOURS.intro.steps;
const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

let root: Root;
let host: HTMLElement;
const route = (path: string[]): Route => ({ path, params: new URLSearchParams() });

function mount(path: string[] = ['heroes']) {
  act(() => root.render(createElement(SpoilerProvider, null, createElement(Guide, { route: route(path) }))));
}
const title = () => document.querySelector('#guide-title')?.textContent ?? null;
const press = (key: string) => act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key })));
const click = (label: RegExp) => {
  const btn = [...document.querySelectorAll<HTMLButtonElement>('.guide-card button')].find((b) =>
    label.test(b.textContent ?? ''),
  );
  if (!btn) throw new Error(`нет кнопки ${label}`);
  act(() => btn.click());
};

beforeEach(() => {
  vi.useFakeTimers();
  window.localStorage.clear();
  closeGuide(null); // ни один путеводитель не открыт
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  vi.useRealTimers();
});

describe('путеводитель: первый визит', () => {
  it('открывается сам при первом визите и не открывается после пропуска', () => {
    // итог хранится вместе с остальными настройками атласа
    expect(GUIDE_KEY).toBe('rose-atlas:guide');
    window.localStorage.removeItem(GUIDE_KEY);
    mount();
    expect(title()).toBeNull();
    act(() => void vi.advanceTimersByTime(1100));
    expect(title()).toBe(GUIDE_STEPS[0]!.title);

    press('Escape');
    expect(title()).toBeNull();
    expect(window.localStorage.getItem(GUIDE_KEY)).toBe('skipped');

    act(() => root.unmount());
    root = createRoot(host);
    mount();
    act(() => void vi.advanceTimersByTime(6000));
    expect(title()).toBeNull();
  });

  it('на главной ждёт, пока доиграет вступление', () => {
    window.localStorage.removeItem(GUIDE_KEY);
    mount([]);
    act(() => void vi.advanceTimersByTime(2000));
    expect(title()).toBeNull();
    act(() => void vi.advanceTimersByTime(3000));
    expect(title()).not.toBeNull();
  });

  it('вперёд, назад и до конца; итог — «пройден»', () => {
    window.localStorage.removeItem(GUIDE_KEY);
    mount();
    act(() => void vi.advanceTimersByTime(1100));
    click(/Войти/);
    expect(title()).toBe(GUIDE_STEPS[1]!.title);
    expect(window.location.hash).toBe('#/map'); // шаг с картой приводит на план аббатства
    click(/Назад/);
    expect(title()).toBe(GUIDE_STEPS[0]!.title);
    press('ArrowRight');
    press('ArrowRight');
    press('ArrowLeft');
    expect(title()).toBe(GUIDE_STEPS[1]!.title);
    for (let i = 1; i < GUIDE_STEPS.length - 1; i++) click(/Далее/);
    expect(title()).toBe(GUIDE_STEPS.at(-1)!.title);
    expect(document.querySelector('.guide-card [role="radiogroup"]')).not.toBeNull(); // настоящий выбор режима
    click(/Начать расследование/);
    expect(title()).toBeNull();
    expect(guideStatus()).toBe('done');
  });

  it('повтор по кнопке открывает путеводитель с первого шага', () => {
    window.localStorage.setItem(GUIDE_KEY, 'done');
    mount(['sources']); // у страницы источников нет своих подсказок
    act(() => void vi.advanceTimersByTime(6000));
    expect(title()).toBeNull();
    act(() => openGuide('intro'));
    expect(title()).toBe(GUIDE_STEPS[0]!.title);
  });
});

describe('путеводитель: содержание', () => {
  const allSteps = Object.values(TOURS).flatMap((t) => t.steps);

  it('коротко: общий — не больше пяти шагов и около полуминуты чтения, раздел — не больше трёх', () => {
    expect(GUIDE_STEPS.length).toBeLessThanOrEqual(5);
    const words = GUIDE_STEPS.reduce((n, s) => n + `${s.title} ${s.text}`.split(/\s+/).length, 0);
    expect(words).toBeLessThan(170); // ~200 слов в минуту
    for (const t of Object.values(TOURS)) if (t.id !== 'intro') expect(t.steps.length, t.id).toBeLessThanOrEqual(3);
    for (const s of allSteps) expect(s.targets.length, s.id).toBeLessThanOrEqual(MAX_TARGETS);
    expect(new Set(allSteps.map((s) => s.id)).size).toBe(allSteps.length);
  });

  it('ничего не раскрывает из сюжета', () => {
    const SOLUTION = [/Поэтик/i, /(?<![а-яё])яд/i, /отрав/i, /убий/i, /убит/i, /Хорхе/i, /пожар/i, /смерт/i, /погиб/i];
    for (const s of allSteps)
      for (const re of SOLUTION) expect(`${s.title} ${s.text} ${s.tryIt ?? ''}`, s.id).not.toMatch(re);
  });

  it('у каждого раздела от карты до истории — свои подсказки', () => {
    const r = (path: string[]) => ({ path, params: new URLSearchParams() });
    expect(tourForRoute(r(['map']))).toBe('map');
    expect(tourForRoute(r(['heroes']))).toBe('heroes');
    expect(tourForRoute(r(['heroes', 'william']))).toBeNull(); // досье — не список героев
    expect(tourForRoute(r(['relations']))).toBe('relations');
    expect(tourForRoute(r(['timeline']))).toBe('timeline');
    expect(tourForRoute(r(['clues']))).toBe('clues');
    expect(tourForRoute(r(['history']))).toBe('history');
    expect(tourForRoute(r([]))).toBeNull();
    expect(guideKey('map')).toBe('rose-atlas:guide:map');
  });

  it('каждая метка data-guide из путеводителей стоит в интерфейсе', () => {
    const sources = [
      'App.tsx',
      'components/SpoilerControl.tsx',
      'sections/MapSection.tsx',
      'sections/HeroesSection.tsx',
      'sections/RelationsSection.tsx',
      'sections/TimelineSection.tsx',
      'sections/CluesSection.tsx',
    ]
      .map(read)
      .join('\n');
    const marks = new Set(
      allSteps.flatMap((s) => s.targets).flatMap((t) => [...t.matchAll(/data-guide="([^"]+)"/g)].map((m) => m[1]!)),
    );
    const navTabs = ['heroes', 'relations', 'timeline', 'clues'];
    for (const m of marks) if (!navTabs.includes(m)) expect(sources, m).toContain(`data-guide="${m}"`);
  });

  it('каждая цель общего путеводителя существует в интерфейсе', () => {
    const app = read('App.tsx');
    expect(app).toContain('data-guide={n.to}');
    for (const to of ['heroes', 'relations', 'timeline', 'clues']) expect(app).toContain(`to: '${to}'`);
    expect(read('components/SpoilerControl.tsx')).toContain('data-guide="spoiler"');
    expect(read('sections/MapSection.tsx')).toContain('data-guide="plan-switch"');
    expect(read('components/map/PlanMap.tsx')).toContain("'data-spot': h.id");
    expect(hotspotById.has('ab-aedificium')).toBe(true);
  });
});

describe('путеводитель: где встаёт карточка', () => {
  const card = { w: 380, h: 240 };
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

  it('без цели — в центре, без нити', () => {
    const p = placeCard(undefined, card, { w: 1280, h: 800 });
    expect(p.side).toBe('center');
    expect(p.thread).toBeNull();
  });

  it('рядом с целью, не закрывает её и не выходит за экран', () => {
    const vp = { w: 1280, h: 800 };
    const targets = [
      { x: 300, y: 4, w: 320, h: 48 }, // вкладки шапки
      { x: 1180, y: 8, w: 90, h: 40 }, // кнопка режима у правого края
      { x: 600, y: 600, w: 200, h: 180 }, // постройка внизу плана
    ];
    for (const t of targets) {
      const p = placeCard(t, card, vp);
      expect(overlaps({ x: p.x, y: p.y, ...card }, t), JSON.stringify(t)).toBe(false);
      expect(p.x).toBeGreaterThanOrEqual(16);
      expect(p.x + card.w).toBeLessThanOrEqual(vp.w - 16);
      expect(p.y + card.h).toBeLessThanOrEqual(vp.h - 16);
      expect(p.thread).not.toBeNull();
    }
  });

  it('на телефоне карточка на всю ширину встаёт под целью или над ней', () => {
    const vp = { w: 390, h: 844 };
    expect(vp.w).toBeLessThanOrEqual(NARROW);
    const p = placeCard({ x: 120, y: 90, w: 160, h: 40 }, { w: 358, h: 300 }, vp);
    expect(p.side).toBe('below');
    const low = placeCard({ x: 120, y: 700, w: 160, h: 100 }, { w: 358, h: 300 }, vp);
    expect(low.side).toBe('above');
  });
});

describe('подсказки разделов', () => {
  it('открываются при первом входе в раздел, если общий путеводитель пройден', () => {
    window.localStorage.setItem(GUIDE_KEY, 'done');
    mount(['timeline']);
    act(() => void vi.advanceTimersByTime(1000));
    expect(activeTour()).toBe('timeline');
    expect(title()).toBe(TOURS.timeline.steps[0]!.title);
    press('Escape');
    expect(window.localStorage.getItem(guideKey('timeline'))).toBe('skipped');
    expect(activeTour()).toBeNull();
  });

  it('не открываются сами, если общий путеводитель пропущен', () => {
    window.localStorage.setItem(GUIDE_KEY, 'skipped');
    mount(['clues']);
    act(() => void vi.advanceTimersByTime(3000));
    expect(activeTour()).toBeNull();
  });

  it('проходятся до конца и больше не открываются', () => {
    window.localStorage.setItem(GUIDE_KEY, 'done');
    mount(['history']);
    act(() => void vi.advanceTimersByTime(1000));
    for (let i = 1; i < TOURS.history.steps.length; i++) click(/Далее/);
    click(new RegExp(TOURS.history.finishLabel));
    expect(guideStatus('history')).toBe('done');
    act(() => root.unmount());
    root = createRoot(host);
    mount(['history']);
    act(() => void vi.advanceTimersByTime(3000));
    expect(activeTour()).toBeNull();
  });

  it('закрываются, если читатель ушёл из раздела', () => {
    act(() => openGuide('heroes'));
    mount(['heroes']);
    expect(activeTour()).toBe('heroes');
    mount(['map']);
    expect(activeTour()).toBeNull();
  });
});
