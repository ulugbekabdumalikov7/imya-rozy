import { ABBEY_POLYS, LIBRARY_ROOMS } from './planGeometry';
import type { Certainty } from './types';

/**
 * Два эталонных плана, каждый со своей системой координат (пиксели исходного изображения):
 *  — 'abbey'   — общий план аббатства «Аббатство» из русского издания романа (1336 × 1024);
 *  — 'library' — план библиотеки на верхнем этаже Эдифиция (1280 × 1289).
 * Связь между планами задаётся явно: зона Эдифиция на общем плане открывает план библиотеки,
 * а места атласа (Location) ссылаются на конкретную зону через Location.plan.
 */
export type PlanId = 'abbey' | 'library';

export interface PlanHotspot {
  id: string;
  plan: PlanId;
  kind: 'building' | 'open' | 'terrain' | 'opening' | 'room';
  poly: [number, number][];
  /** Буква так, как она напечатана на плане. */
  printed?: string;
  /** Буква на плане библиотеки нарисована красным. */
  red?: boolean;
  /** Строка легенды для этой буквы — дословно, как напечатана на плане. */
  legend?: string;
  /** Название и описание по-русски — основной текст интерфейса. */
  name: string;
  description: string;
  /** Насколько надёжно опознание этой зоны. */
  certainty: Certainty;
  /** Оговорка: как место называется в романе, чем опознание обосновано. */
  note?: string;
  /** Английский вариант описания (вторичный слой, показывается свёрнутым). */
  en?: { name: string; description: string; note?: string };
  /** Связанное место атласа. */
  locationId?: string;
  /** Переход к другому плану. */
  opensPlan?: PlanId;
  /** Расположение (для комнат библиотеки). */
  zone?: string;
  /** День, с которого опознание раскрыто; до этого показываются safe-поля. */
  revealDay?: number;
  safeName?: string;
  safeDescription?: string;
}

export interface PlanDef {
  id: PlanId;
  /** Заголовок, напечатанный на самом плане, и его язык. */
  titleOrig: string;
  titleLang: 'ru' | 'it';
  titleRu: string;
  width: number;
  height: number;
  hotspots: PlanHotspot[];
}

const P = ABBEY_POLYS as Record<string, [number, number][]>;
const ab = (id: string, rest: Omit<PlanHotspot, 'id' | 'plan' | 'poly'>): PlanHotspot => ({
  id: `ab-${id}`,
  plan: 'abbey',
  poly: P[id]!,
  ...rest,
});
const NOT_IN_LEGEND = 'В легенде плана не названо.';
const NOT_IN_LEGEND_EN = 'Not named in the plan legend.';

/**
 * Легенда плана аббатства — как напечатана на плане русского издания; рядом подпись итальянского оригинала.
 * Буквы стоят на тех постройках, что названы в легенде. Остальные мелкие буквы рисунка (C, E, G, L, O–V)
 * в легенде не названы — атлас их не подписывает.
 */
export const ABBEY_LEGEND: { letter: string; ru: string; it: string; en: string }[] = [
  { letter: 'K', ru: 'Лечебница', it: 'Ospedale', en: 'Hospital' },
  { letter: 'J', ru: 'Купальня', it: 'Balnea', en: 'Baths' },
  { letter: 'A', ru: 'Храмина', it: 'Edificio', en: 'The Aedificium' },
  { letter: 'B', ru: 'Церковь', it: 'Chiesa', en: 'Church' },
  { letter: 'D', ru: 'Церковный двор', it: 'Chiostro', en: 'Cloister' },
  { letter: 'F', ru: 'Спальный корпус', it: 'Dormitori', en: 'Dormitories' },
  { letter: 'H', ru: 'Капитулярная зала', it: 'Sala capitolare', en: 'Chapter house' },
  { letter: 'M', ru: 'Выгребная яма', it: 'Stabbi', en: 'Pens (pigsties)' },
  { letter: 'N', ru: 'Конюшня', it: 'Stalle', en: 'Stables' },
  { letter: 'R', ru: 'Кузни', it: 'Fucina', en: 'Forge' },
];

