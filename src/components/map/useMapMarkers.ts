import { useMemo } from 'react';

import { anchorIn, characterById, clues, deaths, eventById, events, hotspotIn } from '../../data';
import type { MapView, StoryEvent } from '../../data/types';
import { happenedBy } from '../../lib/moments';
import { type DeathView, deathView } from '../../lib/visible';
import { useSpoiler } from '../../state/spoiler';

export interface DeathMarker {
  v: DeathView;
  x: number;
  y: number;
  /** Место смерти, если оно не совпадает с местом, где нашли тело. */
  site?: { x: number; y: number };
}

/**
 * Данные слоёв карты: кто бывал в каждой зоне, сколько там улик, где отметить смерти.
 * Учитывают раскрытие, фильтр дня и момент «Час за часом».
 */
export function useMapMarkers(view: MapView, dayFilter: number | null, moment: StoryEvent | undefined, unit: number) {
  const { spoiler, visible } = useSpoiler();
  const dayOk = (d: number) => dayFilter === null || d === dayFilter;
  const timeOk = happenedBy(moment);
  const momentKey = moment?.id ?? '';

  const deathViews = useMemo(
    () => deaths.map((d) => deathView(d, spoiler)).filter((v): v is DeathView => !!v),
    [spoiler],
  );

  // зависимости ниже — ключи состояния; функции фильтров пересоздаются на каждом рендере и в них не входят
  const peopleAt = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of events) {
      if (!visible(e) || !e.locationId || !dayOk(e.day) || !timeOk(e.sequence)) continue;
      const h = hotspotIn(view, e.locationId);
      if (!h) continue;
      const set = m.get(h.id) ?? new Set<string>();
      e.characterIds.forEach((c) => visible(characterById.get(c)!) && set.add(c));
      m.set(h.id, set);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spoiler, view, dayFilter, momentKey]);

  const cluesAt = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of clues) {
      if (!visible(c) || !c.locationId) continue;
      const ev = eventById.get(c.eventId);
      if (ev && (!dayOk(ev.day) || !timeOk(ev.sequence))) continue;
      const h = hotspotIn(view, c.locationId);
      if (h) m.set(h.id, (m.get(h.id) ?? 0) + 1);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spoiler, view, dayFilter, momentKey]);

  const deathMarkers = useMemo(() => {
    const out: DeathMarker[] = [];
    const counter = new Map<string, number>();
    for (const v of deathViews) {
      if (!dayOk(v.death.day)) continue;
      const found = eventById.get(v.death.eventId);
      if (found && !timeOk(found.sequence)) continue; // тело ещё не нашли
      const a = anchorIn(view, v.death.foundLocationId);
      const site = v.deathLocation ? anchorIn(view, v.deathLocation.locationId) : null;
      if (!a && !site) continue;
      const base = a ?? site!;
      const key = `${base[0]},${base[1]}`;
      const n = counter.get(key) ?? 0;
      counter.set(key, n + 1);
      out.push({
        v,
        x: base[0] + 14 * unit + n * 22 * unit,
        y: base[1] - 14 * unit,
        site:
          a && site && (site[0] !== a[0] || site[1] !== a[1])
            ? { x: site[0] + 12 * unit, y: site[1] + 12 * unit }
            : undefined,
      });
    }
    return out.sort((a, b) => a.v.death.day - b.v.death.day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deathViews, view, dayFilter, unit, momentKey]);

  return { peopleAt, cluesAt, deathMarkers };
}
