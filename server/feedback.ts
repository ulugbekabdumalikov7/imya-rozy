import { feedbackSubject, feedbackText, isEmail, validateFeedback } from '../src/lib/feedback';

/**
 * Приём письма из формы «Написать автору» и отправка его на почту через Resend (resend.com).
 * Общий код для Cloudflare Worker (worker/index.ts) и для Cloudflare Pages Functions (functions/api/feedback.ts).
 */
export interface FeedbackEnv {
  /** Ключ Resend — секрет: панель Cloudflare или `npx wrangler secret put RESEND_API_KEY`. */
  RESEND_API_KEY?: string;
  /** Адрес, на который приходят письма. */
  FEEDBACK_TO?: string;
  /** От кого. Без своего домена в Resend — только onboarding@resend.dev. */
  FEEDBACK_FROM?: string;
}

const RESEND_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Атлас «Имени розы» <onboarding@resend.dev>';
const MAX_BODY = 16 * 1024;

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

export async function handleFeedback(
  request: Request,
  env: FeedbackEnv,
  send: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method' }, { Allow: 'POST' });

  // только со страниц самого атласа
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json(403, { error: 'origin' });
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) return json(415, { error: 'type' });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json(413, { error: 'size' });
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return json(400, { error: 'json' });
  }
  const v = validateFeedback(data);
  if (!v.ok) return json(400, { error: v.error });
  const p = v.value;
  if (p.website) return json(200, { ok: true }); // бот заполнил скрытое поле — молча не отправляем

  if (!env.RESEND_API_KEY || !isEmail(env.FEEDBACK_TO)) return json(503, { error: 'not-configured' });

  const res = await send(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.FEEDBACK_FROM || DEFAULT_FROM,
      to: [env.FEEDBACK_TO],
      subject: feedbackSubject(p),
      text: feedbackText(p, {
        Браузер: request.headers.get('User-Agent') ?? undefined,
        Отправлено: new Date().toISOString(),
      }),
      ...(isEmail(p.contact) ? { reply_to: p.contact } : {}),
    }),
  });
  if (!res.ok) {
    console.error('feedback: Resend ответил', res.status, await res.text().catch(() => ''));
    return json(502, { error: 'send-failed' });
  }
  return json(200, { ok: true });
}
