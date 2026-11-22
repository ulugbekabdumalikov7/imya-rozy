/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Адрес для запасного варианта обратной связи (письмо из почтовой программы читателя). Необязателен. */
  readonly VITE_FEEDBACK_EMAIL?: string;
}
