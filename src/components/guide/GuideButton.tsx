import { Compass } from 'lucide-react';

import { openGuide, useGuideOpen } from '../../lib/guide';

/** Кнопка в шапке: пройти путеводитель ещё раз. */
export function GuideButton() {
  const open = useGuideOpen();
  return (
    <button
      type="button"
      className="theme-toggle guide-btn"
      onClick={openGuide}
      aria-label="Путеводитель по атласу"
      title="Путеводитель по атласу"
      aria-pressed={open}
      data-guide="guide"
    >
      <Compass size={17} aria-hidden="true" />
    </button>
  );
}
