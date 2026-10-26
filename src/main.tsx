import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './fonts.css';
import './styles.css';
import { applyTheme, getTheme } from './lib/theme';

// Тема уже выставлена скриптом theme-init.js; повтор нужен для сборки одним файлом, где его нет.
applyTheme(getTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
