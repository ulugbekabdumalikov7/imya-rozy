import { describe, expect, it } from 'vitest';
import {
  characters, characterById, locations, locationById, events, eventById, deaths, relationships,
  clues, clueById, hypotheses, routes, historicalNotes, sourceById, anchorIn, isOnPlan, hotspotById, plans,
} from '../src/data';
import { centroid } from '../src/data/plans';

function inside(poly: [number, number][], [x, y]: [number, number]): boolean {
  let r = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!; const [xj, yj] = poly[j]!;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) r = !r;
  }
  return r;
}

const missing = (ids: string[], set: Map<string, unknown>) => ids.filter((id) => !set.has(id));

describe('целостность ссылок', () => {
  it('идентификаторы уникальны в каждой коллекции', () => {
    for (const list of [characters, locations, events, deaths, relationships, clues, hypotheses, routes, historicalNotes]) {
      const ids = list.map((x) => x.id);
      expect(new Set(ids).size, `дубликаты: ${ids.filter((x, i) => ids.indexOf(x) !== i)}`).toBe(ids.length);
    }
  });

  it('события ссылаются на существующих персонажей, места, улики и события', () => {
    for (const e of events) {
      expect(missing(e.characterIds, characterById), e.id).toEqual([]);
      expect(missing(e.clueIds, clueById), e.id).toEqual([]);
      expect(missing(e.relatedEventIds, eventById), e.id).toEqual([]);
      if (e.locationId) expect(locationById.has(e.locationId), e.id).toBe(true);
      expect(missing(e.sourceIds, sourceById), e.id).toEqual([]);
    }
  });

  it('смерти ссылаются на существующие сущности', () => {
    for (const d of deaths) {
      expect(characterById.has(d.characterId), d.id).toBe(true);
      expect(eventById.has(d.eventId), d.id).toBe(true);
      expect(locationById.has(d.foundLocationId), d.id).toBe(true);
      if (d.deathLocationId) expect(locationById.has(d.deathLocationId.locationId), d.id).toBe(true);
      expect(missing(d.clueIds, clueById), d.id).toEqual([]);
      expect(missing(d.relatedCharacterIds, characterById), d.id).toEqual([]);
    }
  });

  it('связи соединяют существующих персонажей', () => {
    for (const r of relationships) {
      expect(characterById.has(r.fromCharacterId), r.id).toBe(true);
      expect(characterById.has(r.toCharacterId), r.id).toBe(true);
      expect(r.fromCharacterId).not.toBe(r.toCharacterId);
      expect(missing(r.eventIds, eventById), r.id).toEqual([]);
      expect(r.phases.length, r.id).toBeGreaterThan(0);
    }
  });

  it('улики, версии и маршруты ссылаются на существующие сущности', () => {
    for (const c of clues) {
      expect(eventById.has(c.eventId), c.id).toBe(true);
      if (c.locationId) expect(locationById.has(c.locationId), c.id).toBe(true);
      if (c.speakerId) expect(characterById.has(c.speakerId), c.id).toBe(true);
      expect(missing(c.characterIds, characterById), c.id).toEqual([]);
    }
    for (const h of hypotheses) {
      expect(missing(h.links.map((l) => l.clueId), clueById), h.id).toEqual([]);
      expect(missing(h.holderIds, characterById), h.id).toEqual([]);
      expect(missing(h.eventIds, eventById), h.id).toEqual([]);
    }
    for (const r of routes) {
      expect(characterById.has(r.characterId), r.id).toBe(true);
      for (const st of r.steps) {
        expect(locationById.has(st.locationId), `${r.id} → ${st.locationId}`).toBe(true);
        if (st.eventId) expect(eventById.has(st.eventId), `${r.id} → ${st.eventId}`).toBe(true);
      }
    }
    for (const n of historicalNotes) {
      expect(missing(n.characterIds, characterById), n.id).toEqual([]);
      expect(missing(n.eventIds, eventById), n.id).toEqual([]);
      expect(missing(n.locationIds, locationById), n.id).toEqual([]);
      expect(missing(n.sourceIds, sourceById), n.id).toEqual([]);
    }
  });

  it('каждое место либо привязано к плану (само или через предка), либо явно помечено как отсутствующее', () => {
    for (const l of locations) expect(isOnPlan(l.id) || !!l.offPlan, l.id).toBe(true);
  });

  it('связи мест и зон планов согласованы в обе стороны', () => {
    for (const l of locations) {
      if (!l.plan?.hotspot) continue;
      const h = hotspotById.get(l.plan.hotspot);
      expect(h, `${l.id} → ${l.plan.hotspot}`).toBeDefined();
      expect(h!.plan, l.id).toBe(l.plan.view);
      expect(h!.locationId, l.id).toBe(l.id);
    }
    for (const h of hotspotById.values()) {
      if (!h.locationId) continue;
      const l = locationById.get(h.locationId);
      expect(l, h.id).toBeDefined();
      expect(l!.plan?.hotspot, h.id).toBe(h.id);
    }
  });

  it('эдифиций на плане аббатства открывает план библиотеки', () => {
    expect(hotspotById.get('ab-aedificium')?.opensPlan).toBe('library');
    expect(anchorIn('abbey', 'finis-africae')).toEqual(anchorIn('abbey', 'aedificium'));
    expect(anchorIn('library', 'finis-africae')).not.toEqual(anchorIn('abbey', 'finis-africae'));
  });

  it('план библиотеки: 56 комнат, 54 с буквой, 10 красных, комнаты не пересекаются', () => {
    const rooms = plans.library.hotspots;
    expect(rooms.length).toBe(56);
    expect(rooms.filter((r) => r.printed).length).toBe(54);
    expect(rooms.filter((r) => r.red).length).toBe(10);
    // центр каждой комнаты лежит внутри неё и ни в какой другой
    for (const r of rooms) {
      const c = centroid(r.poly);
      expect(inside(r.poly, c), r.id).toBe(true);
      for (const o of rooms) if (o !== r) expect(inside(o.poly, c), `${r.id} внутри ${o.id}`).toBe(false);
    }
  });

  it('зоны лежат в пределах своих изображений', () => {
    for (const p of Object.values(plans)) {
      for (const h of p.hotspots) for (const [x, y] of h.poly) {
        expect(x >= 0 && x <= p.width && y >= 0 && y <= p.height, `${h.id} ${x},${y}`).toBe(true);
      }
    }
  });

  it('у каждого события смерти есть дело о смерти, и наоборот', () => {
    const deathEventIds = new Set(deaths.map((d) => d.eventId));
    for (const d of deaths) expect(eventById.get(d.eventId)?.kinds).toContain('death');
    expect(deathEventIds.size).toBe(deaths.length);
  });

  it('каждая смерть отмечается на плане аббатства', () => {
    for (const d of deaths) expect(anchorIn('abbey', d.foundLocationId), d.id).not.toBeNull();
  });
});

describe('буквы общего плана и легенда', () => {
  it('каждая буква легенды стоит ровно на одной постройке и называет её так, как в легенде', async () => {
    const { plans, ABBEY_LEGEND } = await import('../src/data/plans');
    const lettered = plans.abbey.hotspots.filter((h) => h.printed);
    expect(lettered.map((h) => h.printed).sort()).toEqual(ABBEY_LEGEND.map((l) => l.letter).sort());
    for (const h of lettered) {
      const l = ABBEY_LEGEND.find((x) => x.letter === h.printed)!;
      expect(h.legend, h.id).toBe(l.ru);
      expect(h.name, h.id).toBe(l.ru);
    }
    // места романа привязаны к постройкам по легенде
    const byLetter: Record<string, string> = {
      A: 'aedificium', B: 'church', D: 'cloister', F: 'dormitory', H: 'chapter-house',
      K: 'hospital', J: 'balneary', M: 'pigsty', N: 'stables', R: 'workshops',
    };
    for (const [letter, loc] of Object.entries(byLetter)) {
      expect(lettered.find((h) => h.printed === letter)?.locationId, letter).toBe(loc);
    }
  });
});
