import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { MEETING_EVENT_ID, MEETING_SCENE_MS, meetingPoint } from '../src/components/map/MeetingRose';
import { anchorIn, eventById, locationById } from '../src/data';
import { isVisible } from '../src/lib/spoilers';

describe('встреча Адсона и девушки — знак-роза на карте', () => {
  const e = eventById.get(MEETING_EVENT_ID)!;

  it('событие существует: кухня, третья ночь, Адсон и девушка', () => {
    expect(e).toBeDefined();
    expect(e.locationId).toBe('kitchen');
    expect(e.day).toBe(3);
    expect(e.characterIds).toEqual(expect.arrayContaining(['adso', 'girl']));
  });

  it('кухня — часть Эдифиция: роза стоит у Эдифиция, а не на выдуманном месте плана', () => {
    expect(locationById.get('kitchen')!.parentId).toBe('aedificium');
    expect(anchorIn('abbey', 'kitchen')).toEqual(anchorIn('abbey', 'aedificium'));
    expect(meetingPoint(1)).not.toBeNull();
    expect(anchorIn('library', 'kitchen')).toBeNull(); // на плане верхнего этажа кухни нет
  });

  it('спойлеры: роза видна с третьего дня и не видна без спойлеров', () => {
    expect(isVisible(e, { mode: 'progress', day: 2 })).toBe(false);
    expect(isVisible(e, { mode: 'progress', day: 3 })).toBe(true);
    expect(isVisible(e, { mode: 'safe', day: 1 })).toBe(false);
    expect(isVisible(e, { mode: 'full', day: 7 })).toBe(true);
  });

  it('длительность сцены в коде совпадает с анимацией затемнения в стилях', () => {
    const css = readFileSync(join(__dirname, '..', 'src', 'styles.css'), 'utf8');
    const veil = css.match(/\.scene-veil \{[^}]*animation: scene-veil ([\d.]+)s/)?.[1];
    expect(Number(veil) * 1000).toBe(MEETING_SCENE_MS);
    expect(css).toMatch(/prefers-reduced-motion[\s\S]*\.meeting-glow \{ animation: none/);
  });
});
