/**
 * Обратная связь: общие правила для формы на сайте и для серверной отправки письма.
 * Модуль без зависимостей от браузера — его же использует обработчик на Cloudflare.
 *
 * Адрес получателя в коде не хранится: на сервере он задаётся переменной FEEDBACK_TO,
 * а для запасного варианта «через почтовую программу» — переменной сборки VITE_FEEDBACK_EMAIL.
 */

export const FEEDBACK_ENDPOINT = '/api/feedback';

export const FEEDBACK_KINDS = {
  fact: 'Ошибка в фактах',
  bug: 'Неполадка на сайте',
  idea: 'Идея',
  other: 'Другое',
} as const;
export type FeedbackKind = keyof typeof FEEDBACK_KINDS;

export const MESSAGE_MIN = 5;
export const MESSAGE_MAX = 4000;
const CONTACT_MAX = 200;
const META_MAX = 300;

export interface FeedbackPayload {
  kind: FeedbackKind;
  message: string;
  /** Как ответить читателю — необязательно. */
  contact?: string;
  /** Страница атласа, с которой написали (адрес после #). */
  page?: string;
  /** Режим чтения: без спойлеров, по ходу чтения (день), всё расследование. */
  mode?: string;
  /** Ловушка для ботов: поле скрыто от людей и должно остаться пустым. */
  website?: string;
}

export type Validation = { ok: true; value: FeedbackPayload } | { ok: false; error: string };

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function validateFeedback(input: unknown): Validation {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Пустое письмо' };
  const o = input as Record<string, unknown>;
  const kind = str(o.kind);
  if (!Object.prototype.hasOwnProperty.call(FEEDBACK_KINDS, kind))
    return { ok: false, error: 'Неизвестная тема письма' };
  const message = str(o.message);
  if (message.length < MESSAGE_MIN) return { ok: false, error: 'Напишите хотя бы несколько слов' };
  if (message.length > MESSAGE_MAX) return { ok: false, error: `Письмо длиннее ${MESSAGE_MAX} знаков` };
  const contact = str(o.contact);
  if (contact.length > CONTACT_MAX) return { ok: false, error: 'Слишком длинный контакт' };
  return {
    ok: true,
    value: {
      kind: kind as FeedbackKind,
      message,
      contact: contact || undefined,
      page: str(o.page).slice(0, META_MAX) || undefined,
      mode: str(o.mode).slice(0, META_MAX) || undefined,
      website: str(o.website) || undefined,
    },
  };
}

export const isEmail = (s: string | undefined): s is string => !!s && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s);

export function feedbackSubject(p: FeedbackPayload): string {
  const firstLine = p.message.split('\n')[0]!.replace(/\s+/g, ' ');
  const short = firstLine.length > 60 ? `${firstLine.slice(0, 57)}…` : firstLine;
  return `[Атлас «Имени розы»] ${FEEDBACK_KINDS[p.kind]}: ${short}`;
}

export function feedbackText(p: FeedbackPayload, extra: Record<string, string | undefined> = {}): string {
  const meta: [string, string | undefined][] = [
    ['Тема', FEEDBACK_KINDS[p.kind]],
    ['Контакт', p.contact],
    ['Страница', p.page],
    ['Режим чтения', p.mode],
    ...Object.entries(extra),
  ];
  return [p.message, '', '—', ...meta.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`)].join('\n');
}

/** Запасной путь, когда отправка с сайта недоступна: письмо в почтовой программе читателя. */
export function mailtoHref(p: FeedbackPayload, to: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(feedbackSubject(p))}&body=${encodeURIComponent(feedbackText(p))}`;
}

export type SendResult = 'sent' | 'unavailable' | 'invalid' | 'failed';

/** Отправить письмо через сервер атласа. «unavailable» — отправка не настроена или нет сети. */
export async function sendFeedback(p: FeedbackPayload, f: typeof fetch = fetch): Promise<SendResult> {
  try {
    const res = await f(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    });
    if (res.ok) return 'sent';
    if (res.status === 400) return 'invalid';
    if ([404, 405, 501, 503].includes(res.status)) return 'unavailable';
    return 'failed';
  } catch {
    return 'unavailable';
  }
}
