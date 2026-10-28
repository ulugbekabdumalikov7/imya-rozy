import { useSyncExternalStore } from 'react';

/** Тема оформления: тёмная (ночное аббатство, по умолчанию) или светлая (пергамент). Выбор хранится в браузере. */
export type Theme = 'dark' | 'light';

export const THEME_KEY = 'rose-atlas:theme';
const THEME_COLOR: Record<Theme, string> = { dark: '#0c0b0a', light: '#edeae4' };

const listeners = new Set<() => void>();

function stored(): Theme {
  try { return window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}

export function getTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === 'light' || t === 'dark' ? t : stored();
}

/** Применяет тему к документу (атрибут data-theme и цвет строки браузера). */
export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

export function setTheme(theme: Theme) {
  if (theme === getTheme()) return;
  const root = document.documentElement;
  const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (!calm) {
    root.classList.add('theme-switching');
    window.setTimeout(() => root.classList.remove('theme-switching'), 700);
  }
  applyTheme(theme);
  try { window.localStorage.setItem(THEME_KEY, theme); } catch { /* хранилище недоступно — тема действует до перезагрузки */ }
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    getTheme,
    () => 'dark',
  );
}
