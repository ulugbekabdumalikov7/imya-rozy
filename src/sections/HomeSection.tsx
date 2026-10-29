import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { eventsSorted, hourLabels } from '../data';
import type { CanonicalHour } from '../data/types';
import { href, navigate } from '../lib/router';
import { DURATION, reducedMotion, seenBefore } from '../lib/motion';
import { eventTitle } from '../lib/visible';
import { useSpoiler } from '../state/spoiler';
import { SpoilerPicker } from '../components/SpoilerControl';

const HOURS: CanonicalHour[] = ['matins', 'lauds', 'prime', 'terce', 'sext', 'nones', 'vespers', 'compline'];
const LATIN_HOURS: Record<string, string> = { matins: 'Matutinum', lauds: 'Laudes', prime: 'Prima', terce: 'Tertia', sext: 'Sexta', nones: 'Nona', vespers: 'Vesperae', compline: 'Completorium' };

const SECTIONS = [
  { to: 'map', latin: 'Locus', title: 'Карта аббатства', text: 'План аббатства и план библиотеки, места смертей и маршруты героев.' },
  { to: 'heroes', latin: 'Personae', title: 'Герои', text: 'Досье монахов, гостей и судей.' },
  { to: 'relations', latin: 'Fata', title: 'Судьбы и связи', text: 'Отношения по дням и сравнение двух судеб.' },
  { to: 'timeline', latin: 'Tempus', title: 'Ход расследования', text: 'Семь дней по часам службы.' },
  { to: 'clues', latin: 'Indicia', title: 'Улики и версии', text: 'Что подтверждает догадку, а что её опровергает.' },
  { to: 'history', latin: 'Historia', title: 'Исторический контекст', text: 'Папа, император, бедность, инквизиция, Аристотель.' },
];

/** Линии архитектурной схемы для вступления (условный силуэт аббатства на горе). */
const ARCH: { d: string; faint?: boolean }[] = [
  { d: 'M0 470 C 180 430, 330 455, 500 440 S 820 420, 1000 455', faint: true },
  { d: 'M0 505 C 220 480, 420 500, 600 488 S 880 470, 1000 500', faint: true },
  { d: 'M228 372 L 312 300 L 690 282 L 842 330 L 872 420 L 300 438 Z' },
  // Эдифиций: восьмиугольник с башнями
  { d: 'M270 250 L 330 214 L 390 250 L 390 330 L 330 366 L 270 330 Z' },
  { d: 'M262 236 l 16 -10 l 16 10 l 0 18 l -16 10 l -16 -10 Z' },
  { d: 'M366 236 l 16 -10 l 16 10 l 0 18 l -16 10 l -16 -10 Z' },
  { d: 'M330 214 L 330 168 M 314 182 L 330 168 L 346 182' },
  // Церковь с колокольней
  { d: 'M470 312 L 470 262 L 560 262 L 560 312 M 470 262 L 515 228 L 560 262' },
  { d: 'M600 312 L 600 214 L 628 190 L 656 214 L 656 312' },
  { d: 'M628 190 L 628 160' },
  // клуатр и постройки
  { d: 'M480 330 L 600 330 L 600 400 L 480 400 Z M 500 350 L 580 350 L 580 382 L 500 382 Z' },
  { d: 'M690 330 L 770 330 L 770 392 L 690 392 Z' },
  { d: 'M410 360 L 460 360 L 460 410 L 410 410 Z' },
  { d: 'M790 350 L 836 350 L 836 410 L 790 410 Z' },
];
const ROUTE = 'M846 372 C 780 360, 720 350, 640 330 S 520 300, 470 290 S 400 280, 360 300';

