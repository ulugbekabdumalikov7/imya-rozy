import { useSyncExternalStore } from 'react';

/**
 * Путеводитель первого визита: открыт ли он сейчас и проходил ли его читатель.
 * Итог (пройден или пропущен) хранится в браузере, как тема и режим чтения, — путеводитель
 * сам открывается только один раз. Повторить его можно кнопкой в шапке.
 */
export type GuideStatus = 'done' | 'skipped';

export const GUIDE_KEY = 'rose-atlas:guide';

let open = false;
/** Запасная память на случай, когда хранилище недоступно: в этом визите путеводитель не повторится. */
let remembered: GuideStatus | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function guideStatus(): GuideStatus | null {
  try {
    const v = window.localStorage.getItem(GUIDE_KEY);
    return v === 'done' || v === 'skipped' ? v : null;
  } catch {
    return remembered; // хранилище недоступно — смотрим память визита
  }
}

export function openGuide() {
  if (open) return;
  open = true;
  emit();
}

/** Закрыть путеводитель и запомнить, чем он закончился. */
export function closeGuide(status: GuideStatus) {
  remembered = status;
  try {
    window.localStorage.setItem(GUIDE_KEY, status);
  } catch {
    /* хранилище недоступно — помним до перезагрузки */
  }
  if (!open) return;
  open = false;
  emit();
}

export function useGuideOpen(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => open,
    () => false,
  );
}
