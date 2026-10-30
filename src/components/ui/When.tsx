import { dayLabel, hourLabels } from '../../data';
import type { StoryEvent } from '../../data/types';

export function When({ e }: { e: StoryEvent }) {
  return (
    <span className="when">
      {dayLabel(e.day)}
      {e.hour !== 'unknown' && <> · {hourLabels[e.hour]}</>}
    </span>
  );
}
