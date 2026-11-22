import { Feather } from 'lucide-react';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { EMPTY_DRAFT, FeedbackDialog, type FeedbackDraft } from './FeedbackDialog';

/** Кнопка в шапке: «Написать автору». Черновик письма не пропадает, если закрыть форму. */
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<FeedbackDraft>(EMPTY_DRAFT);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        className="theme-toggle feedback-btn"
        onClick={() => setOpen(true)}
        aria-label="Написать автору"
        title="Написать автору"
        aria-haspopup="dialog"
      >
        <Feather size={17} aria-hidden="true" />
      </button>
      {/* форма — поверх всей страницы, а не внутри шапки */}
      {open && createPortal(<FeedbackDialog draft={draft} onDraft={setDraft} onClose={close} />, document.body)}
    </>
  );
}
