import { useSyncExternalStore } from 'react';

/**
 * PWA: регистрация service worker, сообщение о новой версии и установка на устройство.
 * Работает только в собранном сайте (не в режиме разработки и не в сборке одним файлом).
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaState {
  /** Новая версия скачана и ждёт — можно обновить страницу. */
  updateReady: boolean;
  /** Браузер разрешает установить сайт как приложение (Chrome, Edge, Android). */
  canInstall: boolean;
}

let state: PwaState = { updateReady: false, canInstall: false };
let waiting: ServiceWorker | null = null;
let installEvent: InstallPromptEvent | null = null;
/** Читатель нажал «Обновить» — после смены версии страницу нужно перезагрузить. */
let updateRequested = false;
const listeners = new Set<() => void>();
const emit = (patch: Partial<PwaState>) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };

export function usePwa(): PwaState {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => state);
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // кнопка «Установить» появляется, только когда браузер готов предложить установку
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installEvent = e as InstallPromptEvent;
    emit({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => { installEvent = null; emit({ canInstall: false }); });

  // после «Обновить» новая версия берёт управление — перезагружаем один раз.
  // При самом первом визите service worker тоже «берёт управление» — это не обновление, перезагружать нечего.
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || (!hadController && !updateRequested)) return;
    reloading = true;
    window.location.reload();
  });

  /** Страница уже из той же сборки, что и новый service worker (её открыли после деплоя)? */
  const pageIsFrom = (sw: ServiceWorker) => new Promise<boolean>((resolve) => {
    const entry = document.querySelector<HTMLScriptElement>('script[type="module"][src]');
    if (!entry) return resolve(false);
    const ch = new MessageChannel();
    const t = window.setTimeout(() => resolve(false), 2000);
    ch.port1.onmessage = (e) => { window.clearTimeout(t); resolve(e.data === true); };
    sw.postMessage({ type: 'has', url: new URL(entry.src).pathname }, [ch.port2]);
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      const offer = (sw: ServiceWorker | null) => {
        // первая установка (контроллера ещё нет) — это не обновление, сообщать не о чем
        if (!sw || !navigator.serviceWorker.controller) return;
        void pageIsFrom(sw).then((fresh) => {
          if (fresh) { reloading = true; sw.postMessage('skip-waiting'); } // на экране уже новая версия — меняем кэш молча
          else { waiting = sw; emit({ updateReady: true }); } // открыта старая версия — предлагаем обновить
        });
      };
      offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        sw?.addEventListener('statechange', () => { if (sw.state === 'installed') offer(sw); });
      });
      // открытая надолго вкладка тоже узнаёт о новой версии
      window.setInterval(() => { reg.update().catch(() => undefined); }, 60 * 60 * 1000);
    }).catch(() => undefined);
  });
}

export function applyUpdate() {
  updateRequested = true;
  if (waiting) waiting.postMessage('skip-waiting');
  else window.location.reload();
}

export function dismissUpdate() { emit({ updateReady: false }); }

export async function installApp() {
  if (!installEvent) return;
  await installEvent.prompt();
  await installEvent.userChoice.catch(() => undefined);
  installEvent = null;
  emit({ canInstall: false });
}
