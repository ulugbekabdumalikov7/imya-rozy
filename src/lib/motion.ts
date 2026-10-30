import { useEffect, useRef, useState } from 'react';

/**
 * Единая система движения. Значения совпадают с CSS-токенами --t-fast/--t-medium/--t-slow/--t-dramatic.
 * Интерактивные отклики — fast/medium; атмосферные переходы — slow/dramatic.
 */
export const DURATION = { fast: 180, medium: 320, slow: 650, dramatic: 1400 } as const;

export function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function useReducedMotion(): boolean {
  const [r, setR] = useState(reducedMotion);
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    } catch {
      return;
    }
    const on = () => setR(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return r;
}

const memory = new Set<string>();
/** true при первом вызове за сессию (для долгих вступлений, чтобы они не раздражали при повторе). */
export function firstTimeThisSession(key: string): boolean {
  const k = `rose-atlas:seen:${key}`;
  try {
    if (window.sessionStorage.getItem(k)) return false;
    window.sessionStorage.setItem(k, '1');
    return true;
  } catch {
    if (memory.has(k)) return false;
    memory.add(k);
    return true;
  }
}

/** Навсегда (между визитами) — для вступления на главной. */
export function seenBefore(key: string): boolean {
  const k = `rose-atlas:visited:${key}`;
  try {
    const v = window.localStorage.getItem(k);
    window.localStorage.setItem(k, '1');
    return !!v;
  } catch {
    if (memory.has(k)) return true;
    memory.add(k);
    return false;
  }
}

/**
 * Смена содержимого с уходом старого: при смене ключа старое значение держится ms миллисекунд
 * в фазе 'out', затем подставляется новое в фазе 'in'.
 *
 * Смена определяется только ключом. Значение может быть новым массивом на каждой отрисовке
 * (отфильтрованный список) — это не перезапускает переход. Раньше эффект зависел от самого значения:
 * каждая отрисовка сбрасывала таймер, фаза 'out' не заканчивалась, и список оставался невидимым.
 */
export function useSwap<T>(
  value: T,
  key: string,
  ms: number = DURATION.fast,
): { shown: T; phase: 'in' | 'out'; shownKey: string } {
  const [state, setState] = useState<{ shownKey: string; phase: 'in' | 'out' }>({ shownKey: key, phase: 'in' });
  const settled = state.phase === 'in' && state.shownKey === key;
  // Последнее значение показанного ключа: его держим на экране, пока старое содержимое уходит.
  const lastShown = useRef(value);
  if (settled) lastShown.current = value;
  const latestKey = useRef(key);
  latestKey.current = key;

  useEffect(() => {
    if (key === state.shownKey && state.phase === 'in') return;
    if (reducedMotion()) {
      setState({ shownKey: key, phase: 'in' });
      return;
    }
    setState((s) => (s.phase === 'out' ? s : { ...s, phase: 'out' }));
    // Повторная смена ключа во время ухода переносит появление — показывается последний выбор.
    // Это же завершает уход, если ключ успел вернуться к прежнему (быстрые клики туда и обратно).
    const t = window.setTimeout(() => setState({ shownKey: latestKey.current, phase: 'in' }), ms);
    return () => window.clearTimeout(t);
  }, [key, state.shownKey, state.phase, ms]);

  return { shown: settled ? value : lastShown.current, phase: state.phase, shownKey: state.shownKey };
}

/** Плавная функция для перемещения камеры. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
