import { CalendarDays, MapPin, User } from 'lucide-react';
import { type ReactNode } from 'react';

import { characterById, locationById, preferredView } from '../../data';
import type { StoryEvent } from '../../data/types';
import { href } from '../../lib/router';
import { eventTitle } from '../../lib/visible';
import { useSpoiler } from '../../state/spoiler';

export function CharChip({ id }: { id: string }) {
  const { visible } = useSpoiler();
  const c = characterById.get(id);
  if (!c || !visible(c)) return null;
  return (
    <a className="chip chip-char" href={href(`heroes/${c.id}`)}>
      <User size={13} aria-hidden="true" /> {c.short}
    </a>
  );
}

export function LocChip({ id, onPick }: { id: string; onPick?: (id: string) => void }) {
  const { visible } = useSpoiler();
  const l = locationById.get(id);
  if (!l || !visible({ revealDay: l.revealDay ?? 0 })) return null;
  const content = (
    <>
      <MapPin size={13} aria-hidden="true" /> {l.name}
    </>
  );
  return onPick ? (
    <button type="button" className="chip chip-loc" onClick={() => onPick(l.id)}>
      {content}
    </button>
  ) : (
    <a className="chip chip-loc" href={href('map', { loc: l.id, view: preferredView(l.id) })}>
      {content}
    </a>
  );
}

export function EventChip({ e, onPick }: { e: StoryEvent; onPick?: (id: string) => void }) {
  const { spoiler } = useSpoiler();
  const content = (
    <>
      <CalendarDays size={13} aria-hidden="true" />
      <span className="chip-meta">{e.day === 0 ? 'до' : e.day === 8 ? 'эпил.' : `д.${e.day}`}</span>{' '}
      {eventTitle(e, spoiler)}
    </>
  );
  return onPick ? (
    <button type="button" className="chip chip-event" onClick={() => onPick(e.id)}>
      {content}
    </button>
  ) : (
    <a className="chip chip-event" href={href('timeline', { event: e.id })}>
      {content}
    </a>
  );
}

export function ChipRow({ title, children, empty }: { title: string; children: ReactNode[]; empty?: string }) {
  const items = children.filter(Boolean);
  return (
    <div className="chip-block">
      <h4>{title}</h4>
      {items.length ? (
        <div className="chips">{items}</div>
      ) : (
        <p className="muted small">{empty ?? 'Нет связанных сведений на этом этапе чтения.'}</p>
      )}
    </div>
  );
}