/** Зона с буквой легенды: буква, строка легенды и название на карте берутся из ABBEY_LEGEND. */
const lettered = (
  id: string,
  letter: string,
  rest: Omit<PlanHotspot, 'id' | 'plan' | 'poly' | 'printed' | 'legend' | 'name'>,
): PlanHotspot => {
  const l = ABBEY_LEGEND.find((x) => x.letter === letter)!;
  return ab(id, { printed: letter, legend: l.ru, name: l.ru, ...rest });
};

const abbeyHotspots: PlanHotspot[] = [
  lettered('aedificium', 'A', {
    kind: 'building',
    description:
      'Огромное здание с четырьмя многоугольными башнями и восьмиугольным колодцем в центре, на северном краю ограды над обрывом. По роману внизу кухня и трапезная, над ними скрипторий, наверху библиотека. Этажи на этом плане не начерчены.',
    certainty: 'confirmed',
    note: 'В романе это здание называется Эдифицием (Aedificium); в легенде русского издания — Храмина.',
    en: {
      name: 'The Aedificium',
      description:
        'Huge building with four polygonal towers and an octagonal central well, on the northern edge of the enclosure above the cliff.',
    },
    locationId: 'aedificium',
    opensPlan: 'library',
  }),
  lettered('church', 'B', {
    kind: 'building',
    description: 'Базилика с колоннадой в нефе, хором и полукруглой апсидой на востоке.',
    certainty: 'confirmed',
    en: {
      name: 'Church',
      description: 'Basilica with a colonnaded nave, a choir and a semicircular apse at the east end.',
    },
    locationId: 'church',
  }),
  lettered('cloister', 'D', {
    kind: 'open',
    description: 'Открытый двор, обрамлённый галереями с колоннами, у южной стены церкви.',
    certainty: 'confirmed',
    note: 'В романе этот двор называется клуатром.',
    en: {
      name: 'Cloister',
      description: 'Open court framed by colonnaded walks against the south wall of the church.',
    },
    locationId: 'cloister',
  }),
  lettered('dormitory', 'F', {
    kind: 'building',
    description:
      'Восточное крыло клуатра: длинный зал с двумя рядами колонн у апсиды церкви и переходы к нему с юга. Так в монастырях обычно и строили спальни — рядом с церковью, чтобы ночью идти прямо к службе.',
    certainty: 'interpretation',
    note: 'Маленькая буква F напечатана в переходе, а на самом зале — буква E, которой в легенде нет. Атлас считает спальным корпусом всё восточное крыло.',
    en: {
      name: 'Dormitory',
      description:
        'East wing of the cloister: a long hall with two rows of columns by the church apse, and the passages leading to it from the south.',
    },
    locationId: 'dormitory',
  }),
  lettered('chapter-house', 'H', {
    kind: 'building',
    description:
      'Южный корпус клуатра: галерея с крестовыми сводами и помещение с лестницей у западного конца, где стоит буква H.',
    certainty: 'confirmed',
    note: 'В романе здесь проходят диспут о бедности Христа и суд Бернарда Ги.',
    en: {
      name: 'Chapter house',
      description: 'South range of the cloister: a cross-vaulted gallery and a room with a stair at its western end.',
    },
    locationId: 'chapter-house',
  }),
  lettered('hospital', 'K', {
    kind: 'building',
    description:
      'Длинное узкое здание вдоль северо-западной стены, поставленное под углом, со скруглённым торцом и лестницей у южного конца.',
    certainty: 'confirmed',
    en: {
      name: 'Hospital',
      description:
        'Long, narrow building set at an angle along the north-western wall, with a rounded end and a stair at its southern end.',
    },
    locationId: 'hospital',
  }),
  lettered('baths', 'J', {
    kind: 'building',
    description: 'Небольшое здание из трёх помещений у северной стены, рядом с лечебницей и грядками.',
    certainty: 'confirmed',
    en: {
      name: 'Baths',
      description: 'Small three-room building against the northern wall, next to the hospital and the garden plots.',
    },
    locationId: 'balneary',
  }),
  lettered('pigsty', 'M', {
    kind: 'building',
    description: 'Небольшое здание в северном конце восточного ряда, у стены под Храминой.',
    certainty: 'interpretation',
    note: 'В итальянской легенде эта буква — «Stabbi»: загоны для скота, свинарники. Атлас помещает сюда свинарник, у которого во второй день находят тело Венанция.',
    en: {
      name: 'Pens (pigsties)',
      description: 'Small building at the northern end of the eastern row.',
      note: 'The Italian legend gives M as “Stabbi”, animal pens; the atlas places the pigsty here.',
    },
    locationId: 'pigsty',
  }),
  lettered('stables', 'N', {
    kind: 'building',
    description: 'Восточный ряд построек: зал с портиком и длинный ряд стойл вдоль стены.',
    certainty: 'confirmed',
    en: { name: 'Stables', description: 'Eastern row: a hall with a portico and a long row of stalls along the wall.' },
    locationId: 'stables',
  }),
  lettered('forges', 'R', {
    kind: 'building',
    description: 'Здание в юго-восточном углу ограды с круглым горном.',
    certainty: 'confirmed',
    note: 'В романе в кузнях работает стекольщик Николай Моримундский.',
    en: { name: 'Forge', description: 'Building in the south-eastern corner of the enclosure with a round furnace.' },
    locationId: 'workshops',
  }),
  ab('small-south', {
    kind: 'building',
    name: 'Небольшое здание',
    description: 'Небольшое здание к югу от спального корпуса.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: { name: 'Small building', description: 'Small building south of the dormitory.', note: NOT_IN_LEGEND_EN },
  }),
  ab('gate-house', {
    kind: 'building',
    name: 'Здание у ворот',
    description: 'Небольшое здание со сводчатым помещением сразу за западными воротами.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building by the gate',
      description: 'Small building with a vaulted room just inside the western gate.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('east-2', {
    kind: 'building',
    name: 'Здание у восточной стены',
    description: 'Здание из двух помещений к югу от конюшни.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building on the eastern side',
      description: 'Two-room building south of the stables.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('east-3', {
    kind: 'building',
    name: 'Здание у восточной стены',
    description: 'Здание с крестовым сводом и портиком.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building on the eastern side',
      description: 'Building with a cross-vaulted room and a portico.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('east-4', {
    kind: 'building',
    name: 'Здание у восточной стены',
    description: 'Большой зал и три маленьких помещения вдоль его северной стороны.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building on the eastern side',
      description: 'A large hall with three small rooms along its north side.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('south-1', {
    kind: 'building',
    name: 'Здание в южном ряду',
    description: 'Г-образное здание в юго-западном углу ограды.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building in the southern row',
      description: 'L-shaped building in the south-western corner of the enclosure.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('south-2', {
    kind: 'building',
    name: 'Здание в южном ряду',
    description: 'Здание с внутренним двором и сводчатой галереей.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building in the southern row',
      description: 'Building with an inner yard and a vaulted gallery.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('south-3', {
    kind: 'building',
    name: 'Здание в южном ряду',
    description: 'Прямоугольное здание; вдоль северной стены начерчены четыре круга.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building in the southern row',
      description: 'Rectangular building; four circles are drawn along its north wall.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('south-4', {
    kind: 'building',
    name: 'Здание в южном ряду',
    description: 'Здание с перегородками и рядом опор.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building in the southern row',
      description: 'Building with partitions and a row of piers.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('south-5', {
    kind: 'building',
    name: 'Здание в южном ряду',
    description: 'Здание с большим кругом посередине.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building in the southern row',
      description: 'Building with a large circle drawn in the middle.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('south-6', {
    kind: 'building',
    name: 'Здание в южном ряду',
    description: 'Небольшое здание с круглыми знаками внутри.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Building in the southern row',
      description: 'Small building with circles drawn inside.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('garden', {
    kind: 'open',
    name: 'Поле с посадками',
    description: 'Большой участок с рядами посадок к северу от главной аллеи.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Planted field',
      description: 'Large plot with rows of planting north of the main avenue.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('plots', {
    kind: 'open',
    name: 'Грядки',
    description: 'Сетка грядок между лечебницей, купальней и полем.',
    certainty: 'interpretation',
    note: `${NOT_IN_LEGEND} В романе травяной сад Северина находится рядом с лечебницей и купальней, поэтому атлас помещает его сюда.`,
    en: { name: 'Garden plots', description: 'Grid of planted beds between the hospital, the baths and the field.' },
    locationId: 'herb-garden',
  }),
  ab('orchard', {
    kind: 'open',
    name: 'Плодовый сад',
    description: 'Деревья вдоль западной стены, между лечебницей и главной аллеей.',
    certainty: 'interpretation',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Orchard',
      description: 'Trees along the western wall, between the hospital and the main avenue.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('tree-garden', {
    kind: 'open',
    name: 'Сад с деревьями',
    description: 'Квадратный сад из четырёх засаженных четвертей, к югу от аллеи.',
    certainty: 'uncertain',
    note: NOT_IN_LEGEND,
    en: {
      name: 'Garden with trees',
      description: 'Square garden with four planted quarters south of the avenue.',
      note: NOT_IN_LEGEND_EN,
    },
  }),
  ab('cemetery', {
    kind: 'open',
    name: 'Кладбище',
    description: 'Поле крестов между церковью и южной башней Храмины.',
    certainty: 'interpretation',
    note: `${NOT_IN_LEGEND} Кресты обозначают могилы.`,
    en: {
      name: 'Cemetery',
      description: 'Field of crosses between the church and the southern tower of the Aedificium.',
    },
    locationId: 'cemetery',
  }),
  ab('gate', {
    kind: 'opening',
    name: 'Ворота',
    description: 'Проём в западной стене, через который в ограду входит дорога.',
    certainty: 'interpretation',
    note: `${NOT_IN_LEGEND} Опознано по разрыву стены и дороге.`,
    locationId: 'gate',
    en: { name: 'Gate', description: 'Opening in the western wall where the road enters the enclosure.' },
  }),
  ab('road', {
    kind: 'terrain',
    name: 'Дорога за стенами',
    description: 'Дорога, петляющая вниз за западной стеной.',
    certainty: 'interpretation',
    note: 'Сама деревня лежит за пределами плана.',
    locationId: 'village',
    en: { name: 'Road outside the walls', description: 'Track winding down outside the western wall.' },
  }),
  ab('cliff', {
    kind: 'terrain',
    name: 'Склон за северной стеной',
    description: 'Заштрихованные склоны, обрывающиеся за северной стеной вокруг Храмины.',
    certainty: 'interpretation',
    locationId: 'ravine',
    en: {
      name: 'Slope below the Aedificium',
      description: 'Hatched slopes falling away outside the northern wall around the Aedificium.',
    },
  }),
];

