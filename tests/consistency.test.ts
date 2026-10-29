import { describe, expect, it } from 'vitest';
import {
  ancestry, characterById, characters, clueById, clues, deaths, eventById, events, eventsSorted, historicalNotes,
  hourOrder, hypotheses, locationById, locations, relationships, routes,
} from '../src/data';
import type { Gate } from '../src/data/types';

/**
 * Перекрёстная проверка хронологии, «знаний» читателя и согласованности сущностей.
 * Появилась после научного аудита (см. AUDIT.md): каждая проверка ловит класс ошибок,
 * которые там были найдены вручную.
 */

const hourRank = (h: string) => hourOrder.indexOf(h as never);
/** Сведения не могут стать известны раньше, чем открылся сам источник сведений. */
const notBefore = (inner: Gate, outer: Gate) => inner.revealDay >= outer.revealDay && (!outer.critical || !!inner.critical || inner.revealDay >= 7);
const sameBranch = (a: string, b: string) => {
  const A = ancestry(a).map((l) => l.id); const B = ancestry(b).map((l) => l.id);
  return A.includes(b) || B.includes(a);
};

describe('хронология', () => {
  it('порядок событий не нарушает дни', () => {
    for (let i = 1; i < eventsSorted.length; i++) {
      const a = eventsSorted[i - 1]!; const b = eventsSorted[i]!;
      expect(b.day, `${a.id} (день ${a.day}) → ${b.id} (день ${b.day})`).toBeGreaterThanOrEqual(a.day);
    }
  });

  it('внутри дня известные канонические часы идут по порядку службы', () => {
    for (let d = 0; d <= 8; d++) {
      const dayEvents = eventsSorted.filter((e) => e.day === d && e.hour !== 'unknown');
      for (let i = 1; i < dayEvents.length; i++) {
        const a = dayEvents[i - 1]!; const b = dayEvents[i]!;
        expect(hourRank(b.hour), `${a.id} (${a.hour}) → ${b.id} (${b.hour})`).toBeGreaterThanOrEqual(hourRank(a.hour));
      }
    }
  });

  it('о событии нельзя узнать раньше, чем оно произошло', () => {
    for (const e of events) {
      // события первого дня видны и без спойлеров (revealDay 0 — «завязка первого дня»)
      if (e.day >= 2 && e.day <= 7) expect(e.revealDay, e.id).toBeGreaterThanOrEqual(e.day);
      if (e.day === 1) expect(e.revealDay === 0 || e.revealDay >= 1, e.id).toBe(true);
      if (e.day === 8) expect(e.revealDay === 7 && e.critical, e.id).toBe(true);
      for (const l of e.later ?? []) expect(notBefore(l, e), `${e.id}: «${l.text.slice(0, 40)}…»`).toBe(true);
    }
  });

  it('связанные события и порядок номеров уникальны', () => {
    const seqs = events.map((e) => e.sequence);
    expect(new Set(seqs).size).toBe(seqs.length);
    for (const e of events) expect(e.relatedEventIds, e.id).not.toContain(e.id);
  });
});

describe('присутствие и знания', () => {
  it('участник события уже появился в повествовании', () => {
    for (const e of events) for (const id of e.characterIds) {
      const c = characterById.get(id)!;
      expect(c.revealDay <= e.revealDay || (e.critical && e.revealDay >= 7), `${e.id}: ${id} (с дня ${c.revealDay})`).toBe(true);
    }
  });

  it('место события уже известно читателю', () => {
    for (const e of events) {
      if (!e.locationId) continue;
      const l = locationById.get(e.locationId)!;
      expect((l.revealDay ?? 0) <= e.revealDay, `${e.id} → ${l.id}`).toBe(true);
    }
  });

  it('улика открывается не раньше события, в котором появляется', () => {
    for (const c of clues) {
      const e = eventById.get(c.eventId)!;
      expect(notBefore(c, e), `${c.id} ← ${e.id}`).toBe(true);
      for (const l of c.later ?? []) expect(notBefore(l, c), `${c.id}: «${l.text.slice(0, 40)}…»`).toBe(true);
    }
  });

  it('события ссылаются только на улики, которые открываются не раньше их самих', () => {
    for (const e of events) for (const id of e.clueIds) {
      const c = clueById.get(id)!;
      // улика может открыться позже (по ходу расследования), но не раньше события, если она к нему привязана
      if (c.eventId === e.id) expect(c.revealDay, `${e.id} ↔ ${id}`).toBeGreaterThanOrEqual(e.revealDay);
    }
  });

  it('версии: связи с уликами не открываются раньше самих улик', () => {
    for (const h of hypotheses) {
      for (const l of h.links) {
        const c = clueById.get(l.clueId)!;
        expect(notBefore(l, c), `${h.id} → ${l.clueId}`).toBe(true);
      }
      expect(new Set(h.links.map((l) => l.clueId)).size, `${h.id}: повтор улики`).toBe(h.links.length);
    }
  });

  it('досье, судьбы и значения мест не открываются раньше самой сущности', () => {
    for (const c of characters) {
      for (const d of c.dossier) expect(d.revealDay >= c.revealDay, `${c.id}: ${d.heading}`).toBe(true);
      for (const f of c.fate) expect(f.revealDay >= c.revealDay, `${c.id}: «${f.text.slice(0, 40)}…»`).toBe(true);
      const fateDays = c.fate.map((f) => f.revealDay);
      expect([...fateDays].sort((a, b) => a - b), `${c.id}: судьба по порядку дней`).toEqual(fateDays);
    }
    for (const l of locations) for (const s of l.significance) expect(s.revealDay >= (l.revealDay ?? 0), l.id).toBe(true);
  });
});

