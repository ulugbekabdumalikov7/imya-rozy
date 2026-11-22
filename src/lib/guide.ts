import { useSyncExternalStore } from 'react';

/**
 * Путеводители атласа: общий (первый визит) и короткие подсказки к каждому разделу.
 * Какой из них открыт сейчас и чем закончился каждый (пройден или пропущен), — итог хранится в браузере,
 * как тема и режим чтения, поэтому каждый путеводитель сам открывается только один раз.
 * Повторить можно кнопкой с компасом в шапке.
 */
export type TourId = 'intro' | 'map' | 'heroes' | 'relations' | 'timeline' | 'clues' | 'history';
export type GuideStatus = 'done' | 'skipped';

/** Ключ общего путеводителя; у разделов — с суффиксом: rose-atlas:guide:map. */
export const GUIDE_KEY = 'rose-atlas:guide';
export const guideKey = (tour: TourId) => (tour === 'intro' ? GUIDE_KEY : `${GUIDE_KEY}:${tour}`);

let active: TourId | null = null;
/** Запасная память на случай, когда хранилище недоступно: в этом визите путеводитель не повторится. */
const remembered = new Map<TourId, GuideStatus>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function guideStatus(tour: TourId = 'intro'): GuideStatus | null {
  try {
    const v = window.localStorage.getItem(guideKey(tour));
    return v === 'done' || v === 'skipped' ? v : null;
  } catch {
    return remembered.get(tour) ?? null; // хранилище недоступно — смотрим память визита
  }
}

export function activeTour(): TourId | null {
  return active;
}

/** Открыть путеводитель (другой открытый при этом закрывается без отметки). */
export function openGuide(tour: TourId = 'intro') {
  if (active === tour) return;
  active = tour;
  emit();
}

/** Закрыть открытый путеводитель; status — запомнить, чем он закончился (null — не запоминать). */
export function closeGuide(status: GuideStatus | null) {
  if (active && status) {
    remembered.set(active, status);
    try {
      window.localStorage.setItem(guideKey(active), status);
    } catch {
      /* хранилище недоступно — помним до перезагрузки */
    }
  }
  if (!active) return;
  active = null;
  emit();
}

export function useActiveTour(): TourId | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => active,
    () => null,
  );
}
