// @vitest-environment happy-dom
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EMPTY_DRAFT, FeedbackDialog, type FeedbackDraft } from '../src/components/feedback/FeedbackDialog';
import type { FeedbackPayload, SendResult } from '../src/lib/feedback';
import { SpoilerProvider } from '../src/state/spoiler';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let host: HTMLElement;
beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  window.location.hash = '#/clues';
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

function mount(send: (p: FeedbackPayload) => Promise<SendResult>, onClose = () => {}) {
  function Harness() {
    const [draft, setDraft] = useState<FeedbackDraft>(EMPTY_DRAFT);
    return createElement(FeedbackDialog, { draft, onDraft: setDraft, onClose, send });
  }
  act(() => root.render(createElement(SpoilerProvider, null, createElement(Harness))));
}

const type = (el: HTMLTextAreaElement | HTMLInputElement, value: string) => {
  const proto = Object.getPrototypeOf(el);
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
};
const submitBtn = () => document.querySelector<HTMLButtonElement>('button[type="submit"]')!;

describe('форма «Написать автору»', () => {
  it('не отправляет пустое письмо', () => {
    const send = vi.fn(async () => 'sent' as const);
    mount(send);
    expect(submitBtn().disabled).toBe(true);
  });

  it('отправляет тему, текст, контакт, страницу и режим чтения; после — благодарит', async () => {
    const send = vi.fn(async (_p: FeedbackPayload) => 'sent' as const);
    mount(send);
    act(() => [...document.querySelectorAll<HTMLButtonElement>('.feedback-kinds .chip')][2]!.click()); // «Идея»
    act(() => type(document.querySelector('textarea')!, 'Хочу карту окрестностей аббатства'));
    act(() => type(document.querySelector('input[type="email"]')!, 'reader@example.com'));
    await act(async () => submitBtn().click());
    expect(send).toHaveBeenCalledOnce();
    const p = send.mock.calls[0]![0];
    expect(p).toMatchObject({
      kind: 'idea',
      message: 'Хочу карту окрестностей аббатства',
      contact: 'reader@example.com',
      page: '#/clues',
    });
    expect(p.mode).toBeTruthy();
    expect(p.website).toBeUndefined();
    expect(document.querySelector('#fb-title')!.textContent).toBe('Письмо отправлено');
  });

  it('если отправка недоступна — сообщает и сохраняет текст', async () => {
    mount(async () => 'unavailable');
    act(() => type(document.querySelector('textarea')!, 'Опечатка в досье Северина'));
    await act(async () => submitBtn().click());
    expect(document.querySelector('[role="alert"]')!.textContent).toMatch(/не получилось отправить/);
    expect(document.querySelector('textarea')!.value).toBe('Опечатка в досье Северина');
  });

  it('закрывается по Esc', () => {
    const onClose = vi.fn();
    mount(async () => 'sent', onClose);
    act(() => void window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
    expect(onClose).toHaveBeenCalled();
  });
});
