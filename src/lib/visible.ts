import type { Character, CharacterRelationship, DeathCase, DeathKind, GatedText, StoryEvent } from '../data/types';
import { isVisible, type SpoilerState } from './spoilers';

export const visibleTexts = (items: readonly GatedText[] | undefined, s: SpoilerState) =>
  (items ?? []).filter((t) => isVisible(t, s));

export function eventTitle(e: StoryEvent, s: SpoilerState): string {
  return e.safeTitle && !isVisible({ revealDay: 7, critical: true }, s) ? e.safeTitle : e.title;
}

export function visibleEventText(e: StoryEvent, s: SpoilerState): string {
  return [eventTitle(e, s), e.description, ...visibleTexts(e.later, s).map((t) => t.text)].join(' ');
}

export function visibleCharacterText(c: Character, s: SpoilerState): string {
  return [
    c.summary,
    ...c.dossier.filter((d) => isVisible(d, s)).map((d) => `${d.heading} ${d.text}`),
    ...visibleTexts(c.fate, s).map((f) => f.text),
  ].join(' ');
}

export type MarkerKind = 'unresolved' | 'murder' | 'other' | 'death-site';

export interface DeathView {
  death: DeathCase;
  initial: GatedText | null;
  later: GatedText[];
  final: GatedText | null;
  finalKind: DeathKind | null;
  deathLocation: (GatedText & { locationId: string }) | null;
  marker: Exclude<MarkerKind, 'death-site'>;
}

export const deathKindLabels: Record<DeathKind, string> = {
  suicide: 'Самоубийство',
  poison: 'Отравление',
  killed: 'Убийство',
  trapped: 'Гибель в ловушке',
  fire: 'Гибель в пожаре',
};

/** Что известно о смерти в текущем режиме. null — сама смерть ещё не известна читателю. */
export function deathView(d: DeathCase, s: SpoilerState): DeathView | null {
  if (!isVisible(d, s)) return null;
  const final = isVisible(d.finalExplanation, s) ? d.finalExplanation : null;
  const deathLocation =
    d.deathLocationId && isVisible(d.deathLocationId, s) && d.deathLocationId.locationId !== d.foundLocationId
      ? d.deathLocationId
      : null;
  return {
    death: d,
    initial: isVisible(d.initialVersion, s) ? d.initialVersion : null,
    later: visibleTexts(d.revealedLater, s),
    final,
    finalKind: final ? d.finalKind : null,
    deathLocation,
    marker: !final ? 'unresolved' : d.finalKind === 'killed' ? 'murder' : 'other',
  };
}

/** Актуальная фаза отношения к моменту, который видит читатель (с ограничением по дню графа). */
export function relationPhaseAt(r: CharacterRelationship, s: SpoilerState, dayCap = 8) {
  if (!isVisible(r, s) || r.revealDay > dayCap) return null;
  const phases = r.phases.filter((p) => isVisible(p, s) && p.revealDay <= dayCap);
  return phases[phases.length - 1] ?? null;
}

export function visiblePhases(r: CharacterRelationship, s: SpoilerState, dayCap = 8) {
  if (!isVisible(r, s)) return [];
  return r.phases.filter((p) => isVisible(p, s) && p.revealDay <= dayCap);
}
