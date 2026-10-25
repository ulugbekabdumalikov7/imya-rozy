import { useEffect, useRef, useState } from 'react';
import { BookOpenCheck, ChevronDown, Eye, EyeOff, Minus, Plus } from 'lucide-react';
import { modeLabels, type SpoilerMode } from '../lib/spoilers';
import { useSpoiler } from '../state/spoiler';

const ICONS = { safe: EyeOff, progress: BookOpenCheck, full: Eye } as const;

export function SpoilerPicker({ compact = false }: { compact?: boolean }) {
  const { spoiler, request } = useSpoiler();
  const setMode = (mode: SpoilerMode) => request({ ...spoiler, mode });
  return (
    <div className={`spoiler-picker${compact ? ' is-compact' : ''}`}>
      <div className="seg" role="radiogroup" aria-label="Режим раскрытия сюжета">
        {(Object.keys(modeLabels) as SpoilerMode[]).map((m) => {
          const Icon = ICONS[m];
          return (
            <button key={m} type="button" role="radio" aria-checked={spoiler.mode === m} className={spoiler.mode === m ? 'is-active' : ''} onClick={() => setMode(m)} title={modeLabels[m].hint}>
              <Icon size={15} aria-hidden="true" /> {modeLabels[m].title}
            </button>
          );
        })}
      </div>
      {spoiler.mode === 'progress' && (
        <div className="day-stepper" role="group" aria-label="День чтения">
          <button type="button" className="icon-btn" disabled={spoiler.day <= 1} onClick={() => request({ ...spoiler, day: spoiler.day - 1 })} aria-label="Предыдущий день"><Minus size={14} /></button>
          <span className="day-stepper-value" aria-live="polite">Прочитан день <strong>{spoiler.day}</strong> из 7</span>
          <button type="button" className="icon-btn" disabled={spoiler.day >= 7} onClick={() => request({ ...spoiler, day: spoiler.day + 1 })} aria-label="Следующий день"><Plus size={14} /></button>
        </div>
      )}
    </div>
  );
}

/** Компактная кнопка в шапке: открывает выбор режима. */
export function SpoilerControl() {
  const { spoiler } = useSpoiler();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); };
  }, [open]);
  const Icon = ICONS[spoiler.mode];
  return (
    <div className="spoiler-control" ref={ref}>
      <button type="button" className={`spoiler-btn mode-${spoiler.mode}`} aria-expanded={open} aria-haspopup="true" onClick={() => setOpen((v) => !v)}>
        <Icon size={15} aria-hidden="true" />
        <span className="spoiler-btn-text">{modeLabels[spoiler.mode].title}{spoiler.mode === 'progress' && ` · д.${spoiler.day}`}</span>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
      {open && (
        <div className="spoiler-pop" role="dialog" aria-label="Режим раскрытия сюжета">
          <p className="rubric" lang="la">Quantum legisti?</p>
          <p className="small">Сколько вы уже прочитали? Режим влияет на все разделы: карту, связи, хронологию и улики.</p>
          <SpoilerPicker />
          <p className="small muted">{modeLabels[spoiler.mode].hint}</p>
        </div>
      )}
    </div>
  );
}
