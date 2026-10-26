import { describe, expect, it } from 'vitest';
import { eventById, events } from '../src/data';
import { isVisible } from '../src/lib/spoilers';
import { dayMarks, dayThread, firstMomentOfDay, happenedBy, momentLabel, momentSteps, resolveMoment } from '../src/lib/moments';

const full = { mode: 'full', day: 7 } as const;
const day3 = { mode: 'progress', day: 3 } as const;

describe('«Час за часом» — моменты романа', () => {
  it('шаги — все видимые события в авторском порядке', () => {
    const steps = momentSteps(full);
    expect(steps.length).toBe(events.filter((e) => isVisible(e, full)).length);
    for (let i = 1; i < steps.length; i++) expect(steps[i]!.sequence).toBeGreaterThan(steps[i - 1]!.sequence);
  });

  it('режим чтения ограничивает шкалу: дальше прочитанного не заглянуть', () => {
    const steps = momentSteps(day3);
    expect(steps.length).toBeGreaterThan(0);
    expect(steps.every((e) => isVisible(e, day3))).toBe(true);
    expect(Math.max(...steps.map((e) => e.day))).toBeLessThanOrEqual(3);
    expect(momentSteps({ mode: 'safe', day: 1 }).every((e) => e.day <= 1)).toBe(true);
  });

  it('подпись момента — день и канонический час, без выдуманного времени', () => {
    expect(momentLabel(eventById.get('e-adso-girl')!)).toBe('День третий · Ночь');
    const unknown = events.find((e) => e.hour === 'unknown')!;
    expect(momentLabel(unknown)).toMatch(/Время не уточнено$/);
  });

  it('скрытый режимом момент сворачивается к последнему доступному, а не исчезает', () => {
    const later = momentSteps(full).find((e) => e.day === 6)!;
    const r = resolveMoment(later.id, momentSteps(day3))!;
    expect(r.event.day).toBeLessThanOrEqual(3);
    expect(r.event.sequence).toBeLessThan(later.sequence);
    expect(resolveMoment('нет-такого', momentSteps(full))).toBeNull();
    expect(resolveMoment(null, momentSteps(full))).toBeNull();
  });

  it('срез «к этому часу»: случившееся раньше — да, позже — нет', () => {
    const m = eventById.get('e-adso-girl')!;
    const by = happenedBy(m);
    expect(by(m.sequence)).toBe(true);
    expect(by(m.sequence - 1)).toBe(true);
    expect(by(m.sequence + 1)).toBe(false);
    expect(happenedBy(undefined)(99999)).toBe(true); // вне режима — всё
  });

  it('нить дня и отметки дней на шкале', () => {
    const steps = momentSteps(full);
    const m = eventById.get('e-adso-girl')!;
    const thread = dayThread(m, steps);
    expect(thread.at(-1)!.id).toBe(m.id);
    expect(thread.every((e) => e.day === 3)).toBe(true);
    const marks = dayMarks(steps);
    expect(marks.map((x) => x.day)).toEqual([...new Set(steps.map((e) => e.day))]);
    expect(firstMomentOfDay(3, steps)!.id).toBe(steps[marks.find((x) => x.day === 3)!.index]!.id);
  });
});
