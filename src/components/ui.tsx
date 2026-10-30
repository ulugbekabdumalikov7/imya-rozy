import {
  BookOpen,
  CalendarDays,
  Castle,
  Cross,
  Crown,
  Eye,
  Feather,
  Flame,
  Flower2,
  Gem,
  Glasses,
  Hammer,
  KeyRound,
  Leaf,
  Lock,
  MapPin,
  Scale,
  Soup,
  Stamp,
  User,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

import { characterById, dayLabel, hourLabels, locationById, preferredView } from '../data';
import type { Certainty, Character, StoryEvent } from '../data/types';
import { href } from '../lib/router';
import { eventTitle } from '../lib/visible';
import { useSpoiler } from '../state/spoiler';

const EMBLEMS = {
  lens: Glasses,
  quill: Feather,
  key: KeyRound,
  eye: Eye,
  book: BookOpen,
  herb: Leaf,
  scale: Scale,
  cross: Cross,
  flame: Flame,
  tower: Castle,
  bowl: Soup,
  seal: Stamp,
  crown: Crown,
  rose: Flower2,
  hammer: Hammer,
  glass: Gem,
} as const;

export function Emblem({ c, size = 40 }: { c: Character; size?: number }) {
  const Icon = EMBLEMS[c.emblem];
  return (
    <span className={`emblem emblem-${c.group}`} style={{ width: size, height: size }} aria-hidden="true">
      <Icon size={Math.round(size * 0.48)} strokeWidth={1.6} />
    </span>
  );
}

const CERTAINTY: Record<Certainty, { label: string; hint: string }> = {
  confirmed: { label: 'по тексту', hint: 'Прямо следует из текста романа.' },
  interpretation: { label: 'толкование', hint: 'Вывод из текста или реконструкция по косвенным данным.' },
  uncertain: { label: 'не установлено', hint: 'Роман не даёт однозначного ответа или сведения расходятся.' },
};

export function CertaintyBadge({ c }: { c?: Certainty }) {
  if (!c) return null;
  const v = CERTAINTY[c];
  return (
    <span className={`certainty certainty-${c}`} title={v.hint}>
      <span className="sr-only">Достоверность: </span>
      {v.label}
    </span>
  );
}

/** Нейтральная заглушка: ничего не сообщает о характере скрытых сведений. */
export function Withheld({ children = 'Эти сведения откроются позже по ходу чтения.' }: { children?: ReactNode }) {
  return (
    <p className="withheld">
      <Lock size={14} aria-hidden="true" /> {children}
    </p>
  );
}

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

export function When({ e }: { e: StoryEvent }) {
  return (
    <span className="when">
      {dayLabel(e.day)}
      {e.hour !== 'unknown' && <> · {hourLabels[e.hour]}</>}
    </span>
  );
}

export function SectionHead({ latin, title, children }: { latin: string; title: string; children?: ReactNode }) {
  return (
    <header className="section-head">
      <p className="rubric" lang="la">
        {latin}
      </p>
      <h1>{title}</h1>
      {children && <div className="section-lede">{children}</div>}
    </header>
  );
}

/** Боковая панель на широком экране, нижний лист на телефоне. */
export function DetailPanel({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  // Escape закрывает панель (если фокус не в поле ввода и не открыт диалог подтверждения).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('.dialog')) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <aside className="detail-panel" aria-label={label}>
      <button type="button" className="icon-btn detail-close" onClick={onClose} aria-label="Закрыть панель">
        <X size={18} />
      </button>
      <div className="detail-scroll">{children}</div>
    </aside>
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

/**
 * Хроника судьбы: вертикальная линия, точки по событиям.
 * Бордовый проступает только в ключевых точках: смерть, обнаружение тела, финал.
 */
export function Chronicle({ events, characterId }: { events: StoryEvent[]; characterId?: string }) {
  const { spoiler } = useSpoiler();
  return (
    <ol className="chronicle">
      {events.map((e, i) => {
        const key =
          e.kinds.includes('death') ||
          e.kinds.includes('finale') ||
          (e.kinds.includes('discovery') && e.characterIds[0] === characterId);
        const loc = e.locationId ? locationById.get(e.locationId) : undefined;
        return (
          <li key={e.id} className={`chron-item${key ? ' is-key' : ''}`} style={{ ['--i' as string]: Math.min(i, 14) }}>
            <span className="chron-dot" aria-hidden="true" />
            <span className="chron-when">
              <When e={e} />
            </span>
            <a className="chron-title" href={href('timeline', { event: e.id })}>
              {eventTitle(e, spoiler)}
            </a>
            {loc && <span className="chron-place"> · {loc.name}</span>}
          </li>
        );
      })}
    </ol>
  );
}
