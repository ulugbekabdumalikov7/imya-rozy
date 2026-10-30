import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

/** Боковая панель на широком экране, нижний лист на телефоне. */
export function DetailPanel({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  // Escape закрывает панель (если фокус не в поле ввода и не открыт диалог подтверждения).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('.dialog')) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <aside className="detail-panel" aria-label={label}>
      <button type="button" className="icon-btn detail-close" onClick={onClose} aria-label="Закрыть панель">
        <X size={18} />
      </button>
      <div className="detail-scroll">{children}</div>
    </aside>
  );
}
