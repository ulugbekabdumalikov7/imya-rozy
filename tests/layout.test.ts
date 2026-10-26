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

  it('дни на карте — одна ровная строка равных ячеек, без переноса рядами', () => {
    expect(css).toMatch(/\.seg-wrap \{ display: grid;[^}]*grid-auto-flow: column;/);
    expect(css).toMatch(/\.seg-wrap \{[^}]*grid-auto-columns: minmax\(0, 1fr\)/);
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

  it('во всплывающем окне три режима — одна ровная строка (окно достаточно широкое, перенос только внутри ячейки)', () => {
    expect(css).toMatch(/\.spoiler-pop \{[^}]*width: min\(470px/);
    expect(css).toMatch(/\.spoiler-pop \.spoiler-picker \.seg \{ display: grid; grid-template-columns: repeat\(3, auto\)/);
  });

  it('режимы спойлеров на узком экране стоят столбиком, а не переносятся с пустой ячейкой', () => {
    // правило для телефона должно перебивать и правило всплывающего окна (та же или большая специфичность)
    expect(css).toMatch(/@media \(max-width: 560px\) \{\s*\.spoiler-picker \.seg, \.spoiler-pop \.spoiler-picker \.seg \{ display: flex; flex-direction: column;/);
  });
});

describe('светлая тема', () => {
  const root = join(__dirname, '..');
  const light = css.match(/:root\[data-theme="light"\] \{([^}]+)\}/)?.[1] ?? '';

  it('переопределяет базовую палитру и все поверхности', () => {
    for (const token of ['--night', '--bone', '--ash', '--surface', '--halo', '--bar-bg', '--backdrop', '--spotlight']) {
      expect(light, token).toMatch(new RegExp(`${token}:`));
    }
    expect(light).toContain('color-scheme: light');
  });

  it('в стилях компонентов не осталось жёстко заданных тёмных фонов', () => {
    const body = css.slice(css.indexOf('* { box-sizing: border-box; }'));
    expect(body).not.toMatch(/#0e0d0b|#0c0b0a|rgba\(12, 11, 10/);
  });

  it('пары «фон кость — текст чернила» заменены на переключаемые (иначе в светлой теме тёмное на тёмном)', () => {
    expect(css).not.toMatch(/background: var\(--bone\); color: var\(--ink\)/);
  });

  it('тема выставляется до отрисовки отдельным скриптом (CSP запрещает встроенные)', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8');
    expect(html).toContain('<script src="/theme-init.js"></script>');
    const init = readFileSync(join(root, 'public', 'theme-init.js'), 'utf8');
    expect(init).toContain("'rose-atlas:theme'");
    expect(readFileSync(join(root, 'src', 'lib', 'theme.ts'), 'utf8')).toContain("THEME_KEY = 'rose-atlas:theme'");
  });
});
