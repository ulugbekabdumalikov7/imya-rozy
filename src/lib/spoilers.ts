import type { Gate } from '../data/types';

export type SpoilerMode = 'safe' | 'progress' | 'full';

export interface SpoilerState {
  mode: SpoilerMode;
  /** День для режима «По ходу расследования» (1–7). */
  day: number;
}

/** Последний день, сведения которого видны в текущем режиме. */
export function horizon(s: SpoilerState): number {
  if (s.mode === 'full') return 8;
  if (s.mode === 'safe') return 1;
  return s.day;
}

export function criticalAllowed(s: SpoilerState): boolean {
  return s.mode === 'full' || (s.mode === 'progress' && s.day >= 7);
}

/** Единое правило видимости для любой сущности или фрагмента. */
export function isVisible(gate: Pick<Gate, 'revealDay' | 'critical'> | { revealDay?: number; critical?: boolean }, s: SpoilerState): boolean {
  const day = gate.revealDay ?? 0;
  if (gate.critical && !criticalAllowed(s)) return false;
  return day <= horizon(s);
}

export function filterVisible<T extends { revealDay?: number; critical?: boolean }>(items: readonly T[], s: SpoilerState): T[] {
  return items.filter((i) => isVisible(i, s));
}

/** Будет ли переход в новое состояние открывать разгадку, ранее скрытую. */
export function opensCritical(from: SpoilerState, to: SpoilerState): boolean {
  return !criticalAllowed(from) && criticalAllowed(to);
}

export const modeLabels: Record<SpoilerMode, { title: string; hint: string }> = {
  safe: { title: 'Без спойлеров', hint: 'Аббатство, герои и завязка первого дня.' },
  progress: { title: 'По ходу чтения', hint: 'Сведения открываются до выбранного дня.' },
  full: { title: 'Всё расследование', hint: 'Все смерти, мотивы и финальная разгадка.' },
};