export function HomeSection() {
  const { spoiler, visible } = useSpoiler();
  const visibleEvents = eventsSorted.filter((e) => visible(e));
  // первый визит — полное вступление; каждый следующий — короткое: линии аббатства прорисовываются заново, текст уже на месте
  const [mode] = useState<'playing' | 'return' | 'rest'>(() => (reducedMotion() ? 'rest' : seenBefore('intro') ? 'return' : 'playing'));
  const [phase, setPhase] = useState<'playing' | 'return' | 'rest' | 'entering'>(mode);

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'return') return;
    const t = window.setTimeout(() => setPhase('rest'), phase === 'playing' ? 4400 : 2600);
    return () => window.clearTimeout(t);
  }, [phase]);

  // Потёки привязаны к штрихам буквы в шрифте заголовка: без него они легли бы мимо, поэтому ждём загрузки.
  const [stems, setStems] = useState<Stems | null>(null);
  useEffect(() => {
    let alive = true;
    try {
      document.fonts?.load('500 1em "Cormorant Garamond"', 'И')
        .then((faces) => { if (alive && faces.length) setStems(measureStems() ?? DEFAULT_STEMS); })
        .catch(() => undefined);
    } catch { /* API шрифтов недоступен — обходимся без потёков */ }
    return () => { alive = false; };
  }, []);

  const enter = (e: React.MouseEvent) => {
    e.preventDefault();
    if (reducedMotion()) return navigate('map');
    setPhase('entering');
    window.setTimeout(() => navigate('map'), DURATION.slow - 60);
  };

  return (
    <div className="home">
      <section className={`intro is-${phase}`} aria-labelledby="intro-title">
        <svg className="intro-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g transform="translate(0 120)">
            {ARCH.map((a, i) => (
              <path key={i} d={a.d} pathLength={1} className={`intro-arch${a.faint ? ' faint' : ''}`} style={{ ['--d' as string]: i }} />
            ))}
            <path d={ROUTE} pathLength={1} className="intro-route" />
            <circle cx="846" cy="372" r="4" className="intro-dot" />
          </g>
        </svg>
        <div className="intro-text">
          <p className="intro-it" lang="it">IL NOME DELLA ROSA</p>
          <h1 id="intro-title" className="intro-ru" aria-label="Имя розы"><span aria-hidden="true"><span className="cap">И{stems && <BloodDrip mode={mode === 'playing' ? 'intro' : 'return'} stems={stems} />}</span>мя розы</span></h1>
          <p className="intro-sub">Атлас тайн аббатства</p>
          <p className="intro-lede">
            Северная Италия, конец ноября 1327 года. В богатом бенедиктинском аббатстве накануне погиб молодой монах. У францисканца Вильгельма Баскервильского и его ученика Адсона — семь дней и библиотека, куда нельзя входить.
          </p>
          <div className="intro-cta">
            <a className="btn btn-accent btn-large" href={href('map')} onClick={enter}>Войти в аббатство <ArrowRight size={18} aria-hidden="true" /></a>
            <a className="btn btn-large" href={href('heroes/william')}>Начать с Вильгельма</a>
          </div>
        </div>
        {phase === 'playing' && <button type="button" className="intro-skip" onClick={() => setPhase('rest')}>Пропустить вступление</button>}
      </section>

      <div className="home-body">
        <section className="home-mode" aria-labelledby="mode-h">
          <div>
            <h2 id="mode-h">Сколько вы уже прочитали?</h2>
            <p>«Имя розы» — детектив. Выберите режим, и атлас покажет ровно столько, сколько вы знаете. Карта, связи и улики подстроятся под него. Изменить режим можно в любой момент в шапке.</p>
          </div>
          <SpoilerPicker />
        </section>

        <div className="home-grid">
          <nav className="home-sections" aria-label="Разделы атласа">
            {SECTIONS.map((s) => (
              <a key={s.to} className="home-link" href={href(s.to)}>
                <span className="rubric" lang="la">{s.latin}</span>
                <span className="home-link-title">{s.title}</span>
                <span className="home-link-text">{s.text}</span>
              </a>
            ))}
          </nav>

          <figure className="horarium" aria-labelledby="horarium-cap">
            <figcaption id="horarium-cap">
              <span className="rubric" lang="la">Horarium</span> Семь дней по часам службы. Отмечено то, что известно {spoiler.mode === 'safe' ? 'без спойлеров' : spoiler.mode === 'progress' ? `к концу ${['', 'первого', 'второго', 'третьего', 'четвёртого', 'пятого', 'шестого', 'седьмого'][spoiler.day]} дня` : 'во всём расследовании'}; бордовым — смерти.
            </figcaption>
            <div className="horarium-scroll">
              <table className="horarium-grid">
                <thead>
                  <tr><th scope="col"><span className="sr-only">Час</span></th>{[1, 2, 3, 4, 5, 6, 7].map((d) => <th key={d} scope="col">{['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'][d - 1]}</th>)}</tr>
                </thead>
                <tbody>
                  {HOURS.map((h) => (
                    <tr key={h}>
                      <th scope="row" title={hourLabels[h]} lang="la">{LATIN_HOURS[h]}</th>
                      {[1, 2, 3, 4, 5, 6, 7].map((d) => {
                        const evs = visibleEvents.filter((e) => e.day === d && e.hour === h);
                        const death = evs.some((e) => e.kinds.includes('death'));
                        return (
                          <td key={d}>
                            {evs.length > 0 ? (
                              <a href={href('timeline', { event: evs[0]!.id })} className={`hcell${death ? ' is-death' : ''}`} title={evs.map((e) => eventTitle(e, spoiler)).join('; ')}>
                                <span className="sr-only">{`День ${d}, ${hourLabels[h]}: ${evs.map((e) => eventTitle(e, spoiler)).join('; ')}`}</span>
                              </a>
                            ) : <span className="hcell is-empty" aria-hidden="true" />}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small horarium-note">Ночные эпизоды и события без указанного часа — в хронологии.</p>
          </figure>
        </div>
      </div>
    </div>
  );
}

/**
 * Кровь на букве «И»: два тонких потёка из нижних концов штрихов и редкая капля.
 * Координаты — в сотых долях em (viewBox 70 × 160 при ширине 0.7em), поэтому потёки
 * остаются на штрихах при любом размере заголовка. Положение штрихов измерено по шрифту
 * Cormorant Garamond 500: левый — 0.159em, правый — 0.605em, низ буквы — 0.94em от верха строки.
 */
/** Кровь на «И»: `intro` — медленно, после вступления (первый визит); `return` — сразу, при каждом возвращении на главную. */
/** Середины двух вертикальных штрихов «И» в сотых долях кегля (= единицы viewBox потёков) от начала буквы. */
interface Stems { a: number; b: number }
/** Где потёки нарисованы в самом SVG. */
const DEFAULT_STEMS: Stems = { a: 15.9, b: 60.5 };

/**
 * Меряет штрихи «И» в том шрифте, которым набран заголовок: рисует букву на холсте и ищет
 * тёмные полосы на середине высоты — левый штрих, диагональ, правый штрих.
 * Так потёки ложатся ровно под штрихи на любом экране, а не по замеру с одного устройства.
 */
function measureStems(): Stems | null {
  try {
    const S = 200;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.font = `500 ${S}px "Cormorant Garamond"`;
    ctx.fillText('И', 0, S * 0.85);
    const y = Math.round(S * 0.85 - S * 0.32); // середина высоты прописной: диагональ ещё не касается штрихов
    const row = ctx.getImageData(0, y, S, 1).data;
    const runs: [number, number][] = [];
    let start = -1;
    for (let x = 0; x <= S; x++) {
      const ink = x < S && row[x * 4 + 3]! > 128;
      if (ink && start < 0) start = x;
      if (!ink && start >= 0) { runs.push([start, x - 1]); start = -1; }
    }
    if (runs.length < 2) return null;
    const mid = ([l, r]: [number, number]) => ((l + r + 1) / 2 / S) * 100;
    // Левый штрих снизу срезан наискось и сходится в острие у левого края — потёк должен сходить с острия,
    // а не с середины штриха, иначе он висит сбоку. Ищем самую нижнюю точку штриха и середину чернил у неё.
    const [l, r] = runs[0]!;
    const img = ctx.getImageData(0, 0, S, S).data;
    const inkAt = (x: number, yy: number) => img[(yy * S + x) * 4 + 3]! > 128;
    let bottom = y;
    for (let yy = y; yy < S; yy++) {
      let any = false;
      for (let x = Math.max(0, l - 2); x <= Math.min(S - 1, r + 2); x++) if (inkAt(x, yy)) { any = true; break; }
      if (!any) break;
      bottom = yy;
    }
    let sum = 0, n = 0;
    for (let yy = bottom - 3; yy <= bottom; yy++) {
      for (let x = Math.max(0, l - 2); x <= Math.min(S - 1, r + 2); x++) if (inkAt(x, yy)) { sum += x + 0.5; n++; }
    }
    const tip = n ? (sum / n / S) * 100 : mid(runs[0]!);
    // потёк — середина между острием и осью штриха: и сходит с острия, и не выглядит скошенным
    const stems = { a: (tip + mid(runs[0]!)) / 2, b: mid(runs[runs.length - 1]!) };
    // защита от странного шрифта: штрихи должны быть примерно там, где их ждёт рисунок
    return Math.abs(stems.a - DEFAULT_STEMS.a) < 8 && Math.abs(stems.b - DEFAULT_STEMS.b) < 8 ? stems : null;
  } catch {
    return null;
  }
}

function BloodDrip({ mode, stems }: { mode: 'intro' | 'return'; stems: Stems }) {
  const da = stems.a - DEFAULT_STEMS.a;
  const db = stems.b - DEFAULT_STEMS.b;
  return (
    <svg className={`drip drip-${mode}`} viewBox="0 0 70 160" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="blood-run" x1="0" y1="0" x2="0" y2="1">
          {/* верх потёка — того же цвета, что и буква, иначе на светлой теме он выглядит отдельным куском */}
          <stop offset="0" style={{ stopColor: 'var(--blood-lit)' }} />
          <stop offset="0.12" style={{ stopColor: 'var(--blood-lit)' }} />
          <stop offset="0.55" stopColor="#8b1c23" />
          <stop offset="1" stopColor="#5a1116" />
        </linearGradient>
        <radialGradient id="blood-bead" cx="0.38" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#c9545a" />
          <stop offset="0.45" stopColor="#8b1c23" />
          <stop offset="1" stopColor="#4a0d12" />
        </radialGradient>
        <mask id="drip-reveal-a" maskUnits="userSpaceOnUse" x="0" y="-2" width="70" height="80">
          <rect className="drip-reveal drip-reveal-a" x="0" y="-2" width="70" height="54" fill="#fff" />
        </mask>
        <mask id="drip-reveal-b" maskUnits="userSpaceOnUse" x="0" y="-2" width="70" height="80">
          <rect className="drip-reveal drip-reveal-b" x="0" y="-2" width="70" height="40" fill="#fff" />
        </mask>
      </defs>

      {/* левый штрих: длинный потёк */}
      <g className="drip-run drip-run-a" transform={`translate(${da} -2)`}>
        <path mask="url(#drip-reveal-a)" fill="url(#blood-run)"
          d="M12.2 -1.2 C12.2 5, 13.9 8.5, 14.3 15 L14.7 37 C14.8 41.5, 13.1 43.6, 13.1 47.2 A2.85 2.85 0 1 0 18.7 47.2 C18.7 43.6, 17 41.5, 17.1 37 L17.5 15 C17.9 8.5, 19.6 5, 19.6 -1.2 Z" />
        <path mask="url(#drip-reveal-a)" className="drip-gloss" d="M15.2 6 L15.3 35" />
        <circle className="drip-head drip-head-a" cx="15.9" cy="0" r="2.6" fill="url(#blood-bead)" />
      </g>

      {/* правый штрих: короткий потёк */}
      <g className="drip-run drip-run-b" transform={`translate(${db} -2)`}>
        <path mask="url(#drip-reveal-b)" fill="url(#blood-run)"
          d="M57.3 -1.2 C57.3 4, 58.9 6.5, 59.1 11 L59.4 26 C59.5 29.5, 58.2 31, 58.2 33.6 A2.3 2.3 0 1 0 62.8 33.6 C62.8 31, 61.5 29.5, 61.6 26 L61.9 11 C62.1 6.5, 63.7 4, 63.7 -1.2 Z" />
        <circle className="drip-head drip-head-b" cx="60.5" cy="0" r="2.1" fill="url(#blood-bead)" />
      </g>

      {/* капля, которая изредка набухает и срывается с левого потёка */}
      <ellipse className="drip-drop" cx={15.9 + da} cy="46.6" rx="2.1" ry="2.5" fill="url(#blood-bead)" />
    </svg>
  );
}
