import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..');
const read = (p: string) => readFileSync(join(root, p), 'utf8');

describe('конфигурация развёртывания', () => {
  it('index.html не зависит от сторонних серверов', () => {
    expect(read('index.html')).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
  });

  it('шрифты хранятся вместе с сайтом и все файлы из fonts.css существуют', () => {
    const css = read('src/fonts.css');
    const refs = [...css.matchAll(/url\('\.\/(assets\/fonts\/[^']+)'\)/g)].map((m) => m[1]!);
    expect(refs.length).toBeGreaterThan(0);
    for (const r of refs) expect(existsSync(join(root, 'src', r)), r).toBe(true);
    expect(css).not.toMatch(/https?:\/\//);
    // каждый шрифт из styles.css объявлен
    for (const fam of ['Cormorant Garamond', 'Alegreya', 'Alegreya Sans', 'IBM Plex Mono'])
      expect(css).toContain(`font-family: '${fam}'`);
  });

  it('_headers: строгая CSP только для своего домена и вечный кэш для хешированных файлов', () => {
    const h = read('public/_headers');
    const csp = h.match(/Content-Security-Policy: (.+)/)?.[1] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toMatch(/unsafe-eval|https?:\/\//);
    expect(h).toMatch(/\/assets\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/);
    expect(h).toMatch(/:project\.pages\.dev\/\*\n\s+X-Robots-Tag: noindex/);
  });

  it('маршрутизация через # — серверные перенаправления не нужны', () => {
    expect(read('src/lib/router.ts')).toMatch(/location\.hash/);
    expect(existsSync(join(root, 'public/_redirects'))).toBe(false);
  });

  it('планы хранятся в WebP и не тяжелее 600 КБ', () => {
    const plans = readdirSync(join(root, 'src/assets')).filter((f) => /plan/.test(f));
    expect(plans.sort()).toEqual(['abbey-plan.webp', 'library-plan.webp']);
    for (const p of plans) expect(statSync(join(root, 'src/assets', p)).size, p).toBeLessThan(600 * 1024);
  });

  it('версия Node для CI и Cloudflare задана в одном месте', () => {
    expect(read('.nvmrc').trim()).toMatch(/^\d+$/);
    expect(read('.github/workflows/ci.yml')).toContain('node-version-file: .nvmrc');
  });

  it('Cloudflare Worker: wrangler.jsonc отдаёт dist/ и не требует правки vite.config', () => {
    const cfg = JSON.parse(read('wrangler.jsonc').replace(/^\s*\/\/.*$/gm, ''));
    expect(cfg.assets.directory).toBe('./dist');
    expect(cfg.assets.not_found_handling).toBe('single-page-application');
    expect(cfg.previews).toEqual({}); // без него `wrangler preview` (сборки веток) падает
    // wrangler ищет в vite.config литерал plugins: [...]; без него сборка Worker падает
    expect(read('vite.config.ts')).toMatch(/plugins: \[react\(\)/);
  });
});

describe('PWA: установка и работа без интернета', () => {
  const manifest = JSON.parse(read('public/manifest.webmanifest'));

  it('манифест: русское название, запуск с главной, отдельное окно, цвета атласа', () => {
    expect(manifest.name).toBe('Атлас «Имени розы»');
    expect(manifest.short_name).toBe('Имя розы');
    expect(manifest.lang).toBe('ru');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#0c0b0a');
  });

  it('иконки 192, 512 и маскируемая для Android есть на диске; иконка для iPhone подключена', () => {
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes);
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']));
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
    for (const i of manifest.icons) expect(existsSync(join(root, 'public', i.src)), i.src).toBe(true);
    const html = read('index.html');
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />');
    expect(existsSync(join(root, 'public/icons/apple-touch-icon.png'))).toBe(true);
  });

  it('service worker: шаблон с местами для версии и списка файлов; страница кэшируется как «/» (Cloudflare перенаправляет /index.html)', () => {
    const sw = read('scripts/sw-template.js');
    expect(sw).toContain("'__VERSION__'");
    expect(sw).toContain('__PRECACHE__');
    expect(sw).toMatch(/cache\.put\('\/', copy\)/);
    expect(sw).not.toMatch(/['"]\/index\.html['"]/);
    expect(read('vite.config.ts')).toMatch(/NOT_PRECACHED = new Set\(\[[^\]]*'index\.html'/);
  });

  it('sw.js не кэшируется браузером надолго — новые версии приходят сразу', () => {
    expect(read('public/_headers')).toMatch(/\/sw\.js\n\s+Cache-Control: no-cache/);
  });

  it('service worker регистрируется только в собранном сайте и не в сборке одним файлом', () => {
    expect(read('src/main.tsx')).toMatch(
      /import\.meta\.env\.PROD && import\.meta\.env\.MODE !== 'single'\) registerServiceWorker\(\)/,
    );
  });
});
