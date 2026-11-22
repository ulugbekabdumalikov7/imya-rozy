import { ArrowLeft, ArrowRight } from 'lucide-react';
import { type KeyboardEvent as ReactKeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { closeGuide, guideStatus, openGuide, useGuideOpen } from '../../lib/guide';
import { reducedMotion } from '../../lib/motion';
import { navigate, type Route } from '../../lib/router';
import { SpoilerPicker } from '../SpoilerControl';
import { RoseMark } from '../ui';
import { placeCard, threadPath } from './placement';
import { GUIDE_STEPS } from './steps';
import { useSpotlight } from './useSpotlight';

/** На главной путеводитель ждёт, пока доиграет вступление с заголовком. */
const AFTER_INTRO_MS = 4600;
const AFTER_LOAD_MS = 1000;
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/**
 * Путеводитель первого визита: пять коротких шагов по настоящему интерфейсу.
 * Сам открывается один раз; потом — по кнопке с компасом в шапке.
 */
export function Guide({ route }: { route: Route }) {
  const open = useGuideOpen();

  useEffect(() => {
    if (guideStatus()) return;
    const onHome = route.path.length === 0;
    const t = window.setTimeout(openGuide, onHome && !reducedMotion() ? AFTER_INTRO_MS : AFTER_LOAD_MS);
    return () => window.clearTimeout(t);
    // только при первом показе страницы
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return open ? <GuideTour route={route} /> : null;
}

function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return vp;
}

function GuideTour({ route }: { route: Route }) {
  const [index, setIndex] = useState(0);
  const step = GUIDE_STEPS[index]!;
  const first = index === 0;
  const last = index === GUIDE_STEPS.length - 1;
  const { goals, shown, found } = useSpotlight(step.targets, step.id);
  const vp = useViewport();

  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [card, setCard] = useState({ w: 380, h: 240 });
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const measure = () => setCard({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const next = () => (last ? closeGuide('done') : setIndex((i) => i + 1));
  const back = () => setIndex((i) => Math.max(0, i - 1));
  const skip = () => closeGuide('skipped');

  // Шагу с картой нужен план аббатства — путеводитель сам ведёт читателя за ворота.
  useEffect(() => {
    if (step.needsMap && (route.path[0] !== 'map' || route.params.get('view') === 'library')) navigate('map');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  // Фокус — на заголовок шага: экранный диктор читает его, клавиатура остаётся внутри карточки.
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, [index]);

  // Фокус возвращается туда, где был до путеводителя.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    return () => before?.focus?.({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.querySelector('.dialog-backdrop')) return; // поверх открыто подтверждение режима — клавиши его
      if (e.key === 'Escape') skip();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const trapTab = (e: ReactKeyboardEvent) => {
    if (e.key !== 'Tab' || !cardRef.current) return;
    const items = [...cardRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href]')];
    if (!items.length) return;
    const firstItem = items[0]!;
    const lastItem = items[items.length - 1]!;
    if (e.shiftKey && (document.activeElement === firstItem || document.activeElement === titleRef.current)) {
      e.preventDefault();
      lastItem.focus();
    } else if (!e.shiftKey && document.activeElement === lastItem) {
      e.preventDefault();
      firstItem.focus();
    }
  };

  const target = found ? goals[0] : undefined;
  const place = placeCard(target, card, vp);
  const lit = shown.filter((r) => r.w > 2 && r.h > 2);

  return (
    <div className={`guide guide-step-${step.id}${target ? ' has-target' : ''}`}>
      <svg className="guide-veil" width={vp.w} height={vp.h} aria-hidden="true">
        <defs>
          <mask id="guide-mask">
            <rect width={vp.w} height={vp.h} fill="white" />
            {lit.map((r, i) => (
              <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={4} fill="black" />
            ))}
          </mask>
          <radialGradient id="guide-candle">
            <stop offset="0%" stopColor="var(--guide-candle)" />
            <stop offset="100%" stopColor="var(--guide-candle)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect className="guide-dim" width={vp.w} height={vp.h} mask="url(#guide-mask)" />
        {!target && <ellipse className="guide-glow" cx={vp.w / 2} cy={vp.h / 2} rx={vp.w * 0.45} ry={vp.h * 0.42} />}
        {place.thread && (
          <g key={`thread-${index}`} className="guide-thread">
            <path d={threadPath(place.thread)} pathLength={1} />
            <circle cx={place.thread.to[0]} cy={place.thread.to[1]} r={3} />
          </g>
        )}
      </svg>

      {lit.map((r, i) => (
        <button
          key={i}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="guide-ring"
          style={{ transform: `translate(${r.x}px, ${r.y}px)`, width: r.w, height: r.h }}
          onClick={last ? undefined : next}
        />
      ))}

      <div
        ref={cardRef}
        className={`guide-card sheet side-${place.side}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        aria-describedby="guide-text"
        style={{ transform: `translate(${Math.round(place.x)}px, ${Math.round(place.y)}px)` }}
        onKeyDown={trapTab}
      >
        <div key={step.id} className="guide-body">
          {first && <RoseMark className="guide-rose" />}
          <div className="guide-head">
            <p className="rubric" lang="la">
              {step.rubric}
            </p>
            <ol className="guide-progress" aria-label={`Шаг ${index + 1} из ${GUIDE_STEPS.length}`}>
              {GUIDE_STEPS.map((s, i) => (
                <li key={s.id} className={i === index ? 'is-current' : i < index ? 'is-past' : ''} aria-hidden="true">
                  {NUMERALS[i]}
                </li>
              ))}
            </ol>
          </div>
          <h2 id="guide-title" ref={titleRef} tabIndex={-1}>
            {step.title}
          </h2>
          <p id="guide-text" className="guide-text">
            {step.text}
          </p>
          {step.picker && (
            <>
              <SpoilerPicker compact />
              <p className="guide-note">Путеводитель всегда можно открыть снова — знак компаса в шапке.</p>
            </>
          )}
        </div>
        <div className="guide-foot">
          <div className="guide-actions">
            {!last && (
              <button type="button" className="link-btn guide-skip" onClick={skip}>
                Пропустить
              </button>
            )}
            {!first && (
              <button type="button" className="btn btn-small" onClick={back}>
                <ArrowLeft size={14} aria-hidden="true" /> Назад
              </button>
            )}
            <button type="button" className="btn btn-small btn-accent" onClick={next}>
              {first ? 'Войти' : last ? 'Начать расследование' : 'Далее'}
              {!last && <ArrowRight size={14} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
