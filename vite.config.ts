/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/** Шрифты первого экрана: заголовок и основной текст. Остальные грузятся по мере надобности. */
const PRELOAD_FONTS = [/cormorant-garamond-cyrillic-500-normal-[\w-]+\.woff2$/, /alegreya-cyrillic-400-normal-[\w-]+\.woff2$/];

/** Добавляет в index.html предзагрузку шрифтов и метку сборки (коммит), чтобы видеть, какая версия развёрнута. */
function deployMeta(): Plugin {
  const commit = (process.env.CF_PAGES_COMMIT_SHA ?? process.env.WORKERS_CI_COMMIT_SHA ?? process.env.GITHUB_SHA ?? '').slice(0, 7);
  return {
    name: 'deploy-meta',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const fonts = Object.keys(ctx.bundle ?? {}).filter((f) => PRELOAD_FONTS.some((re) => re.test(f)));
        return [
          ...fonts.map((f) => ({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${f}`, crossorigin: '' }, injectTo: 'head' as const })),
          ...(commit ? [{ tag: 'meta', attrs: { name: 'build', content: commit }, injectTo: 'head' as const }] : []),
        ];
      },
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
    plugins: [react(), single ? viteSingleFile() : deployMeta()],
    build: {
      outDir: single ? 'dist-single' : 'dist',
      target: 'es2020',
      assetsInlineLimit: single ? undefined : 2048,
      reportCompressedSize: false,
      rollupOptions: single ? undefined : {
        output: {
          // React и иконки меняются реже, чем контент: отдельный файл дольше живёт в кэше браузера.
          manualChunks: (id) => (id.includes('node_modules') ? 'vendor' : undefined),
        },
      },
    },
    test: { environment: 'node', include: ['tests/**/*.test.{ts,tsx}'] },
  };
});
