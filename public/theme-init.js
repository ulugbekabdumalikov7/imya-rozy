// Тема выставляется до отрисовки страницы, чтобы при светлой теме не мигал тёмный фон.
// Отдельный файл, а не встроенный скрипт: так требует CSP (script-src 'self').
(function () {
  var theme = 'dark';
  try { if (localStorage.getItem('rose-atlas:theme') === 'light') theme = 'light'; } catch (e) { /* хранилище недоступно */ }
  document.documentElement.dataset.theme = theme;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f3eee3' : '#0c0b0a');
})();
