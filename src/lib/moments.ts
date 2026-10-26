import { dayLabel, eventById, eventsSorted, hourLabels } from '../data';
import type { StoryEvent } from '../data/types';
import { isVisible, type SpoilerState } from './spoilers';

/**
 * «Час за часом»: ход романа по моментам.
 *
 * Шаг — событие в авторском порядке (`sequence`), а не ячейка «день × час»: у многих событий роман
 * не называет час, и равномерная сетка была бы почти пустой или требовала бы выдумывать время.
 * Подпись шага — день и канонический час события («время не уточнено», если час не назван).
 */

/** Моменты, доступные при текущем режиме чтения, по порядку. */
export function momentSteps(s: SpoilerState): StoryEvent[] {
  return eventsSorted.filter((e) => isVisible(e, s));
}

/** Подпись момента: «День третий · Ночь». */
export function momentLabel(e: StoryEvent): string {
  return `${dayLabel(e.day)} · ${hourLabels[e.hour]}`;
}

/**
 * Текущий момент по параметру адреса. Если событие скрыто режимом чтения (например, режим сменили),
 * берём последний доступный момент не позже него — бегунок не исчезает и не забегает вперёд.
 */
export function resolveMoment(id: string | null, steps: StoryEvent[]): { index: number; event: StoryEvent } | null {
  if (id === null || !steps.length) return null;
  const exact = steps.findIndex((e) => e.id === id);
  if (exact >= 0) return { index: exact, event: steps[exact]! };
  const target = eventById.get(id);
  if (!target) return null;
  let index = 0;
  steps.forEach((e, i) => { if (e.sequence <= target.sequence) index = i; });
  return { index, event: steps[index]! };
}

/** Произошло ли событие с таким порядковым номером к текущему моменту (включительно). */
export const happenedBy = (moment: StoryEvent | undefined) => (sequence: number) => !moment || sequence <= moment.sequence;

/** Первый момент дня (для перехода «смотреть этот день час за часом»). */
export function firstMomentOfDay(day: number, steps: StoryEvent[]): StoryEvent | undefined {
  return steps.find((e) => e.day === day);
}

/** Нить дня: события того же дня до текущего момента включительно — по ним рисуется путь дня на карте. */
export function dayThread(moment: StoryEvent, steps: StoryEvent[]): StoryEvent[] {
  return steps.filter((e) => e.day === moment.day && e.sequence <= moment.sequence);
}

/** Отметки дней на шкале: с какого шага начинается каждый день. */
export function dayMarks(steps: StoryEvent[]): { day: number; index: number }[] {
  const out: { day: number; index: number }[] = [];
  steps.forEach((e, i) => { if (!out.length || out[out.length - 1]!.day !== e.day) out.push({ day: e.day, index: i }); });
  return out;
}
