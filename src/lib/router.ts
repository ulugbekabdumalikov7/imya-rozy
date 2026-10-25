import { useEffect, useState } from 'react';

export interface Route {
  /** Сегменты пути: ['heroes', 'william'] */
  path: string[];
  params: URLSearchParams;
}

const SECTIONS = new Set(['map', 'heroes', 'relations', 'compare', 'timeline', 'clues', 'history', 'sources']);

/**
 * Разбор адреса. Поддерживаются «#/map?loc=church» (основной формат, переживает перезагрузку)
 * и короткие якоря «#map», «#heroes» — для ссылок, где передаётся только простой якорь.
 */
export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  if (raw && !raw.startsWith('/')) {
    const token = raw.split(/[?&]/)[0] ?? '';
    return { path: SECTIONS.has(token) ? [token] : [], params: new URLSearchParams() };
  }
  const [pathPart = '', query = ''] = raw.replace(/^\//, '').split('?');
  return {
    path: pathPart.split('/').filter(Boolean).map(decodeURIComponent),
    params: new URLSearchParams(query),
  };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export function href(path: string, params?: Record<string, string | number | undefined | null>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  const qs = q.toString();
  return `#/${path.replace(/^\//, '')}${qs ? `?${qs}` : ''}`;
}

export function navigate(path: string, params?: Record<string, string | number | undefined | null>, replace = false) {
  const h = href(path, params);
  if (replace) {
    const url = new URL(window.location.href);
    url.hash = h;
    try {
      window.history.replaceState(null, '', url.toString());
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } catch {
      // в песочнице history может быть недоступна — меняем якорь обычным способом
      window.location.hash = h;
    }
  } else {
    window.location.hash = h;
  }
}

/** Обновить отдельные параметры текущего адреса: undefined — не трогать, null — удалить. */
export function patchParams(route: Route, patch: Record<string, string | number | undefined | null>, replace = true) {
  const next: Record<string, string> = {};
  route.params.forEach((v, k) => (next[k] = v));
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue; // undefined — оставить как есть
    if (v === null || v === '') delete next[k];
    else next[k] = String(v);
  }
  navigate(route.path.join('/'), next, replace);
}
