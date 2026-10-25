/** Русские формы слов, зависящие от числа и рода. */

/** Форма существительного для числа: plural(5, ['эпизод', 'эпизода', 'эпизодов']) → 'эпизодов'. */
export function plural(n: number, forms: readonly [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

/** Число вместе с согласованным словом: count(21, EPISODES) → '21 эпизод'. */
export const count = (n: number, forms: readonly [string, string, string]) => `${n} ${plural(n, forms)}`;

export const EPISODES = ['эпизод', 'эпизода', 'эпизодов'] as const;
export const SHARED_EPISODES = ['общий эпизод', 'общих эпизода', 'общих эпизодов'] as const;
export const SOURCES = ['источник откроется', 'источника откроются', 'источников откроются'] as const;
export const FOUND = ['герой', 'героя', 'героев'] as const;

export type Gender = 'm' | 'f';

/** Слово в нужном роде: byGender('f', 'обвинён', 'обвинена'). */
export const byGender = (g: Gender | undefined, m: string, f: string) => (g === 'f' ? f : m);
