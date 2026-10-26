import { useEffect, useRef } from 'react';
import { BookMarked, Clock3, Download, Landmark, Map as MapIcon, Moon, Network, RefreshCw, ScrollText, Sun, Users, X } from 'lucide-react';
import { href, useRoute } from './lib/router';
import { useSwap, DURATION } from './lib/motion';
import { SpoilerProvider } from './state/spoiler';
import { SpoilerControl } from './components/SpoilerControl';
import { setTheme, useTheme } from './lib/theme';
import { applyUpdate, dismissUpdate, installApp, usePwa } from './lib/pwa';
import { HomeSection } from './sections/HomeSection';
import { MapSection } from './sections/MapSection';
import { HeroesSection } from './sections/HeroesSection';
import { RelationsSection } from './sections/RelationsSection';
import { TimelineSection } from './sections/TimelineSection';
import { CluesSection } from './sections/CluesSection';
import { HistorySection } from './sections/HistorySection';
import { SourcesSection } from './sections/SourcesSection';

const NAV = [
  { to: 'map', label: 'Карта', icon: MapIcon, match: ['map'] },
  { to: 'heroes', label: 'Герои', icon: Users, match: ['heroes'] },
  { to: 'relations', label: 'Судьбы', icon: Network, match: ['relations', 'compare'] },
  { to: 'timeline', label: 'Хронология', icon: Clock3, match: ['timeline'] },
  { to: 'clues', label: 'Улики', icon: BookMarked, match: ['clues'] },
  { to: 'history', label: 'История', icon: Landmark, match: ['history'] },
];

const TITLES: Record<string, string> = {
  map: 'Карта', heroes: 'Герои', relations: 'Судьбы', compare: 'Сравнение судеб', timeline: 'Хронология', clues: 'Улики', history: 'История', sources: 'Источники',
};

/** Знак: роза-окно — круг и восемь лучей, тонкой линией. */
export function RoseMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="13.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * Math.PI) / 4;
        return <line key={i} x1={16 + 4 * Math.cos(a)} y1={16 + 4 * Math.sin(a)} x2={16 + 13.5 * Math.cos(a)} y2={16 + 13.5 * Math.sin(a)} stroke="currentColor" strokeWidth="1" />;
      })}
      <circle cx="16" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

/** На узком экране вкладки прокручиваются: затухающий край показывает, что есть ещё, активная вкладка всегда видна. */
function useNavOverflow(activeKey: string) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    const update = () => {
      nav.classList.toggle('has-more-start', nav.scrollLeft > 2);
      nav.classList.toggle('has-more-end', nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 2);
    };
    update();
    nav.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    return () => { nav.removeEventListener('scroll', update); ro.disconnect(); };
  }, []);
  useEffect(() => {
    const nav = ref.current;
    const active = nav?.querySelector<HTMLElement>('a.is-active');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    const left = active.offsetLeft - nav.offsetLeft;
    if (left < nav.scrollLeft || left + active.offsetWidth > nav.scrollLeft + nav.clientWidth) {
      nav.scrollTo({ left: Math.max(0, left - (nav.clientWidth - active.offsetWidth) / 2), behavior: 'smooth' });
    }
  }, [activeKey]);
  return ref;
}

/** Переключатель темы: ночь (тёмная) ↔ пергамент (светлая). */
function ThemeToggle() {
  const theme = useTheme();
  const toLight = theme === 'dark';
  const label = toLight ? 'Включить светлую тему' : 'Включить тёмную тему';
  return (
    <button type="button" className="theme-toggle" onClick={() => setTheme(toLight ? 'light' : 'dark')} aria-label={label} title={label}>
      {toLight ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
    </button>
  );
}

/** Плашка о новой версии сайта: обновление применяется по нажатию, а не посреди чтения. */
function UpdateNotice() {
  const { updateReady } = usePwa();
  if (!updateReady) return null;
  return (
    <div className="update-notice" role="status">
      <RefreshCw size={15} aria-hidden="true" />
      <span>Атлас обновился</span>
      <button type="button" className="btn btn-small btn-accent" onClick={applyUpdate}>Обновить</button>
      <button type="button" className="icon-btn" onClick={dismissUpdate} aria-label="Позже"><X size={15} /></button>
    </div>
  );
}

/** Кнопка установки на устройство — видна, только когда браузер готов её предложить. */
function InstallButton() {
  const { canInstall } = usePwa();
  if (!canInstall) return null;
  return (
    <p><button type="button" className="link-btn install-btn" onClick={() => { void installApp(); }}><Download size={14} aria-hidden="true" /> Установить на устройство — работает без интернета</button></p>
  );
}

function Shell() {
  const liveRoute = useRoute();
  const navRef = useNavOverflow(liveRoute.path[0] ?? '');
  // Уход текущей страницы (лёгкое размытие) и появление новой — только при смене раздела.
  const { shown: route, phase } = useSwap(liveRoute, liveRoute.path[0] ?? '', DURATION.fast);
  const section = route.path[0] ?? '';

  useEffect(() => {
    const name = TITLES[section]; // неизвестный адрес показывает главную — и заголовок главной
    document.title = name ? `${name} · Атлас «Имени розы»` : 'Атлас «Имени розы»';
  }, [section]);
  const entity = route.path[1];
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [section, entity]);

  let content;
  switch (section) {
    case 'map': content = <MapSection route={route} />; break;
    case 'heroes': content = <HeroesSection route={route} />; break;
    case 'relations':
    case 'compare': content = <RelationsSection route={route} />; break;
    case 'timeline': content = <TimelineSection route={route} />; break;
    case 'clues': content = <CluesSection route={route} />; break;
    case 'history': content = <HistorySection route={route} />; break;
    case 'sources': content = <SourcesSection route={route} />; break;
    default: content = <HomeSection />;
  }

  return (
    <div className={`app section-${section || 'home'}`}>
      <UpdateNotice />
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>К содержанию</a>
      <header className="topbar">
        <a className="wordmark" href={href('')} aria-label="Атлас «Имени розы» — на главную">
          <RoseMark className="wordmark-rose" />
          <span className="wordmark-text">Имя розы<span className="wordmark-sub">атлас аббатства · 1327</span></span>
        </a>
        <nav className="mainnav" aria-label="Разделы" ref={navRef}>
          {NAV.map((n) => {
            const active = n.match.includes(liveRoute.path[0] ?? '');
            const Icon = n.icon;
            return (
              <a key={n.to} href={href(n.to)} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}>
                <Icon size={16} aria-hidden="true" /> <span>{n.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="topbar-actions">
          <ThemeToggle />
          <SpoilerControl />
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <div key={section} className={`page-swap${phase === 'out' ? ' is-out' : ''}`}>{content}</div>
      </main>
      {section !== 'map' && (
        <footer className="footer">
          <p>Атлас по роману Умберто Эко «Имя розы» (1980). Тексты — пересказ, а не цитаты; карты — эталонные планы из книги с выровненными зонами.</p>
          <p><a href={href('sources')}><ScrollText size={14} aria-hidden="true" /> Источники и достоверность</a></p>
          <InstallButton />
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SpoilerProvider>
      <Shell />
    </SpoilerProvider>
  );
}
