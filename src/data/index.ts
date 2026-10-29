import { characters, characterById } from './characters';
import { locations, locationById } from './locations';
import { events, eventById, eventsSorted } from './events';
import { deaths, deathById, deathByCharacter } from './deaths';
import { relationships, relationshipById, relationLabels } from './relationships';
import { clues, clueById, hypotheses } from './clues';
import { routes, routeByCharacter } from './routes';
import { historicalNotes, historicalNoteById, days } from './history';
import { sources, sourceById } from './sources';
import type { CanonicalHour, Location, MapView } from './types';
import { plans, hotspotById, hotspotAnchor, type PlanHotspot } from './plans';
export { plans, hotspotById, hotspotAnchor };
export type { PlanHotspot };

export {
  characters, characterById, locations, locationById, events, eventById, eventsSorted,
  deaths, deathById, deathByCharacter, relationships, relationshipById, relationLabels,
  clues, clueById, hypotheses, routes, routeByCharacter, historicalNotes, historicalNoteById,
  days, sources, sourceById,
};

export const hourLabels: Record<CanonicalHour, string> = {
  matins: 'Полунощница',
  lauds: 'Хвалитны',
  prime: 'Час первый',
  terce: 'Час третий',
  sext: 'Час шестой',
  nones: 'Час девятый',
  vespers: 'Вечерня',
  compline: 'Повечерие',
  night: 'Ночь',
  unknown: 'Время не уточнено',
};

export const hourOrder: CanonicalHour[] = ['matins', 'lauds', 'prime', 'terce', 'sext', 'nones', 'vespers', 'compline', 'night', 'unknown'];

export const dayLabel = (d: number) =>
  d === 0 ? 'До прибытия' : d === 8 ? 'Эпилог' : `День ${['', 'первый', 'второй', 'третий', 'четвёртый', 'пятый', 'шестой', 'седьмой'][d]}`;

export const viewLabels: Record<MapView, string> = {
  abbey: 'План аббатства',
  library: 'План библиотеки',
};

/** Цепочка предков помещения (сам, родитель, …). */
export function ancestry(id: string): Location[] {
  const out: Location[] = [];
  let cur = locationById.get(id);
  while (cur) {
    out.push(cur);
    cur = cur.parentId ? locationById.get(cur.parentId) : undefined;
  }
  return out;
}

/**
 * Зона плана, которой место представлено в данном виде: собственная зона места,
 * а если её нет — зона ближайшего предка (кухня → Эдифиций на плане аббатства).
 */
export function hotspotIn(view: MapView, locationId: string): PlanHotspot | null {
  for (const l of ancestry(locationId)) {
    if (l.plan?.view === view && l.plan.hotspot) return hotspotById.get(l.plan.hotspot) ?? null;
  }
  return null;
}

/** Точка привязки знаков места в данном виде (null — на этом плане место не показано). */
export function anchorIn(view: MapView, locationId: string): [number, number] | null {
  const h = hotspotIn(view, locationId);
  return h ? hotspotAnchor(h) : null;
}

/** На каком плане лучше всего показывать место: самый подробный план, где у него есть зона или он целиком. */
export function preferredView(locationId: string): MapView {
  for (const l of ancestry(locationId)) if (l.plan) return l.plan.view;
  return 'abbey';
}

/** Место нарисовано на планах (своей зоной, целым планом или через предка). */
export function isOnPlan(locationId: string): boolean {
  return ancestry(locationId).some((l) => !!l.plan);
}

/** Помещение и все вложенные в него. */
export function descendantsOf(id: string): string[] {
  const out = [id];
  for (const l of locations) {
    if (l.parentId && ancestry(l.id).some((a) => a.id === id) && l.id !== id) out.push(l.id);
  }
  return out;
}

export const eventsAtLocation = (id: string) => {
  const ids = new Set(descendantsOf(id));
  return eventsSorted.filter((e) => e.locationId && ids.has(e.locationId));
};

export const eventsOfCharacter = (id: string) => eventsSorted.filter((e) => e.characterIds.includes(id));

export const relationshipsOf = (id: string) =>
  relationships.filter((r) => r.fromCharacterId === id || r.toCharacterId === id);

export const cluesAtLocation = (id: string) => {
  const ids = new Set(descendantsOf(id));
  return clues.filter((c) => c.locationId && ids.has(c.locationId));
};

export const cluesOfCharacter = (id: string) => clues.filter((c) => c.characterIds.includes(id));
