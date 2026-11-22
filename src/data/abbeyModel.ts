import { circle, type PartSpec, type V2 } from '../lib/model3d';
import { ABBEY_POLYS } from './planGeometry';

/**
 * Объёмный макет аббатства, построенный на контурах того же плана (planGeometry.ts).
 * Здесь только то, чего на плоском плане нет: высоты, крыши, деление сложных зданий на части,
 * стена ограды, деревья. Контуры зон, их id и привязки к местам атласа не меняются.
 *
 * Высоты — в пикселях плана (сторона корпуса Эдифиция ≈ 200). Пропорции подобраны как у
 * музейного макета: одноэтажные службы ≈ 22, двухэтажные корпуса ≈ 32, церковь ≈ 54, Эдифиций ≈ 84.
 */

const P = ABBEY_POLYS as Record<string, V2[]>;
const idx = (id: string, from: number, to: number): V2[] => P[id]!.slice(from, to + 1);
const box = (x0: number, y0: number, x1: number, y1: number): V2[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

export interface BuildingModel {
  parts: PartSpec[];
  /** Внутренний двор (колодец Эдифиция, двор клуатра): рисуется до стен. */
  court?: { pts: V2[]; h: number; kind: 'well' | 'lawn' };
  /** Высота, над которой стоят знаки слоёв (люди, улики, смерти). */
  pin: number;
}

/** Здания по id зоны плана (без префикса ab-). */
export const BUILDINGS: Record<string, BuildingModel> = {
  // Храмина-Эдифиций: квадратный корпус и четыре семигранные башни; посередине — восьмигранный колодец-двор.
  aedificium: {
    parts: [
      {
        pts: [
          [842, 186],
          [901, 185],
          [993, 267],
          [993, 310],
          [910, 397],
          [863, 398],
          [776, 318],
          [778, 274],
        ],
        h: 84,
        roof: { type: 'flat' },
        roofMat: 'lead',
        windows: { kind: 'slit', every: 15, rows: 3, sill: 0.2 },
        doors: [4],
      },
      {
        pts: idx('aedificium', 0, 7),
        h: 98,
        roof: { type: 'pyramid', rise: 34 },
        roofMat: 'slate',
        windows: { kind: 'slit', every: 14, rows: 3, sill: 0.18 },
      },
      {
        pts: idx('aedificium', 8, 16),
        h: 98,
        roof: { type: 'pyramid', rise: 34 },
        roofMat: 'slate',
        windows: { kind: 'slit', every: 14, rows: 3, sill: 0.18 },
      },
      {
        pts: idx('aedificium', 17, 25),
        h: 98,
        roof: { type: 'pyramid', rise: 34 },
        roofMat: 'slate',
        windows: { kind: 'slit', every: 14, rows: 3, sill: 0.18 },
      },
      {
        pts: idx('aedificium', 26, 34),
        h: 98,
        roof: { type: 'pyramid', rise: 34 },
        roofMat: 'slate',
        windows: { kind: 'slit', every: 14, rows: 3, sill: 0.18 },
      },
    ],
    court: { pts: circle([881, 292], 32, 8), h: 84, kind: 'well' },
    pin: 100,
  },

  // Церковь: неф, хор, северный рукав трансепта, полукруглая апсида, ризница.
  church: {
    parts: [
      {
        pts: box(604, 559, 825, 651),
        h: 54,
        roof: { type: 'gable', rise: 26, along: 0 },
        windows: { kind: 'arch', every: 22, sill: 0.42, tall: 0.36, w: 4 },
        doors: [3],
      },
      {
        pts: box(825, 563, 903, 642),
        h: 54,
        roof: { type: 'gable', rise: 26, along: 0 },
        windows: { kind: 'arch', every: 24, sill: 0.42, tall: 0.36, w: 4 },
      },
      {
        pts: box(825, 538, 870, 563),
        h: 46,
        roof: { type: 'gable', rise: 18, along: 1 },
        windows: { kind: 'arch', every: 20, sill: 0.4, tall: 0.36, w: 4 },
      },
      {
        pts: [
          [903, 565],
          ...[-67.5, -45, -22.5, 0, 22.5, 45, 67.5].map(
            (a) => [903 + 38 * Math.cos((a * Math.PI) / 180), 603 + 38 * Math.sin((a * Math.PI) / 180)] as V2,
          ),
          [903, 641],
        ],
        h: 44,
        roof: { type: 'pyramid', rise: 18, apex: [903, 603] },
        windows: { kind: 'arch', every: 20, sill: 0.4, tall: 0.38, w: 3.6 },
        hide: [8],
      },
      {
        pts: [
          [790, 642],
          [825, 642],
          [825, 659],
          [792, 660],
        ],
        h: 24,
        roof: { type: 'lean', drop: 6 },
      },
    ],
    pin: 82,
  },

  // Клуатр: четыре галереи с односкатными крышами вокруг двора; к двору — аркады.
  cloister: {
    parts: (() => {
      const O = { x0: 624, y0: 656, x1: 864, y1: 763 };
      const I = { x0: 650, y0: 672, x1: 836, y1: 747 };
      const walk = (a: V2, b: V2, c: V2, d: V2): PartSpec => ({
        pts: [a, b, c, d],
        h: 26,
        roof: { type: 'lean', drop: 7 },
        hide: [1, 3],
        arcade: [2],
      });
      return [
        walk([O.x0, O.y0], [O.x1, O.y0], [I.x1, I.y0], [I.x0, I.y0]),
        walk([O.x1, O.y0], [O.x1, O.y1], [I.x1, I.y1], [I.x1, I.y0]),
        walk([O.x1, O.y1], [O.x0, O.y1], [I.x0, I.y1], [I.x1, I.y1]),
        walk([O.x0, O.y1], [O.x0, O.y0], [I.x0, I.y0], [I.x0, I.y1]),
      ];
    })(),
    court: { pts: box(650, 672, 836, 747), h: 0, kind: 'lawn' },
    pin: 30,
  },

  dormitory: {
    parts: [
      {
        pts: box(865, 660, 937, 826),
        h: 36,
        roof: { type: 'gable', rise: 18, along: 1 },
        windows: { kind: 'slit', every: 13, rows: 2 },
      },
      {
        pts: box(763, 765, 865, 826),
        h: 30,
        roof: { type: 'gable', rise: 16, along: 0 },
        windows: { kind: 'slit', every: 13, rows: 2 },
        hide: [1],
      },
    ],
    pin: 54,
  },
  'chapter-house': {
    parts: [
      {
        pts: box(600, 765, 763, 829),
        h: 32,
        roof: { type: 'gable', rise: 17, along: 0 },
        windows: { kind: 'arch', every: 18, sill: 0.4, tall: 0.4, w: 3.6 },
        doors: [2],
      },
    ],
    pin: 50,
  },
  'small-south': { parts: [{ pts: P['small-south']!, h: 20, roof: { type: 'gable', rise: 11 } }], pin: 32 },
  pigsty: {
    parts: [{ pts: P.pigsty!, h: 15, roof: { type: 'gable', rise: 9 }, wall: 'wood', roofMat: 'tile' }],
    pin: 25,
  },
  stables: {
    parts: [
      {
        pts: [
          [1159, 395],
          [1194, 397],
          [1198, 511],
          [1158, 511],
        ],
        h: 22,
        roof: { type: 'gable', rise: 12, along: 1 },
        windows: { kind: 'slit', every: 16 },
      },
      {
        pts: [
          [1101, 511],
          [1199, 511],
          [1202, 606],
          [1101, 604],
        ],
        h: 26,
        roof: { type: 'hip', rise: 16 },
        windows: { kind: 'slit', every: 16 },
        doors: [3],
      },
    ],
    pin: 42,
  },
  'east-2': {
    parts: [{ pts: P['east-2']!, h: 22, roof: { type: 'hip', rise: 13 }, windows: { kind: 'slit', every: 18 } }],
    pin: 36,
  },
  'east-3': {
    parts: [{ pts: P['east-3']!, h: 24, roof: { type: 'hip', rise: 14 }, windows: { kind: 'slit', every: 18 } }],
    pin: 38,
  },
  'east-4': {
    parts: [{ pts: P['east-4']!, h: 22, roof: { type: 'hip', rise: 14 }, windows: { kind: 'slit', every: 18 } }],
    pin: 36,
  },
  baths: {
    parts: [
      { pts: P.baths!, h: 20, roof: { type: 'gable', rise: 11 }, windows: { kind: 'slit', every: 16 }, doors: [2] },
    ],
    pin: 32,
  },
  hospital: {
    parts: [
      {
        pts: [
          [184, 438],
          [322, 343],
          [350, 368],
          [211, 472],
        ],
        h: 30,
        roof: { type: 'gable', rise: 16, along: 0 },
        windows: { kind: 'slit', every: 14, rows: 2 },
      },
      {
        pts: [
          [172, 466],
          [211, 472],
          [197, 500],
          [162, 499],
        ],
        h: 24,
        roof: { type: 'hip', rise: 12 },
        windows: { kind: 'slit', every: 14 },
      },
    ],
    pin: 48,
  },
  'gate-house': {
    parts: [{ pts: P['gate-house']!, h: 22, roof: { type: 'hip', rise: 12 }, windows: { kind: 'slit', every: 16 } }],
    pin: 34,
  },
  'south-1': {
    parts: [
      {
        pts: [
          [252, 859],
          [294, 874],
          [286, 912],
          [224, 924],
        ],
        h: 22,
        roof: { type: 'gable', rise: 12 },
        windows: { kind: 'slit', every: 16 },
      },
      {
        pts: [
          [224, 924],
          [347, 932],
          [348, 966],
          [222, 958],
        ],
        h: 22,
        roof: { type: 'gable', rise: 12, along: 0 },
        windows: { kind: 'slit', every: 16 },
      },
    ],
    pin: 36,
  },
  'south-2': {
    parts: [{ pts: P['south-2']!, h: 26, roof: { type: 'gable', rise: 14 }, windows: { kind: 'slit', every: 16 } }],
    pin: 40,
  },
  'south-3': {
    parts: [{ pts: P['south-3']!, h: 22, roof: { type: 'gable', rise: 12 }, windows: { kind: 'slit', every: 16 } }],
    pin: 36,
  },
  'south-4': {
    parts: [
      {
        pts: [
          [563, 890],
          [678, 892],
          [674, 975],
          [563, 974],
        ],
        h: 24,
        roof: { type: 'hip', rise: 14 },
        windows: { kind: 'slit', every: 16 },
      },
    ],
    pin: 38,
  },
  'south-5': {
    parts: [{ pts: P['south-5']!, h: 26, roof: { type: 'hip', rise: 15 }, windows: { kind: 'slit', every: 16 } }],
    pin: 40,
  },
  'south-6': {
    parts: [{ pts: P['south-6']!, h: 22, roof: { type: 'gable', rise: 12 }, windows: { kind: 'slit', every: 16 } }],
    pin: 36,
  },
  // Кузни: мастерская и круглая печь с конической крышей (на плане — круг у буквы R).
  forges: {
    parts: [
      {
        pts: box(1042, 893, 1168, 934),
        h: 24,
        roof: { type: 'gable', rise: 12, along: 0 },
        windows: { kind: 'slit', every: 16 },
      },
      {
        pts: [
          [1042, 934],
          [1108, 934],
          [1108, 972],
          [1042, 972],
        ],
        h: 20,
        roof: { type: 'lean', drop: 6 },
      },
      {
        pts: circle([1130, 950], 19, 14),
        h: 34,
        roof: { type: 'pyramid', rise: 12 },
        wall: 'stoneDark',
        roofMat: 'slate',
      },
    ],
    pin: 46,
  },
  // Ворота: невысокая надвратная башня с проездом.
  gate: { parts: [{ pts: P.gate!, h: 30, roof: { type: 'hip', rise: 12 }, doors: [1, 3] }], pin: 44 },
};

/** Стена ограды — две линии: от ворот на юг и восток до Эдифиция и от Эдифиция на запад к воротам. */
export const ENCLOSURE: V2[][] = [
  [
    [118, 616],
    [213, 938],
    [660, 992],
    [1150, 996],
    [1272, 828],
    [1197, 336],
    [1070, 306],
  ],
  [
    [700, 296],
    [318, 322],
    [156, 446],
    [108, 580],
  ],
];
export const WALL = { h: 20, thick: 7 };

/** Земля внутри ограды (утоптанная), снаружи — склон и луг. */
export const INTERIOR: V2[] = [
  ...ENCLOSURE[0]!,
  [1053, 328],
  [993, 310],
  [910, 397],
  [863, 398],
  [776, 318],
  [736, 340],
  ...ENCLOSURE[1]!,
];

/** Основание макета — весь лист плана, с толщиной, как у музейной подставки. */
export const BOARD = { x0: 0, y0: 36, x1: 1300, y1: 1018, depth: 16 };
/** Вершины башен Эдифиция — самые высокие точки макета (по ним камера вписывает его в кадр). */
export const PEAKS: [number, number, number][] = [
  [880, 150, 132],
  [1028, 290, 132],
  [884, 440, 132],
  [738, 298, 132],
];

/** Деревья: сады и аллея от ворот к церкви (на плане — кроны). */
export const TREE_AREAS = ['orchard', 'tree-garden'] as const;
export const AVENUE: V2[] = Array.from({ length: 14 }, (_, i) => [168 + i * 30, i % 2 ? 578 : 622] as V2).filter(
  ([x]) => x < 460,
);
