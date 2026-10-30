/// <reference types="vitest" />
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Шрифты первого экрана: заголовок и основной текст. Остальные грузятся по мере надобности. */
const PRELOAD_FONTS = [
  /cormorant-garamond-cyrillic-500-normal-[\w-]+\.woff2$/,
  /alegreya-cyrillic-400-normal-[\w-]+\.woff2$/,
];

/** Добавляет в index.html предзагрузку шрифтов и метку сборки (коммит), чтобы видеть, какая версия развёрнута. */
function deployMeta(): Plugin {
  const commit = (
    process.env.CF_PAGES_COMMIT_SHA ??
    process.env.WORKERS_CI_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    ''
  ).slice(0, 7);
  return {
    name: 'deploy-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const fonts = Object.keys(ctx.bundle ?? {}).filter((f) => PRELOAD_FONTS.some((re) => re.test(f)));
        return [
          ...fonts.map((f) => ({
            tag: 'link',
            attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${f}`, crossorigin: '' },
            injectTo: 'head' as const,
          })),
          ...(commit ? [{ tag: 'meta', attrs: { name: 'build', content: commit }, injectTo: 'head' as const }] : []),
        ];
      },
    },
  };
}

/** Служебные файлы Cloudflare и сам service worker в кэш не кладём. */
const NOT_PRECACHED = new Set(['_headers', '_redirects', 'robots.txt', 'sw.js', 'index.html']);

/**
 * PWA: после сборки пишет dist/sw.js из scripts/sw-template.js — со списком всех файлов сайта
 * и версией по их содержимому (новый деплой → новая версия → старый кэш удаляется).
 */
function pwa(): Plugin {
  let outDir = 'dist';
  return {
    name: 'pwa-service-worker',
    apply: 'build',
    configResolved(c) {
      outDir = c.build.outDir;
    },
    writeBundle() {
      const walk = (d: string): string[] =>
        readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
      const files = walk(outDir)
        .map((f) => relative(outDir, f).split(sep).join('/'))
        .filter((f) => !NOT_PRECACHED.has(f))
        .sort();
      const hash = createHash('sha256');
      for (const f of [...files, 'index.html']) hash.update(f).update(readFileSync(join(outDir, f)));
      const version = hash.digest('hex').slice(0, 12);
      const precache = ['/', ...files.map((f) => `/${f}`)];
      const sw = readFileSync('scripts/sw-template.js', 'utf8')
        .replace("'__VERSION__'", JSON.stringify(version))
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2));
      writeFileSync(join(outDir, 'sw.js'), sw);
    },
  };
}

// `npm run build` — сборка сайта в dist/ (её публикует Cloudflare Pages).
// `npm run build:single` — один самодостаточный HTML-файл в dist-single/ (для публикации как одной страницы).
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    // Абсолютные пути: страница корректно грузит ресурсы с любого адреса (например, /foo/bar после SPA-отката Pages).
    base: single ? './' : '/',
    // одиночный HTML (для предпросмотра одной страницей) — без service worker
    plugins: [react(), ...(single ? [viteSingleFile()] : [deployMeta(), pwa()])],
    build: {
      outDir: single ? 'dist-single' : 'dist',
      target: 'es2020',
      assetsInlineLimit: single ? undefined : 2048,
      reportCompressedSize: false,
      rollupOptions: single
        ? undefined
        : {
            output: {
              // React и иконки меняются реже, чем контент: отдельный файл дольше живёт в кэше браузера.
              manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
            },
          },
    },
    test: { environment: 'node', include: ['tests/**/*.test.{ts,tsx}'] },
  };
});
