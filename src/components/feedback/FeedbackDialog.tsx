import { Check, Mail, Send } from 'lucide-react';
import { type FormEvent, type KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';

import {
  FEEDBACK_KINDS,
  type FeedbackKind,
  type FeedbackPayload,
  mailtoHref,
  MESSAGE_MAX,
  MESSAGE_MIN,
  sendFeedback,
  type SendResult,
} from '../../lib/feedback';
import { modeLabels } from '../../lib/spoilers';
import { useSpoiler } from '../../state/spoiler';

export interface FeedbackDraft {
  kind: FeedbackKind;
  message: string;
  contact: string;
}

export const EMPTY_DRAFT: FeedbackDraft = { kind: 'fact', message: '', contact: '' };

interface Props {
  draft: FeedbackDraft;
  onDraft: (d: FeedbackDraft) => void;
  onClose: () => void;
  /** Для тестов: чем отправлять. */
  send?: typeof sendFeedback;
}

type Status = 'idle' | 'sending' | SendResult;

/** Адрес для запасного варианта задаётся при сборке; без него остаётся только отправка с сайта. */
const fallbackEmail = import.meta.env.VITE_FEEDBACK_EMAIL;

/**
 * Форма «Написать автору»: тема, текст, необязательный контакт. Письмо уходит через сервер атласа;
 * если отправка с сайта недоступна, предлагается отправить то же письмо из почтовой программы.
 */
export function FeedbackDialog({ draft, onDraft, onClose, send = sendFeedback }: Props) {
  const { spoiler } = useSpoiler();
  const [status, setStatus] = useState<Status>('idle');
  const [website, setWebsite] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const payload = (): FeedbackPayload => ({
    kind: draft.kind,
    message: draft.message.trim(),
    contact: draft.contact.trim() || undefined,
    page: window.location.hash || '#/',
    mode:
      spoiler.mode === 'progress'
        ? `${modeLabels.progress.title}, день ${spoiler.day}`
        : modeLabels[spoiler.mode].title,
    website: website || undefined,
  });

  const tooShort = draft.message.trim().length < MESSAGE_MIN;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (tooShort || status === 'sending') return;
    setStatus('sending');
    const result = await send(payload());
    setStatus(result);
    if (result === 'sent') onDraft(EMPTY_DRAFT);
  };

  const trapTab = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = [
      ...dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], textarea, input:not([tabindex="-1"])',
      ),
    ];
    const first = items[0];
    const last = items[items.length - 1];
    if (!first || !last) return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const sent = status === 'sent';
  const offline = status === 'unavailable' || status === 'failed';

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        ref={dialogRef}
        className="dialog feedback"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fb-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapTab}
      >
        <p className="rubric" lang="la">
          Scriptor lectori
        </p>
        <h2 id="fb-title">{sent ? 'Письмо отправлено' : 'Написать автору'}</h2>

        {sent ? (
          <div className="feedback-done" role="status">
            <span className="feedback-seal" aria-hidden="true">
              <Check size={20} />
            </span>
            <p>Спасибо! Письмо уже у автора атласа. Если вы оставили контакт, ответ придёт туда.</p>
            <div className="dialog-actions">
              <button type="button" className="btn btn-accent" onClick={onClose}>
                Вернуться в аббатство
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <p className="feedback-intro">
              Нашли ошибку в фактах, неполадку или хотите что-то предложить? Письмо придёт автору атласа.
            </p>

            <fieldset className="feedback-kinds">
              <legend>О чём письмо</legend>
              <div className="chips">
                {(Object.keys(FEEDBACK_KINDS) as FeedbackKind[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={`chip${draft.kind === k ? ' is-active' : ''}`}
                    aria-pressed={draft.kind === k}
                    onClick={() => onDraft({ ...draft, kind: k })}
                  >
                    {FEEDBACK_KINDS[k]}
                  </button>
                ))}
              </div>
            </fieldset>

            <label className="feedback-field">
              <span>Сообщение</span>
              <textarea
                ref={textRef}
                rows={5}
                maxLength={MESSAGE_MAX}
                required
                value={draft.message}
                onChange={(e) => onDraft({ ...draft, message: e.target.value })}
                placeholder={
                  draft.kind === 'fact'
                    ? 'Что не так и как в романе (если помните — глава или страница)'
                    : 'Расскажите подробнее'
                }
              />
            </label>

            <label className="feedback-field">
              <span>
                Как с вами связаться <em>необязательно</em>
              </span>
              <input
                type="email"
                autoComplete="email"
                maxLength={200}
                value={draft.contact}
                onChange={(e) => onDraft({ ...draft, contact: e.target.value })}
                placeholder="почта, если нужен ответ"
              />
            </label>

            {/* ловушка для ботов: люди это поле не видят */}
            <input
              className="feedback-trap"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <p className="feedback-meta">К письму приложим страницу, с которой вы пишете, и режим чтения.</p>

            {status === 'invalid' && (
              <p className="feedback-error" role="alert">
                Письмо не приняли: проверьте текст и попробуйте ещё раз.
              </p>
            )}
            {offline && (
              <p className="feedback-error" role="alert">
                {fallbackEmail
                  ? 'Сейчас не получилось отправить с сайта. Можно отправить то же письмо из вашей почты — текст уже готов.'
                  : 'Сейчас не получилось отправить с сайта. Текст сохранится — попробуйте чуть позже.'}
              </p>
            )}

            <div className="dialog-actions">
              <button type="button" className="btn" onClick={onClose}>
                Отмена
              </button>
              {offline && fallbackEmail && (
                <a className="btn" href={mailtoHref(payload(), fallbackEmail)}>
                  <Mail size={15} aria-hidden="true" /> Через почту
                </a>
              )}
              <button type="submit" className="btn btn-accent" disabled={tooShort || status === 'sending'}>
                <Send size={15} aria-hidden="true" /> {status === 'sending' ? 'Отправляем…' : 'Отправить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
