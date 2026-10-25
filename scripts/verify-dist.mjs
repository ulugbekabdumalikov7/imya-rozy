// Проверка готовой сборки перед публикацией: node scripts/verify-dist.mjs [папка]
// Ловит ошибки, которые не видят тесты: битые пути к ресурсам, внешние запросы, потерянные заголовки Cloudflare.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const dir = process.argv[2] ?? 'dist';
const errors = [];
const fail = (m) => errors.push(m);

const files = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? files(join(d, f)) : [join(d, f)]));

if (!existsSync(join(dir, 'index.html'))) {
  console.error(`✗ ${dir}/index.html не найден — сначала выполните npm run build`);
  process.exit(1);
}
const all = files(dir);
const html = readFileSync(join(dir, 'index.html'), 'utf8');

// 1. Каждый ресурс, на который ссылается index.html, существует и адресован от корня.
for (const [, ref] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^https?:\/\//.test(ref)) { fail(`внешний ресурс в index.html: ${ref}`); continue; }
  if (!ref.startsWith('/')) { fail(`относительный путь в index.html (сломается на вложенных адресах): ${ref}`); continue; }
  if (!existsSync(join(dir, ref))) fail(`index.html ссылается на отсутствующий файл: ${ref}`);
}
// 2. Ссылки внутри CSS (шрифты, картинки) ведут на существующие файлы.
for (const css of all.filter((f) => f.endsWith('.css'))) {
  for (const [, ref] of readFileSync(css, 'utf8').matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
    if (ref.startsWith('data:') || ref.startsWith('#') || ref.startsWith('%23')) continue; // встроенные данные и ссылки на SVG-фильтры
    if (/^https?:\/\//.test(ref)) { fail(`внешний ресурс в ${relative(dir, css)}: ${ref}`); continue; }
    const target = ref.startsWith('/') ? join(dir, ref) : join(css, '..', ref);
    if (!existsSync(target)) fail(`${relative(dir, css)} ссылается на отсутствующий файл: ${ref}`);
  }
}
// 3. В JS нет обращений к сторонним доменам (CSP разрешает только свой сайт).
for (const js of all.filter((f) => f.endsWith('.js'))) {
  const src = readFileSync(js, 'utf8');
  for (const [m] of src.matchAll(/["'`]https?:\/\/(?!www\.w3\.org|reactjs\.org|react\.dev)[^"'`\s]+/g)) {
    if (/fetch|import/.test(src.slice(Math.max(0, src.indexOf(m) - 40), src.indexOf(m)))) fail(`${relative(dir, js)}: запрос к стороннему адресу ${m}`);
  }
}
// 4. Заголовки Cloudflare Pages на месте.
const headersPath = join(dir, '_headers');
if (!existsSync(headersPath)) fail('нет файла _headers (кэш и заголовки безопасности)');
else {
  const h = readFileSync(headersPath, 'utf8');
  for (const need of ['Content-Security-Policy', 'X-Content-Type-Options', '/assets/*', 'immutable']) if (!h.includes(need)) fail(`в _headers нет «${need}»`);
}
// 5. Ничего лишнего и ничего слишком большого (лимит Pages — 25 МБ на файл, 20 000 файлов).
if (all.length > 20000) fail(`слишком много файлов: ${all.length}`);
for (const f of all) {
  const rel = relative(dir, f);
  if (/(^|\/)\.env/.test(rel) || rel.endsWith('.map')) fail(`в сборку попал служебный файл: ${rel}`);
  const size = statSync(f).size;
  if (size > 25 * 1024 * 1024) fail(`${rel} больше 25 МБ`);
  if (/\.(webp|jpe?g|png)$/.test(rel) && size > 600 * 1024) fail(`${rel}: изображение больше 600 КБ — сожмите его`);
}

const total = all.reduce((s, f) => s + statSync(f).size, 0);
if (errors.length) {
  console.error(`✗ Сборка ${dir}/ не прошла проверку:\n  - ${errors.join('\n  - ')}`);
  process.exit(1);
}
console.log(`✓ ${dir}/: ${all.length} файлов, ${(total / 1024).toFixed(0)} КБ — пути, заголовки и ресурсы в порядке`);
