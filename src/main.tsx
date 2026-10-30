import './fonts.css';
import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App';
import { registerServiceWorker } from './lib/pwa';
import { applyTheme, getTheme } from './lib/theme';

// Тема уже выставлена скриптом theme-init.js; повтор нужен для сборки одним файлом, где его нет.
applyTheme(getTheme());

// Работа без сети и установка на устройство — только в собранном сайте (в сборке одним файлом service worker нет).
if (import.meta.env.PROD && import.meta.env.MODE !== 'single') registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
