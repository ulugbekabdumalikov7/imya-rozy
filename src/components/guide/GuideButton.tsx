import { Compass } from 'lucide-react';

import { openGuide, useActiveTour } from '../../lib/guide';
import type { Route } from '../../lib/router';
import { tourForRoute } from './tours';

/** Кнопка в шапке: подсказки к текущему разделу, а вне разделов — общий путеводитель. */
export function GuideButton({ route }: { route: Route }) {
  const active = useActiveTour();
  const tour = tourForRoute(route) ?? 'intro';
  const label = tour === 'intro' ? 'Путеводитель по атласу' : 'Подсказки к разделу';
  return (
    <button
      type="button"
      className="theme-toggle guide-btn"
      onClick={() => openGuide(tour)}
      aria-label={label}
      title={label}
      aria-pressed={!!active}
      data-guide="guide"
    >
      <Compass size={17} aria-hidden="true" />
    </button>
  );
}
