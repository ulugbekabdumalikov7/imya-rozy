import { characterById, eventById, relationLabels, relationshipById } from '../../data';
import { href } from '../../lib/router';
import { useSpoiler } from '../../state/spoiler';
import { CertaintyBadge, CharChip, ChipRow, EventChip, Withheld } from '../ui';
import { Sources } from './Sources';

export function RelationDetail({ id }: { id: string }) {
  const { visible } = useSpoiler();
  const r = relationshipById.get(id);
  if (!r || !visible(r)) return <Withheld>Эта связь откроется позже.</Withheld>;
  const a = characterById.get(r.fromCharacterId)!;
  const b = characterById.get(r.toCharacterId)!;
  const phases = r.phases.filter((p) => visible(p));
  const hidden = r.phases.length > phases.length;
  const evs = r.eventIds.map((x) => eventById.get(x)!).filter((e) => visible(e));
  return (
    <article className="card stagger">
      <p className="card-kicker">Связь {r.directed ? '→ направленная' : '↔ взаимная'}</p>
      <h2 className="card-title">
        {a.short} {r.directed ? '→' : '—'} {b.short}
      </h2>
      <CertaintyBadge c={r.certainty} />
      <h3>Как менялось отношение</h3>
      <ol className="phase-list">
        {phases.map((p, i) => (
          <li key={i}>
            <span className={`rel-tag rel-${p.type}`}>{relationLabels[p.type]}</span>
            <span className="mono small">{p.revealDay === 0 ? 'с начала' : `с ${p.revealDay}-го дня`}</span>
            <p>
              {p.note} <CertaintyBadge c={p.certainty} />
            </p>
          </li>
        ))}
      </ol>
      {hidden && <Withheld>Дальнейшее развитие этой связи откроется позже.</Withheld>}
      {evs.length > 0 && (
        <ChipRow title="Подтверждающие эпизоды">
          {evs.map((e) => (
            <EventChip key={e.id} e={e} />
          ))}
        </ChipRow>
      )}
      <div className="chips">
        <CharChip id={a.id} />
        <CharChip id={b.id} />
      </div>
      <p className="small">
        <a href={href('compare', { a: a.id, b: b.id })}>Сравнить судьбы</a>
      </p>
      <Sources ids={r.sourceIds} />
    </article>
  );
}
