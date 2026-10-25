import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { criticalAllowed, isVisible, opensCritical, type SpoilerState } from '../lib/spoilers';
import { ConfirmDialog } from '../components/ConfirmDialog';

const KEY = 'rose-atlas:spoiler';

function load(): SpoilerState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const v = JSON.parse(raw) as Partial<SpoilerState>;
      if ((v.mode === 'safe' || v.mode === 'progress' || v.mode === 'full') && typeof v.day === 'number') {
        return { mode: v.mode, day: Math.min(7, Math.max(1, Math.round(v.day))) };
      }
    }
  } catch {
    /* хранилище недоступно — используем режим по умолчанию */
  }
  return { mode: 'safe', day: 1 };
}

interface Ctx {
  spoiler: SpoilerState;
  /** Запросить новый режим; если он открывает разгадку, сначала показывается предупреждение. */
  request: (next: SpoilerState) => void;
  visible: (g: { revealDay?: number; critical?: boolean }) => boolean;
  critical: boolean;
}

const SpoilerContext = createContext<Ctx | null>(null);

export function SpoilerProvider({ children }: { children: ReactNode }) {
  const [spoiler, setSpoiler] = useState<SpoilerState>(load);
  const [pending, setPending] = useState<SpoilerState | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(spoiler));
    } catch {
      /* ignore */
    }
  }, [spoiler]);

  const request = useCallback(
    (next: SpoilerState) => {
      if (opensCritical(spoiler, next)) setPending(next);
      else setSpoiler(next);
    },
    [spoiler],
  );

  const value = useMemo<Ctx>(
    () => ({ spoiler, request, visible: (g) => isVisible(g, spoiler), critical: criticalAllowed(spoiler) }),
    [spoiler, request],
  );

  return (
    <SpoilerContext.Provider value={value}>
      {children}
      {pending && (
        <ConfirmDialog
          title="Открыть разгадку?"
          confirmLabel="Да, показать всё"
          cancelLabel="Остаться без разгадки"
          onConfirm={() => {
            setSpoiler(pending);
            setPending(null);
          }}
          onCancel={() => setPending(null)}
        >
          В этом режиме атлас покажет, кто стоит за смертями, как они произошли и чем закончится роман. Это изменит карту, связи, хронологию и доску улик.
        </ConfirmDialog>
      )}
    </SpoilerContext.Provider>
  );
}

export function useSpoiler(): Ctx {
  const ctx = useContext(SpoilerContext);
  if (!ctx) throw new Error('useSpoiler вне SpoilerProvider');
  return ctx;
}
