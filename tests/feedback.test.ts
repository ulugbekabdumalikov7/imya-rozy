import { describe, expect, it, vi } from 'vitest';

import { handleFeedback } from '../server/feedback';
import { feedbackSubject, mailtoHref, sendFeedback, validateFeedback } from '../src/lib/feedback';

const SITE = 'https://atlas.example';
const ENV = { RESEND_API_KEY: 'test-key', FEEDBACK_TO: 'author@example.com' };
const GOOD = {
  kind: 'fact',
  message: 'Аймаро в главе третьего дня стоит не там.',
  page: '#/map',
  mode: 'Без спойлеров',
};

const post = (body: unknown, headers: Record<string, string> = {}) =>
  new Request(`${SITE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: SITE, 'User-Agent': 'test', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

const okSender = () =>
  vi.fn(async () => new Response('{"id":"1"}', { status: 200 })) as unknown as typeof fetch & ReturnType<typeof vi.fn>;

describe('проверка письма', () => {
  it('принимает обычное письмо и обрезает пробелы', () => {
    const v = validateFeedback({ ...GOOD, message: '  Текст письма  ', contact: '  ' });
    expect(v.ok && v.value.message).toBe('Текст письма');
    expect(v.ok && v.value.contact).toBeUndefined();
  });
  it('отклоняет пустое, слишком короткое, слишком длинное и с чужой темой', () => {
    expect(validateFeedback(null).ok).toBe(false);
    expect(validateFeedback({ ...GOOD, message: 'ой' }).ok).toBe(false);
    expect(validateFeedback({ ...GOOD, message: 'а'.repeat(4001) }).ok).toBe(false);
    expect(validateFeedback({ ...GOOD, kind: 'toString' }).ok).toBe(false);
  });
  it('тема письма короткая и говорит, о чём оно', () => {
    const v = validateFeedback({ ...GOOD, message: 'Очень '.repeat(30) });
    const subject = feedbackSubject(v.ok ? v.value : (null as never));
    expect(subject).toMatch(/^\[Атлас «Имени розы»\] Ошибка в фактах: /);
    expect(subject.length).toBeLessThan(110);
  });
  it('запасное письмо из почтовой программы содержит текст и страницу', () => {
    const v = validateFeedback(GOOD);
    const href = mailtoHref(v.ok ? v.value : (null as never), 'author@example.com');
    expect(href.startsWith('mailto:author@example.com?subject=')).toBe(true);
    expect(decodeURIComponent(href)).toContain('Страница: #/map');
  });
});

describe('сервер: /api/feedback', () => {
  it('отправляет письмо через Resend автору, с ответом на контакт читателя', async () => {
    const send = okSender();
    const res = await handleFeedback(post({ ...GOOD, contact: 'reader@example.com' }), ENV, send);
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledOnce();
    const [url, init] = send.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
    const body = JSON.parse(String(init.body));
    expect(body.to).toEqual(['author@example.com']);
    expect(body.reply_to).toBe('reader@example.com');
    expect(body.text).toContain('Аймаро');
    expect(body.text).toContain('Страница: #/map');
  });

  it('без настроек отвечает 503 — сайт предложит запасной путь', async () => {
    const send = okSender();
    expect((await handleFeedback(post(GOOD), {}, send)).status).toBe(503);
    expect((await handleFeedback(post(GOOD), { RESEND_API_KEY: 'k' }, send)).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });

  it('отклоняет чужой сайт, не JSON, неверный метод и плохое письмо', async () => {
    const send = okSender();
    expect((await handleFeedback(post(GOOD, { Origin: 'https://evil.example' }), ENV, send)).status).toBe(403);
    expect((await handleFeedback(post('не json'), ENV, send)).status).toBe(400);
    expect((await handleFeedback(post({ ...GOOD, message: '' }), ENV, send)).status).toBe(400);
    expect((await handleFeedback(new Request(`${SITE}/api/feedback`), ENV, send)).status).toBe(405);
    expect((await handleFeedback(post('x'.repeat(20000)), ENV, send)).status).toBe(413);
    expect(send).not.toHaveBeenCalled();
  });

  it('письмо бота (заполнено скрытое поле) молча не отправляется', async () => {
    const send = okSender();
    const res = await handleFeedback(post({ ...GOOD, website: 'http://spam' }), ENV, send);
    expect(res.status).toBe(200);
    expect(send).not.toHaveBeenCalled();
  });

  it('если Resend не принял письмо — 502', async () => {
    const send = vi.fn(async () => new Response('bad', { status: 422 })) as unknown as typeof fetch;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await handleFeedback(post(GOOD), ENV, send)).status).toBe(502);
  });
});

describe('сайт: отправка', () => {
  it('различает «отправлено», «недоступно» и «ошибку»', async () => {
    const reply = (status: number) => (async () => new Response('{}', { status })) as unknown as typeof fetch;
    const p = { kind: 'idea' as const, message: 'Добавьте карту окрестностей' };
    expect(await sendFeedback(p, reply(200))).toBe('sent');
    expect(await sendFeedback(p, reply(503))).toBe('unavailable');
    expect(await sendFeedback(p, reply(404))).toBe('unavailable');
    expect(await sendFeedback(p, reply(400))).toBe('invalid');
    expect(await sendFeedback(p, reply(502))).toBe('failed');
    const offline = (async () => {
      throw new TypeError('network');
    }) as unknown as typeof fetch;
    expect(await sendFeedback(p, offline)).toBe('unavailable');
  });
});
