import { anchorIn } from '../../data';

/**
 * Встреча Адсона и девушки (третья ночь, кухня Эдифиция) — главный знак карты.
 * Кухни нет на эталонных планах отдельно (общий план рисует Эдифиций одним зданием, план библиотеки —
 * только верхний этаж), поэтому роза стоит у Эдифиция с подписью «Кухня · нижний этаж», а не на выдуманном месте.
 */
export const MEETING_EVENT_ID = 'e-adso-girl';
const MEETING_LOCATION = 'kitchen';
/** Сцена ждёт, пока камера подлетит к Эдифицию (подлёт к событию — 950 мс), затем длится MEETING_SCENE_MS (как анимации .scene-* в styles.css). */
export const MEETING_SCENE_DELAY_MS = 900;
export const MEETING_SCENE_MS = 3600;

/** Роза линией, как пером: бутон-спираль, чашечка, стебель и два листа. Координаты — в единицах «1 = 1px», центр бутона в нуле. */
const ROSE_PATHS = [
  'M0.4,-4.6 C-1.9,-4.6 -3.3,-3 -3.3,-1.2 C-3.3,0.9 -1.6,2.3 0.4,2.3 C2.4,2.3 3.9,0.9 3.9,-1 C3.9,-2.6 2.7,-3.8 1.2,-3.8 C-0.1,-3.8 -1,-2.9 -1,-1.8 C-1,-0.8 -0.2,-0.1 0.7,-0.1 C1.4,-0.1 1.9,-0.6 1.9,-1.2',
  'M-3.4,-2.2 C-5.2,-1.8 -6,-0.3 -5.6,1.3 C-5,3.6 -2.6,4.9 0.3,4.9 C3.2,4.9 5.5,3.6 6.1,1.3 C6.5,-0.3 5.7,-1.8 3.9,-2.2',
  'M0.3,4.9 L0.3,10.4',
  'M0.3,7.6 C1.7,6 3.6,5.7 4.8,6.3 C4.2,7.8 2.3,8.5 0.3,7.6 Z',
  'M0.3,9 C-1,7.8 -2.6,7.7 -3.6,8.2 C-3,9.4 -1.4,9.8 0.3,9 Z',
];

export function RoseLines({ className, draw = false }: { className?: string; draw?: boolean }) {
  return (
    <g className={className}>
      {ROSE_PATHS.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={draw ? 1 : undefined}
          style={draw ? { ['--rd' as string]: `${i * 0.18}s` } : undefined}
        />
      ))}
    </g>
  );
}

/** Где стоит роза: у Эдифиция, смещённо, чтобы не закрывать метки смертей и маршрутов в его центре. */
export function meetingPoint(unit: number): [number, number] | null {
  const a = anchorIn('abbey', MEETING_LOCATION);
  return a ? [a[0] - 34 * unit, a[1] + 30 * unit] : null;
}

interface MarkerProps {
  unit: number;
  selected: boolean;
  onPick: () => void;
  onActivate: () => void;
}

/** Знак на плане: тёмный диск с бордовой розой, едва «дышит», как свеча; подпись — при наведении и выборе. */
export function MeetingMarker({ unit, selected, onPick, onActivate }: MarkerProps) {
  const pt = meetingPoint(unit);
  if (!pt) return null;
  const r = 12 * unit;
  return (
    <g
      transform={`translate(${pt[0]} ${pt[1]})`}
      className={`marker marker-meeting${selected ? ' is-selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Адсон и девушка: встреча на кухне Эдифиция, третья ночь"
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}
    >
      <circle r={r * 1.6} className="hit" />
      <circle r={r * 1.35} className="meeting-glow" style={{ strokeWidth: unit }} />
      <circle r={r} className="meeting-disc" style={{ strokeWidth: 1.2 * unit }} />
      <g transform={`scale(${unit * 0.95}) translate(0 -2.6)`}>
        <RoseLines className="meeting-rose" />
      </g>
      <g className="meeting-label" transform={`translate(${r + 7 * unit} 0)`}>
        <text style={{ fontSize: 12.5 * unit }} dominantBaseline="middle" y={-6 * unit} className="meeting-label-title">
          Адсон и девушка
        </text>
        <text style={{ fontSize: 10.5 * unit }} dominantBaseline="middle" y={8 * unit} className="meeting-label-sub">
          Кухня · нижний этаж · третья ночь
        </text>
      </g>
    </g>
  );
}

/**
 * Сцена при открытии встречи: план гаснет, как при свече, вокруг остаётся пятно света,
 * роза прорисовывается линией, появляется подпись. Около трёх с половиной секунд после подлёта камеры; при уменьшении движения — без затемнения и прорисовки.
 */
export function MeetingScene({
  unit,
  width,
  height,
  uid,
}: {
  unit: number;
  width: number;
  height: number;
  uid: string;
}) {
  const pt = meetingPoint(unit);
  if (!pt) return null;
  const R = 150 * unit;
  const maskId = `meeting-light-${uid}`;
  const gradId = `meeting-fall-${uid}`;
  return (
    <g className="meeting-scene" aria-hidden="true">
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0" stopColor="#000" />
          <stop offset="0.45" stopColor="#000" />
          <stop offset="1" stopColor="#fff" />
        </radialGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={-width} y={-height} width={width * 3} height={height * 3}>
          <rect x={-width} y={-height} width={width * 3} height={height * 3} fill="#fff" />
          <circle cx={pt[0]} cy={pt[1]} r={R} fill={`url(#${gradId})`} />
        </mask>
      </defs>
      <rect
        className="scene-veil"
        x={-width}
        y={-height}
        width={width * 3}
        height={height * 3}
        mask={`url(#${maskId})`}
      />
      <g transform={`translate(${pt[0]} ${pt[1]})`}>
        <g transform={`scale(${unit * 4.2}) translate(0 -2.6)`}>
          <RoseLines className="scene-rose" draw />
        </g>
        {/* положение — атрибутом внешней группы, анимация — у внутренней: CSS-transform анимации иначе заменил бы атрибут */}
        <g transform={`translate(0 ${66 * unit})`}>
          <g className="scene-caption">
            <text textAnchor="middle" style={{ fontSize: 17 * unit }} className="scene-caption-title">
              Третья ночь. Кухня Эдифиция.
            </text>
            <text textAnchor="middle" y={19 * unit} style={{ fontSize: 11.5 * unit }} className="scene-caption-sub">
              Адсон встречает девушку из деревни
            </text>
          </g>
        </g>
      </g>
    </g>
  );
}
