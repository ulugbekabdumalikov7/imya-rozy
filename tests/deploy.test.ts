import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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
    for (const fam of ['Cormorant Garamond', 'Alegreya', 'Alegreya Sans', 'IBM Plex Mono']) expect(css).toContain(`font-family: '${fam}'`);
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
});
