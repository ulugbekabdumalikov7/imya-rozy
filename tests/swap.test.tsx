// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DURATION, useSwap } from '../src/lib/motion';

// React 18: сообщаем, что обновления идут внутри act()
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Probe = { shown: string[]; phase: string; setDay: (d: number) => void };
let probe: Probe;
let root: Root;
let host: HTMLElement;

/** Как хронология: список фильтруется заново на каждой отрисовке — новый массив, тот же ключ. */
function Timeline() {
  const [day, setDay] = useState(1);
  const list = [`событие дня ${day}`]; // новый массив при каждой отрисовке
  const { shown, phase } = useSwap(list, `d${day}`, DURATION.fast);
  probe = { shown, phase, setDay };
  return null;
}

beforeEach(() => {
  vi.useFakeTimers();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  act(() => root.render(createElement(Timeline)));
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });

describe('useSwap — смена содержимого с уходом', () => {
  it('после смены дня старый список уходит, затем появляется новый (раньше фаза «уход» не заканчивалась)', () => {
    expect(probe.phase).toBe('in');
    act(() => probe.setDay(3));
    expect(probe.phase).toBe('out');
    expect(probe.shown).toEqual(['событие дня 1']); // пока уходит — показываем старое
    act(() => { vi.advanceTimersByTime(DURATION.fast + 10); });
    expect(probe.phase).toBe('in');
    expect(probe.shown).toEqual(['событие дня 3']);
  });

  it('новый массив с тем же ключом не запускает переход', () => {
    act(() => probe.setDay(1));
    expect(probe.phase).toBe('in');
  });

  it('быстрые клики: показывается последний выбор', () => {
    act(() => probe.setDay(2));
    act(() => { vi.advanceTimersByTime(40); probe.setDay(5); });
    act(() => { vi.advanceTimersByTime(40); probe.setDay(4); });
    act(() => { vi.advanceTimersByTime(DURATION.fast + 10); });
    expect(probe.phase).toBe('in');
    expect(probe.shown).toEqual(['событие дня 4']);
  });

  it('быстро туда и обратно к исходному ключу — уход всё равно завершается', () => {
    act(() => probe.setDay(2));
    act(() => { vi.advanceTimersByTime(40); probe.setDay(1); });
    act(() => { vi.advanceTimersByTime(DURATION.fast + 10); });
    expect(probe.phase).toBe('in');
    expect(probe.shown).toEqual(['событие дня 1']);
  });
});
