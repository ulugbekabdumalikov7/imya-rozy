import { deathByCharacter, events } from '../data';
import type { Character, CharacterGroup } from '../data/types';
import { byGender, type Gender } from './ru';
import { isVisible, type SpoilerState } from './spoilers';
import { deathView } from './visible';

export const groupLabels: Record<CharacterGroup, string> = {
  investigators: 'Следствие',
  library: 'Библиотека и скрипторий',
  abbey: 'Обитатели аббатства',
  franciscans: 'Францисканцы',
  papal: 'Папская сторона',
  outside: 'Вне аббатства',
};

export const libraryLabels = {
  keeper: 'Хранители библиотеки',
  worker: 'Работники скриптория',
  reader: 'Читатели',
  outsider: 'Вне библиотеки',
} as const;

export const importanceLabels = { major: 'Главные', secondary: 'Второстепенные', episodic: 'Эпизодические' } as const;

export type Status = 'investigator' | 'dead' | 'accused' | 'witness';

export const statusLabels: Record<Status, string> = {
  investigator: 'Ведёт расследование',
  dead: 'Погибшие',
  accused: 'Обвинённые',
  witness: 'Свидетели и участники',
};

/** Статус конкретного героя — с согласованием по роду. */
export function statusText(st: Status, g: Gender | undefined): string {
  if (st === 'investigator') return 'Ведёт расследование';
  if (st === 'dead') return byGender(g, 'Погиб', 'Погибла');
  if (st === 'accused') return byGender(g, 'Обвинён', 'Обвинена');
  return byGender(g, 'Свидетель и участник', 'Свидетельница и участница');
}

/** Статус в расследовании с учётом режима раскрытия. */
export function statusOf(c: Character, s: SpoilerState): Status {
  if (c.group === 'investigators') return 'investigator';
  const d = deathByCharacter.get(c.id);
  if (d && deathView(d, s)) return 'dead';
  const trial = events.find((e) => e.id === 'e-trial')!;
  if (['remigio', 'salvatore', 'girl'].includes(c.id) && isVisible(trial, s)) return 'accused';
  return 'witness';
}
