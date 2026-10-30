import { ArrowLeft } from 'lucide-react';

import { Sources } from '../components/cards';
import { CharChip, ChipRow, EventChip, LocChip, SectionHead } from '../components/ui';
import { characterById, eventById, historicalNoteById, historicalNotes, locationById } from '../data';
import type { HistoricalNote } from '../data/types';
import { href, type Route as AppRoute } from '../lib/router';
import { useSpoiler } from '../state/spoiler';

/** Текст справки с учётом режима: пока разгадка скрыта, берутся безопасные версии. */
function noteText(n: HistoricalNote, critical: boolean) {
  const s = critical ? {} : (n.safe ?? {});
  return {
    title: s.title ?? n.title,
    short: s.short ?? n.short,
    detail: s.detail ?? n.detail,
    inNovel: s.inNovel ?? n.inNovel,
    factVsFiction: s.factVsFiction ?? n.factVsFiction,
  };
}

export function HistorySection({ route }: { route: AppRoute }) {
  const { critical } = useSpoiler();
  const id = route.path[1];
  const note = id ? historicalNoteById.get(id) : undefined;
  return note ? (
    <HistoryNote id={note.id} />
  ) : (
    <div className="page">
      <SectionHead latin="Historia" title="Исторический контекст">
        <p>
          Роман разворачивается в конце ноября 1327 года, в разгар борьбы папы и императора. Эти справки помогают
          понять, о чём спорят герои, и показывают, где кончается история и начинается вымысел.
        </p>
      </SectionHead>
      <ol className="history-list">
        {historicalNotes.map((raw, i) => {
          const n = { ...raw, ...noteText(raw, critical) };
          return (
            <li key={n.id} style={{ ['--i' as string]: i }}>
              <a href={href(`history/${n.id}`)} className="history-item">
                <span className="history-num" aria-hidden="true">
                  {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][i]}
                </span>
                <span>
                  <span className="history-title">{n.title}</span>
                  <span className="history-short">{n.short}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function HistoryNote({ id }: { id: string }) {
  const { visible, critical } = useSpoiler();
  const raw = historicalNoteById.get(id)!;
  const n = { ...raw, ...noteText(raw, critical) };
  const idx = historicalNotes.findIndex((x) => x.id === id);
  const nextRaw = historicalNotes[idx + 1];
  const next = nextRaw ? { ...nextRaw, ...noteText(nextRaw, critical) } : undefined;
  const evs = n.eventIds.map((e) => eventById.get(e)!).filter((e) => visible(e));
  return (
    <div className="page">
      <a className="back" href={href('history')}>
        <ArrowLeft size={16} aria-hidden="true" /> Все темы
      </a>
      <div className="note-sheet sheet" key={n.id}>
        <SectionHead latin="Historia" title={n.title}>
          <p>{n.short}</p>
        </SectionHead>
        <div className="prose stagger">
          <p className="initial">{n.detail}</p>
          <h2>Как это отражается в романе</h2>
          <p>{n.inNovel}</p>
          <aside className="fact-fiction">
            <h3>История и вымысел</h3>
            <p>{n.factVsFiction}</p>
          </aside>
        </div>
        <ChipRow title="Герои">
          {n.characterIds
            .filter((c) => visible(characterById.get(c)!))
            .map((c) => (
              <CharChip key={c} id={c} />
            ))}
        </ChipRow>
        <ChipRow title="События">
          {evs.map((e) => (
            <EventChip key={e.id} e={e} />
          ))}
        </ChipRow>
        <ChipRow title="Места">
          {n.locationIds
            .filter((l) => visible({ revealDay: locationById.get(l)?.revealDay ?? 0 }))
            .map((l) => (
              <LocChip key={l} id={l} />
            ))}
        </ChipRow>
        <Sources ids={n.sourceIds} />
      </div>
      <p className="btn-row">
        <a className="btn" href={href('map')}>
          Вернуться к карте аббатства
        </a>
        {next && (
          <a className="btn" href={href(`history/${next.id}`)}>
            Следующая тема: {next.title}
          </a>
        )}
      </p>
    </div>
  );
}