describe('смерти', () => {
  it('дело о смерти согласовано со своим событием', () => {
    for (const d of deaths) {
      const e = eventById.get(d.eventId)!;
      expect(d.day, d.id).toBe(e.day);
      expect(d.revealDay, d.id).toBe(e.revealDay);
      expect(e.kinds, d.id).toContain('death');
      if (!d.bodyNotFound) expect(e.locationId, d.id).toBe(d.foundLocationId);
      expect(notBefore(d.finalExplanation, d), d.id).toBe(true);
      for (const t of d.revealedLater) expect(notBefore(t, d), `${d.id}: «${t.text.slice(0, 40)}…»`).toBe(true);
      if (d.deathLocationId) expect(notBefore(d.deathLocationId, d), d.id).toBe(true);
    }
  });
});

describe('граф связей', () => {
  it('у каждой связи есть текстовое основание: событие, где участвуют оба героя', () => {
    for (const r of relationships) {
      expect(r.eventIds.length, r.id).toBeGreaterThan(0);
      const both = r.eventIds.some((id) => {
        const e = eventById.get(id)!;
        const people = new Set([...e.characterIds, ...e.clueIds.flatMap((c) => clueById.get(c)!.characterIds)]);
        return people.has(r.fromCharacterId) && people.has(r.toCharacterId);
      });
      expect(both, `${r.id}: ни в одном событии нет обоих героев`).toBe(true);
    }
  });

  it('фазы связи идут по дням и не открываются раньше самой связи', () => {
    for (const r of relationships) {
      const days = r.phases.map((p) => p.revealDay);
      expect([...days].sort((a, b) => a - b), r.id).toEqual(days);
      expect(r.phases[0]!.revealDay, r.id).toBeGreaterThanOrEqual(r.revealDay);
      for (const p of r.phases) if (r.critical) expect(p.critical, `${r.id}: фаза раскрытой связи`).toBe(true);
    }
  });

  it('пары героев не дублируются', () => {
    const pairs = relationships.map((r) => [r.fromCharacterId, r.toCharacterId].sort().join('|'));
    expect(new Set(pairs).size).toBe(pairs.length);
  });
});

describe('маршруты', () => {
  it('шаг маршрута совпадает со своим событием по дню, месту и раскрытию', () => {
    for (const r of routes) for (const st of r.steps) {
      if (!st.eventId) continue;
      const e = eventById.get(st.eventId)!;
      expect(st.day, `${r.id}: ${st.note}`).toBe(e.day);
      expect(notBefore(st, e), `${r.id}: ${st.note}`).toBe(true);
      if (e.locationId && st.kind === 'confirmed') {
        const near = sameBranch(st.locationId, e.locationId)
          || locationById.get(st.locationId)!.parentId === locationById.get(e.locationId)!.parentId
          // путь внутри одного эпизода (мощехранилище → кухня → скрипторий): в маршруте есть и шаг в самом месте события
          || r.steps.some((o) => o.eventId === st.eventId && sameBranch(o.locationId, e.locationId!));
        expect(near, `${r.id}: ${st.locationId} ≠ ${e.locationId} (${e.id})`).toBe(true);
      }
    }
  });

  it('шаги маршрута идут в порядке романа', () => {
    for (const r of routes) {
      const seq = r.steps.filter((s) => s.eventId).map((s) => eventById.get(s.eventId!)!.sequence);
      expect([...seq].sort((a, b) => a - b), r.id).toEqual(seq);
    }
  });

  it('подтверждённый шаг: герой участвует в событии', () => {
    for (const r of routes) for (const st of r.steps) {
      if (!st.eventId || st.kind !== 'confirmed') continue;
      const e = eventById.get(st.eventId)!;
      // присутствие подтверждает либо сам эпизод, либо свидетельство из него (Бенций видел Малахию в лечебнице)
      const present = new Set([...e.characterIds, ...e.clueIds.flatMap((c) => clueById.get(c)!.characterIds)]);
      expect(present.has(r.characterId), `${r.id}: ${st.note}`).toBe(true);
    }
  });
});

describe('исторические справки', () => {
  it('ссылаются на события, где действительно есть эти герои', () => {
    for (const n of historicalNotes) {
      const inEvents = new Set(n.eventIds.flatMap((id) => eventById.get(id)!.characterIds));
      expect(n.characterIds.some((c) => inEvents.has(c)), n.id).toBe(true);
    }
  });
});
