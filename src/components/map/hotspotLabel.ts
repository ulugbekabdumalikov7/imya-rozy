import { locationById } from '../../data';
import type { PlanHotspot } from '../../data/plans';
import type { Gate } from '../../data/types';

export interface HotspotLabel {
  title: string;
  sub?: string;
}

/** Подпись зоны при наведении и выборе: буква с плана и название. */
export function hotspotLabel(h: PlanHotspot, visible: (g: Gate) => boolean): HotspotLabel {
  const loc = h.locationId ? locationById.get(h.locationId) : undefined;
  const known = !h.revealDay || visible({ revealDay: h.revealDay });
  const name = known ? h.name : (h.safeName ?? h.name);
  const atlasName = loc && known && visible({ revealDay: loc.revealDay ?? 0 }) ? loc.name : undefined;
  if (!h.printed) return { title: atlasName ?? name, sub: atlasName && atlasName !== name ? name : undefined };
  // У зоны с буквой главное — буква и название по легенде плана;
  // если в романе место называется иначе («Храмина» — Эдифиций), даём это второй строкой.
  const stem = (t: string) => t.toLowerCase().split(' ')[0]!.slice(0, 5);
  const differs = atlasName && stem(atlasName) !== stem(name);
  const sub = differs ? `в романе: ${atlasName}` : undefined;
  // в библиотеке буква уже входит в название («Комната «A»»)
  return { title: h.plan === 'abbey' ? `${h.printed} — ${name}` : name, sub };
}
