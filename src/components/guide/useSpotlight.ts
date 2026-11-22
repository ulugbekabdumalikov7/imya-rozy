import { useEffect, useRef, useState } from 'react';

import { DURATION, reducedMotion } from '../../lib/motion';
import { MAX_TARGETS } from './tours';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Поле вокруг подсвеченного элемента. */
const PAD = 6;
/** Сколько ждать, пока элемент шага появится (карта прорисовывается не сразу). */
const WAIT_MS = 2500;
/** Если часть целей не нашлась за это время, подсвечиваются найденные. */
const PARTIAL_MS = 400;
/** Скорость, с которой пятно света догоняет новую цель при смене шага. */
const FOLLOW_MS = 110;

const measure = (el: Element): Rect | null => {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return { x: r.left - PAD, y: r.top - PAD, w: r.width + 2 * PAD, h: r.height + 2 * PAD };
};

const viewportCenter = (): Rect => ({ x: window.innerWidth / 2, y: window.innerHeight / 2, w: 0, h: 0 });

/** Пустое место «схлопывается» в центр главной цели — так лишние пятна гаснут, а не исчезают рывком. */
const collapsed = (around: Rect | undefined): Rect => {
  const c = around ? { x: around.x + around.w / 2, y: around.y + around.h / 2 } : viewportCenter();
  return { x: c.x, y: c.y, w: 0, h: 0 };
};

const close = (a: Rect, b: Rect) =>
  Math.abs(a.x - b.x) < 0.25 && Math.abs(a.y - b.y) < 0.25 && Math.abs(a.w - b.w) < 0.25 && Math.abs(a.h - b.h) < 0.25;

/** Показать элемент целиком: вкладку — прокруткой меню, место на плане — прокруткой страницы. */
function reveal(el: Element) {
  const smooth = reducedMotion() ? 'auto' : 'smooth';
  if (el.closest('.mainnav')) {
    el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: smooth });
    return;
  }
  const r = el.getBoundingClientRect();
  if (r.top >= 0 && r.bottom <= window.innerHeight) return;
  // высокий элемент (список, доска) — показать его начало, а не середину
  const tall = r.height > window.innerHeight * 0.7;
  if (tall) window.scrollBy({ top: r.top - window.innerHeight * 0.18, behavior: smooth });
  else el.scrollIntoView({ block: 'center', behavior: smooth });
}

/**
 * Следит за элементами шага: где они на экране, с учётом прокрутки, поворота экрана и движения карты.
 * Возвращает цели (`goals`, куда встанет свет) и то, что видно сейчас (`shown`, плавно догоняет цели при смене шага).
 */
export function useSpotlight(selectors: string[], stepKey: string) {
  const [state, setState] = useState<{ goals: Rect[]; shown: Rect[]; found: boolean }>(() => {
    const c = collapsed(undefined);
    return { goals: [], shown: Array.from({ length: MAX_TARGETS }, () => c), found: false };
  });
  const shownRef = useRef(state.shown);
  const selectorsKey = selectors.join('|');

  useEffect(() => {
    const started = performance.now();
    const revealed = new Set<Element>();
    let last = started;
    let frame = 0;
    let found = false;
    let goals: Rect[] = [];
    let emittedKey = '';

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      // у каждого селектора — первый видимый элемент (на телефоне часть панелей спрятана)
      const hits = selectors
        .map((s) => {
          for (const el of document.querySelectorAll(s)) {
            const r = measure(el);
            if (r) return { el, r };
          }
          return null;
        })
        .filter((h): h is { el: Element; r: Rect } => !!h);
      // все цели на месте — или часть, если остальных так и нет (например, скрыты на этом экране)
      if (hits.length && (hits.length === selectors.length || now - started > PARTIAL_MS)) {
        found = true;
        goals = hits.map((h) => h.r);
        hits.forEach(({ el }) => {
          if (!revealed.has(el)) {
            revealed.add(el);
            reveal(el);
          }
        });
      } else if (!found && now - started > WAIT_MS) {
        goals = []; // элемент так и не появился — карточка встанет в центр, без подсветки
      }
      const slots = Array.from({ length: MAX_TARGETS }, (_, i) => goals[i] ?? collapsed(goals[0]));
      // при смене шага свет плывёт к новой цели; потом точно следует за ней (прокрутка, движение карты)
      const easing = !reducedMotion() && now - started < DURATION.slow;
      const k = easing ? 1 - Math.exp(-dt / FOLLOW_MS) : 1;
      const prev = shownRef.current;
      const next = slots.map((g, i) => {
        const p = prev[i]!;
        return {
          x: p.x + (g.x - p.x) * k,
          y: p.y + (g.y - p.y) * k,
          w: p.w + (g.w - p.w) * k,
          h: p.h + (g.h - p.h) * k,
        };
      });
      const goalsKey = `${found}:${goals.map((g) => `${Math.round(g.x)},${Math.round(g.y)},${Math.round(g.w)},${Math.round(g.h)}`).join(';')}`;
      const moved = next.some((r, i) => !close(r, prev[i]!));
      if (moved || goalsKey !== emittedKey) {
        emittedKey = goalsKey;
        shownRef.current = next;
        setState({ goals, shown: next, found });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // перезапуск — только при смене шага; селекторы шага постоянны
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, selectorsKey]);

  return state;
}
