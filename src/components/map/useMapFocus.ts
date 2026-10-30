import { useEffect, useRef } from 'react';

import { anchorIn, hotspotAnchor } from '../../data';
import type { PlanHotspot } from '../../data/plans';
import type { MapView } from '../../data/types';
import type { usePanZoom } from '../../lib/usePanZoom';

export type FocusReason = 'event' | 'location' | 'step' | 'none';

interface FocusOptions {
  pz: ReturnType<typeof usePanZoom>;
  view: MapView;
  /** Меняется при каждом новом выборе — по нему камера и срабатывает. */
  focusKey: string;
  focusReason: FocusReason;
  focusLocationId?: string;
  selected?: PlanHotspot;
  panelOpen: boolean;
  momentActive: boolean;
  /** Задержка первого подлёта: план ещё проявляется. */
  settleDelay: number;
}

const isMobile = () => {
  try {
    return window.matchMedia('(max-width: 900px)').matches;
  } catch {
    return false;
  }
};

/** Камера: событие — подлёт с приближением; шаг маршрута — перевод; зона — если план уже приближен. */
export function useMapFocus(o: FocusOptions) {
  const firstFocus = useRef(true);
  useEffect(() => {
    const a = o.focusLocationId ? anchorIn(o.view, o.focusLocationId) : o.selected ? hotspotAnchor(o.selected) : null;
    if (!a) {
      firstFocus.current = false;
      return;
    }
    const { pz } = o;
    const mobileSheet = isMobile() && o.panelOpen;
    // на компьютере полоса «Час за часом» закрывает низ карты — место момента поднимаем выше центра
    const momentBar = o.momentActive && !o.panelOpen && !isMobile();
    const height = pz.visibleBox.y1 - pz.visibleBox.y0;
    const oy = mobileSheet ? height * 0.36 : momentBar ? height * 0.22 : 0;
    const go = () => {
      if (o.focusReason === 'event') pz.focus(a[0], a[1], 2, 950, false, oy);
      else if (o.focusReason === 'step') pz.focus(a[0], a[1], 1.5, 800, false, oy);
      else if (mobileSheet) pz.focus(a[0], a[1], 1.7, 700, false, oy);
      else if (pz.view.k > 1.05) pz.focus(a[0], a[1], undefined, 700);
    };
    if (firstFocus.current) {
      firstFocus.current = false;
      const t = window.setTimeout(go, o.settleDelay);
      return () => window.clearTimeout(t);
    }
    go();
    // камера реагирует только на новый выбор, а не на каждое движение плана
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.focusKey]);
}
