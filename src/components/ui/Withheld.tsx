import { Lock } from 'lucide-react';
import { type ReactNode } from 'react';

/** Нейтральная заглушка: ничего не сообщает о характере скрытых сведений. */
export function Withheld({ children = 'Эти сведения откроются позже по ходу чтения.' }: { children?: ReactNode }) {
  return (
    <p className="withheld">
      <Lock size={14} aria-hidden="true" /> {children}
    </p>
  );
}
