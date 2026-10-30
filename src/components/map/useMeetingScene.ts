import { useEffect, useState } from 'react';

import { eventById } from '../../data';
import type { MapView, StoryEvent } from '../../data/types';
import { reducedMotion } from '../../lib/motion';
import { useSpoiler } from '../../state/spoiler';
import { MEETING_EVENT_ID, MEETING_SCENE_DELAY_MS, MEETING_SCENE_MS } from './MeetingRose';

/**
 * Встреча Адсона и девушки: знак-роза на плане аббатства и короткая сцена при её открытии.
 * Каждое новое открытие встречи проигрывает сцену заново; при уменьшении движения сцены нет.
 */
export function useMeetingScene(view: MapView, selectedEventId: string | undefined, moment: StoryEvent | undefined) {
  const { visible } = useSpoiler();
  const meetingEvent = eventById.get(MEETING_EVENT_ID);
  // в «Час за часом» роза появляется только после самой встречи
  const shown =
    view === 'abbey' &&
    !!meetingEvent &&
    visible(meetingEvent) &&
    (!moment || meetingEvent.sequence <= moment.sequence);
  const selected = shown && selectedEventId === MEETING_EVENT_ID;
  const [sceneKey, setSceneKey] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!selected || reducedMotion()) {
      setPlaying(false);
      return;
    }
    const start = window.setTimeout(() => {
      setSceneKey((k) => k + 1);
      setPlaying(true);
    }, MEETING_SCENE_DELAY_MS);
    const end = window.setTimeout(() => setPlaying(false), MEETING_SCENE_DELAY_MS + MEETING_SCENE_MS);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [selected]);

  return { shown, selected, sceneKey, playing };
}
