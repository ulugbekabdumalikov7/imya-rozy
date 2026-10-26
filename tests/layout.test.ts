import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '..', 'src', 'styles.css'), 'utf8');

describe('вёрстка для телефона', () => {
  it('анимация смены страницы не оставляет transform после окончания (иначе нижние панели уезжают с экрана)', () => {
    const rule = css.match(/\.page-swap \{ animation: ([^;]+);/)?.[1] ?? '';
    expect(rule).toContain('page-in');
    expect(rule).not.toMatch(/\b(both|forwards)\b/);
  });

  it('карта на телефоне повторяет пропорции плана, без пустых полос', () => {
    const mobile = css.slice(css.indexOf('@media (max-width: 900px)'));
    expect(mobile).toMatch(/\.plan-svg \{[^}]*aspect-ratio: var\(--plan-ratio/);
    expect(mobile).toMatch(/\.map-zoom \{[^}]*position: static/);
    expect(mobile).toMatch(/\.route-bar \{[^}]*position: static/);
  });

  it('у меню есть затухающий край, когда вкладки не помещаются', () => {
    expect(css).toMatch(/\.mainnav\.has-more-end \{[^}]*mask-image/);
  });

  it('кровь на «И» стекает при каждом заходе на главную, а не только при первом', () => {
    expect(css).toMatch(/\.drip-return \.drip-reveal-a \{ animation: drip-grow/);
    expect(css).toMatch(/\.drip-intro \.drip-reveal-a \{ animation: drip-grow/);
    // вид анимации не зависит от фазы вступления — смена фазы не перезапускает кровь
    expect(css).not.toMatch(/\.intro\.is-(playing|rest) \.drip-/);
  });
});
