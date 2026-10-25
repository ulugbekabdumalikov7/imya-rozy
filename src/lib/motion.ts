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
    try { mq = window.matchMedia('(prefers-reduced-motion: reduce)'); } catch { return; }
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
 */
export function useSwap<T>(value: T, key: string, ms: number = DURATION.fast): { shown: T; phase: 'in' | 'out'; shownKey: string } {
  const [state, setState] = useState({ shown: value, shownKey: key, phase: 'in' as 'in' | 'out' });
  const latest = useRef({ value, key });
  latest.current = { value, key };
  useEffect(() => {
    if (key === state.shownKey) {
      if (state.shown !== value) setState((s) => ({ ...s, shown: value }));
      return;
    }
    if (reducedMotion()) {
      setState({ shown: value, shownKey: key, phase: 'in' });
      return;
    }
    setState((s) => ({ ...s, phase: 'out' }));
    const t = window.setTimeout(() => setState({ shown: latest.current.value, shownKey: latest.current.key, phase: 'in' }), ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value]);
  return state;
}

/** Плавная функция для перемещения камеры. */
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
