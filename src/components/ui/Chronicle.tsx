import { locationById } from '../../data';
import type { StoryEvent } from '../../data/types';
import { href } from '../../lib/router';
import { eventTitle } from '../../lib/visible';
import { useSpoiler } from '../../state/spoiler';
import { When } from './When';

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