// ───────────── План библиотеки ─────────────

const QUARTER = {
  N: { tower: 'северной башни (Septentrio)', side: 'северной', block: 'северо-восточном крыле' },
  E: { tower: 'восточной башни (Oriens)', side: 'восточной', block: 'юго-восточном крыле' },
  S: { tower: 'южной башни (Meridies)', side: 'южной', block: 'юго-западном крыле' },
  W: { tower: 'западной башни (Occidens)', side: 'западной', block: 'северо-западном крыле' },
} as const;

/** Положение комнаты по-русски — из геометрии плана, без догадок. */
export function zoneOf(q: keyof typeof QUARTER, pos: string): string {
  if (pos === 'tower-center') return `Центральная семиугольная комната ${QUARTER[q].tower}`;
  if (pos.startsWith('tower')) return `Внешняя комната ${QUARTER[q].tower}`;
  if (pos.startsWith('arm')) return `Комната в проходе от ${QUARTER[q].tower.split(' (')[0]} к центральному колодцу`;
  if (pos.startsWith('ring')) return `Комната у центрального восьмиугольного колодца, с ${QUARTER[q].side} стороны`;
  return `Комната в ${QUARTER[q].block}`;
}

/** Явные связи комнат плана с местами атласа. */
const LIBRARY_LINKS: Record<string, Partial<PlanHotspot>> = {
  'lib-S-tower-center': {
    locationId: 'finis-africae',
    revealDay: 2,
    name: 'Finis Africae',
    description:
      'Центральная семиугольная комната южной башни. На плане у неё нет буквы, а стены нарисованы без проёмов.',
    certainty: 'interpretation',
    note: 'Комната опознана по положению в южной («африканской») башне и по отмеченному проходу в её стене.',
    safeName: 'Комната без буквы в южной башне',
    safeDescription:
      'Центральная семиугольная комната южной башни. На плане у неё нет буквы, а стены нарисованы без проёмов.',
    en: {
      name: 'Finis Africae',
      description: 'The central heptagonal room of the south tower, with no letter and no doorways on the plan.',
    },
  },
  'lib-S-arm-right': {
    locationId: 'mirror-room',
    revealDay: 2,
    note: 'Участок стены этой комнаты, обращённый к центральной комнате южной башни, выделен на плане другим цветом. Атлас читает его как проход за зеркалом.',
    certainty: 'interpretation',
  },
  'lib-E-tower-center': {
    locationId: 'library-entrance',
    note: 'По роману лестница из скриптория выходит в восточную башню. На самом плане выход лестницы не отмечен.',
    certainty: 'interpretation',
  },
  'lib-E-tower-top': {
    note: 'У этой комнаты на плане нет буквы.',
  },
};

