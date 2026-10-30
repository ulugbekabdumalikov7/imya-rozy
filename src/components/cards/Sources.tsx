import { sourceById } from '../../data';
import { href } from '../../lib/router';
import { useSpoiler } from '../../state/spoiler';

export function Sources({ ids }: { ids: string[] }) {
  const { critical } = useSpoiler();
  const items = ids.map((id) => sourceById.get(id)).filter((s) => s && (!s.critical || critical));
  if (!items.length) return null;
  return (
    <p className="sources-line">
      Источники:{' '}
      {items.map((s, i) => (
        <span key={s!.id}>
          {i > 0 && '; '}
          <a href={href('sources', { s: s!.id })} lang={s!.lang}>
            {s!.title}
          </a>
        </span>
      ))}
    </p>
  );
}

// ───────────────────────── Помещение ─────────────────────────