const libraryHotspots: PlanHotspot[] = LIBRARY_ROOMS.map((r) => {
  const link = LIBRARY_LINKS[r.id] ?? {};
  const zone = zoneOf(r.quarter, r.pos);
  return {
    id: r.id,
    plan: 'library' as const,
    kind: 'room' as const,
    poly: r.poly,
    printed: r.glyph ?? undefined,
    red: r.red,
    name: r.glyph ? `Комната «${r.glyph}»` : 'Комната без буквы',
    description: `${zone}.${r.red ? ' Буква нарисована на плане красным.' : ''}`,
    zone,
    certainty: 'confirmed' as Certainty,
    ...link,
  };
});

export const plans: Record<PlanId, PlanDef> = {
  abbey: {
    id: 'abbey',
    titleOrig: 'Аббатство',
    titleLang: 'ru',
    titleRu: 'План аббатства',
    width: 1336,
    height: 1024,
    hotspots: abbeyHotspots,
  },
  library: {
    id: 'library',
    titleOrig: 'Biblioteca',
    titleLang: 'it',
    titleRu: 'План библиотеки',
    width: 1280,
    height: 1289,
    hotspots: libraryHotspots,
  },
};

export const hotspotById = new Map<string, PlanHotspot>([...abbeyHotspots, ...libraryHotspots].map((h) => [h.id, h]));

/** Центроид многоугольника (по площади) — точка привязки знаков. */
export function centroid(poly: [number, number][]): [number, number] {
  let a = 0,
    cx = 0,
    cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i]!;
    const [x1, y1] = poly[(i + 1) % poly.length]!;
    const f = x0 * y1 - x1 * y0;
    a += f;
    cx += (x0 + x1) * f;
    cy += (y0 + y1) * f;
  }
  if (Math.abs(a) < 1e-6) return poly[0]!;
  return [Math.round((cx / (3 * a)) * 10) / 10, Math.round((cy / (3 * a)) * 10) / 10];
}

/** Явные точки привязки там, где центроид неудачен (вогнутые зоны). */
const ANCHOR_OVERRIDE: Record<string, [number, number]> = {
  'ab-cliff': [1180, 300],
  'ab-cemetery': [800, 520],
  'ab-stables': [1130, 560],
  'ab-dormitory': [900, 740],
  'ab-aedificium': [883, 350],
};

export function hotspotAnchor(h: PlanHotspot): [number, number] {
  return ANCHOR_OVERRIDE[h.id] ?? centroid(h.poly);
}
