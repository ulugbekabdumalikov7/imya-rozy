import type { Certainty } from './types';
import { ABBEY_POLYS, LIBRARY_ROOMS } from './planGeometry';

/**
 * Два эталонных плана, каждый со своей системой координат (пиксели исходного изображения):
 *  — 'abbey'   — общий план аббатства «L'Abbazia» (1490 × 1055);
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
  /** Строка легенды для этой буквы, дословно по-итальянски. */
  legend?: string;
  /** Название и описание по-русски — основной текст интерфейса. */
  name: string;
  description: string;
  /** Насколько надёжно опознание этой зоны. */
  certainty: Certainty;
  /** Расхождение легенды и надписи на плане или иная оговорка. */
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
  titleIt: string;
  titleRu: string;
  width: number;
  height: number;
  hotspots: PlanHotspot[];
}

const P = ABBEY_POLYS as Record<string, [number, number][]>;
const ab = (id: string, rest: Omit<PlanHotspot, 'id' | 'plan' | 'poly'>): PlanHotspot => ({ id: `ab-${id}`, plan: 'abbey', poly: P[id]!, ...rest });
const NOT_LETTERED = 'На плане не подписано.';
const NOT_LETTERED_EN = 'Not lettered on the plan.';

/** Легенда плана аббатства — дословно, с русским и английским переводом. */
export const ABBEY_LEGEND: { letter: string; it: string; ru: string; en: string }[] = [
  { letter: 'A', it: 'Ospedale', ru: 'Лечебница', en: 'Hospital' },
  { letter: 'B', it: 'Balnea', ru: 'Баня', en: 'Baths' },
  { letter: 'C', it: 'Edificio', ru: 'Эдифиций', en: 'The Aedificium' },
  { letter: 'D', it: 'Chiesa', ru: 'Церковь', en: 'Church' },
  { letter: 'E', it: 'Chiostro', ru: 'Клуатр', en: 'Cloister' },
  { letter: 'F', it: 'Dormitori', ru: 'Дормитории', en: 'Dormitories' },
  { letter: 'H', it: 'Sala capitolare', ru: 'Капитулярный зал', en: 'Chapter house' },
  { letter: 'M', it: 'Stabja', ru: 'Хлева', en: 'Animal pens' },
  { letter: 'N', it: 'Stalle', ru: 'Конюшни', en: 'Stables' },
  { letter: 'R', it: 'Fucine', ru: 'Кузницы', en: 'Forges' },
];

const abbeyHotspots: PlanHotspot[] = [
  ab('aedificium', {
    kind: 'building', printed: 'D', legend: 'Chiesa', name: 'Эдифиций',
    description: 'Крестообразное здание с четырьмя многоугольными башнями и восьмиугольным колодцем в центре, на северном краю ограды над склоном. По роману внизу кухня и трапезная, над ними скрипторий, наверху библиотека. Этажи на этом плане не начерчены.',
    certainty: 'interpretation',
    note: 'В легенде D — «Chiesa» (церковь), но буква D напечатана внутри этого четырёхбашенного здания. По форме оно совпадает с Эдифицием из романа, поэтому атлас опознаёт его как Эдифиций.',
    en: { name: 'The Aedificium', description: 'Cross-shaped building with four polygonal towers and an octagonal central well, on the northern edge of the enclosure above the slope.', note: 'The legend gives D as “Chiesa”, but D is printed inside this four-towered building; the atlas identifies it as the Aedificium.' },
    locationId: 'aedificium', opensPlan: 'library',
  }),
  ab('church', {
    kind: 'building', printed: 'E', legend: 'Chiostro', name: 'Церковь аббатства',
    description: 'Базилика с колоннадой в нефе, трансептом и полукруглой апсидой на востоке.',
    certainty: 'interpretation',
    note: 'В легенде E — «Chiostro» (клуатр), но эта буква E стоит в нефе здания базиликального типа. Атлас опознаёт его как церковь по форме.',
    en: { name: 'Abbey church', description: 'Basilica with a colonnaded nave, a transept and a semicircular apse at the east end.', note: 'The legend gives E as “Chiostro”; the atlas identifies this building as the church by its form.' },
    locationId: 'church',
  }),
  ab('cloister', {
    kind: 'open', printed: 'R', legend: 'Fucine', name: 'Клуатр',
    description: 'Открытый двор, обрамлённый галереями с колоннами, с южной стороны церкви.',
    certainty: 'interpretation',
    note: 'В легенде R — «Fucine» (кузницы), но эта R отмечает двор с аркадами у церкви; по форме атлас опознаёт его как клуатр. Вторая R, в южном ряду, кузницам соответствует.',
    en: { name: 'Cloister', description: 'Open court framed by colonnaded walks on the south side of the church.', note: 'The legend gives R as “Fucine”; by its form the atlas identifies this court as the cloister.' },
    locationId: 'cloister',
  }),
  ab('garden-E', {
    kind: 'open', printed: 'E', legend: 'Chiostro', name: 'Огороженный сад с фонтаном',
    description: 'Прямоугольная ограда с грядками и фонтаном посередине, к северу от главной аллеи.',
    certainty: 'uncertain',
    note: 'Буква E, в легенде — «Chiostro». На рисунке — сад, а не двор с аркадами, и та же буква стоит в церкви. Атлас сохраняет надпись, но не связывает сад с местом из романа.',
    en: { name: 'Walled garden with a fountain', description: 'Rectangular enclosure with planted beds and a fountain in the middle.' },
  }),
  ab('plots', {
    kind: 'open', name: 'Грядки',
    description: 'Сетка грядок между баней, малым корпусом F и огороженным садом.',
    certainty: 'interpretation',
    note: `${NOT_LETTERED} В романе травяной сад Северина находится рядом с лечебницей и баней, поэтому атлас помещает его сюда.`,
    en: { name: 'Garden plots', description: 'Grid of planted beds between the balneum, the small F range and the walled garden.' },
    locationId: 'herb-garden',
  }),
  ab('orchard', {
    kind: 'open', name: 'Плодовый сад',
    description: 'Деревья к югу от бани вдоль западной стены.',
    certainty: 'interpretation', note: NOT_LETTERED,
    en: { name: 'Orchard', description: 'Trees drawn south of the balneum along the western wall.', note: NOT_LETTERED_EN },
  }),
  ab('B', {
    kind: 'building', printed: 'B', legend: 'Balnea', name: 'Баня',
    description: 'Длинное узкое здание вдоль северо-западной стены, поставленное под углом, со скруглённым торцом и небольшой пристройкой.',
    certainty: 'confirmed', locationId: 'balneary',
    en: { name: 'Balneum (baths)', description: 'Long, narrow building set at an angle along the north-western wall, with a rounded end and a small annex.' },
  }),
  ab('A-gate', {
    kind: 'building', printed: 'A', legend: 'Ospedale', name: 'Лечебница',
    description: 'Небольшое здание сразу за западными воротами, со сводчатым помещением.',
    certainty: 'interpretation',
    note: 'Буква A напечатана дважды: здесь и в юго-западном углу. Атлас связывает лечебницу и лабораторию Северина с этим зданием — оно ближе к бане и грядкам.',
    en: { name: 'Hospital', description: 'Small building just inside the western gate, with a vaulted room.', note: 'The letter A is printed twice; the atlas links Severinus’s hospital to this one.' },
    locationId: 'hospital',
  }),
  ab('A-south', {
    kind: 'building', printed: 'A', legend: 'Ospedale', name: 'Второе здание с буквой A',
    description: 'Г-образное здание в юго-западном углу ограды.',
    certainty: 'uncertain',
    note: 'Тоже отмечено буквой A (Ospedale). План не говорит, которое из двух зданий — лечебница Северина; атлас связывает её со зданием у ворот.',
    en: { name: 'Second building marked A', description: 'L-shaped building in the south-western corner of the enclosure.' },
  }),
  ab('F-top', {
    kind: 'building', printed: 'F', legend: 'Dormitori', name: 'Малый корпус с буквой F',
    description: 'Ряд из трёх келий у северной стены, рядом с огороженным садом.',
    certainty: 'confirmed',
    en: { name: 'Small range marked F', description: 'Row of three cells against the northern wall.' },
  }),
  ab('dormitory-east', {
    kind: 'building', printed: 'F', legend: 'Dormitori', name: 'Дормиторий',
    description: 'Корпус вдоль восточной стены: зал с портиком и длинный ряд келий.',
    certainty: 'confirmed',
    note: 'Буква F напечатана дважды. Дормиторий монахов с кельями атлас помещает в этот восточный корпус.',
    en: { name: 'Dormitory', description: 'Range along the eastern wall: a hall with a portico and a long row of cells.' },
    locationId: 'dormitory',
  }),
  ab('ne-building', {
    kind: 'building', name: 'Здание в северном конце восточного корпуса',
    description: 'Зал с портиком в начале ряда келий.', certainty: 'uncertain', note: NOT_LETTERED,
    en: { name: 'Building at the north end of the eastern range', description: 'Hall with a portico at the head of the row of cells.', note: NOT_LETTERED_EN },
  }),
  ab('e2', { kind: 'building', name: 'Здание у восточной стены', description: 'Здание из двух помещений к югу от дормитория.', certainty: 'uncertain', note: NOT_LETTERED,
    en: { name: 'Building on the eastern side', description: 'Two-room building south of the dormitory.' } }),
  ab('e3', { kind: 'building', name: 'Здание у восточной стены', description: 'Здание с крестовым сводом и портиком.', certainty: 'uncertain', note: NOT_LETTERED,
    en: { name: 'Building on the eastern side', description: 'Building with a cross-vaulted room and a portico.' } }),
  ab('C', {
    kind: 'building', printed: 'C', legend: 'Edificio', name: 'Здание с буквой C',
    description: 'Простой прямоугольный корпус у восточной стены.',
    certainty: 'uncertain',
    note: 'В легенде C — «Edificio». Но в романе Эдифиций — четырёхбашенное здание, которое здесь отмечено буквой D. Атлас сохраняет надпись и не связывает этот корпус с местом из романа.',
    en: { name: 'Building marked C', description: 'Plain rectangular block on the eastern side.' },
  }),
  ab('N', {
    kind: 'building', printed: 'N', legend: 'Stalle', name: 'Конюшни',
    description: 'Здание в южном ряду: стойла вдоль одной стороны и мощёная полоса.',
    certainty: 'confirmed', locationId: 'stables',
    en: { name: 'Stables', description: 'Building in the southern row with stalls along one side and a paved strip.' },
  }),
  ab('M', {
    kind: 'building', printed: 'M', legend: 'Stabja', name: 'Хлева',
    description: 'Прямоугольное здание в южном ряду.',
    certainty: 'interpretation',
    note: '«Stabja» — хлева, загоны. Атлас помещает сюда свинарник, у которого находят тело Венанция; в романе этот двор не связан с конкретной буквой.',
    en: { name: 'Animal pens', description: 'Rectangular building in the southern row.' },
    locationId: 'pigsty',
  }),
  ab('Ms', {
    kind: 'building', printed: 'M', legend: 'Stabja', name: 'Второе здание с буквой M',
    description: 'Небольшое здание рядом с M. У буквы есть маленький нижний индекс, который на скане читается неуверенно.',
    certainty: 'uncertain',
    en: { name: 'Second building marked M', description: 'Small building beside M; the letter carries a subscript that is hard to read.' },
  }),
  ab('R-forge', {
    kind: 'building', printed: 'R', legend: 'Fucine', name: 'Кузницы',
    description: 'Здание в южном ряду с круглым горном.',
    certainty: 'confirmed',
    note: 'В романе в кузницах работает стекольщик Николай Моримондский.',
    en: { name: 'Forges', description: 'Building in the southern row with a round furnace.' },
    locationId: 'workshops',
  }),
  ab('H', {
    kind: 'building', printed: 'H', legend: 'Sala capitolare', name: 'Капитулярный зал',
    description: 'Здание в южном ряду.',
    certainty: 'interpretation',
    note: 'Опознано по легенде. В романе в капитулярном зале проходят диспут и суд.',
    en: { name: 'Chapter house', description: 'Building in the southern row.' },
    locationId: 'chapter-house',
  }),
  ab('K', {
    kind: 'building', printed: 'K', name: 'Здание с буквой K',
    description: 'Здание в юго-восточном углу с круглой башней.',
    certainty: 'uncertain', note: 'Буквы K в легенде нет.',
    en: { name: 'Building marked K', description: 'Building in the south-eastern corner with a round tower.', note: 'The letter K does not appear in the legend.' },
  }),
  ab('east-range', {
    kind: 'building', name: 'Зал с колоннами к востоку от клуатра',
    description: 'Длинный зал с двумя рядами колонн, примыкающий к южной стороне церкви.',
    certainty: 'uncertain', note: NOT_LETTERED,
    en: { name: 'Columned hall east of the cloister', description: 'Long hall with two rows of columns, joined to the south side of the church.' },
  }),
  ab('south-range', {
    kind: 'building', name: 'Корпус к югу от клуатра',
    description: 'Здание со сводчатым залом и небольшими помещениями, замыкающее клуатр с юга.',
    certainty: 'uncertain', note: NOT_LETTERED,
    en: { name: 'Range south of the cloister', description: 'Building with a cross-vaulted hall and smaller rooms.' },
  }),
  ab('small-south', { kind: 'building', name: 'Небольшое здание', description: 'Небольшое здание ниже зала с колоннами.', certainty: 'uncertain', note: NOT_LETTERED,
    en: { name: 'Small building', description: 'Small building below the columned hall.' } }),
  ab('tree-garden', {
    kind: 'open', name: 'Сад с деревьями',
    description: 'Квадратный сад из четырёх засаженных четвертей, к югу от аллеи.',
    certainty: 'uncertain', note: NOT_LETTERED,
    en: { name: 'Garden with trees', description: 'Square garden with four planted quarters south of the avenue.' },
  }),
  ab('cemetery', {
    kind: 'open', name: 'Кладбище',
    description: 'Поле крестов между церковью и южной башней Эдифиция.',
    certainty: 'interpretation', note: `${NOT_LETTERED} Кресты обозначают могилы.`,
    en: { name: 'Cemetery', description: 'Field of crosses between the church and the southern tower of the Aedificium.' },
    locationId: 'cemetery',
  }),
  ab('gate', {
    kind: 'opening', name: 'Ворота',
    description: 'Проём в западной стене, через который в ограду входит дорога.',
    certainty: 'interpretation', note: `${NOT_LETTERED} Опознано по разрыву стены и дороге.`, locationId: 'gate',
    en: { name: 'Gate', description: 'Opening in the western wall where the road enters the enclosure.' },
  }),
  ab('road', {
    kind: 'terrain', name: 'Дорога за стенами',
    description: 'Дорога, петляющая вниз за западной стеной.',
    certainty: 'interpretation', note: 'Сама деревня лежит за пределами плана.', locationId: 'village',
    en: { name: 'Road outside the walls', description: 'Track winding down outside the western wall.' },
  }),
  ab('cliff', {
    kind: 'terrain', name: 'Склон под Эдифицием',
    description: 'Заштрихованные склоны, обрывающиеся за северной стеной вокруг Эдифиция.',
    certainty: 'interpretation', locationId: 'ravine',
    en: { name: 'Slope below the Aedificium', description: 'Hatched slopes falling away outside the northern wall around the Aedificium.' },
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
    locationId: 'finis-africae', revealDay: 2,
    name: 'Finis Africae',
    description: 'Центральная семиугольная комната южной башни. На плане у неё нет буквы, а стены нарисованы без проёмов.',
    certainty: 'interpretation',
    note: 'Комната опознана по положению в южной («африканской») башне и по отмеченному проходу в её стене.',
    safeName: 'Комната без буквы в южной башне',
    safeDescription: 'Центральная семиугольная комната южной башни. На плане у неё нет буквы, а стены нарисованы без проёмов.',
    en: { name: 'Finis Africae', description: 'The central heptagonal room of the south tower, with no letter and no doorways on the plan.' },
  },
  'lib-S-arm-right': {
    locationId: 'mirror-room', revealDay: 2,
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
  abbey: { id: 'abbey', titleIt: "L'Abbazia", titleRu: 'План аббатства', width: 1490, height: 1055, hotspots: abbeyHotspots },
  library: { id: 'library', titleIt: 'Biblioteca', titleRu: 'План библиотеки', width: 1280, height: 1289, hotspots: libraryHotspots },
};

export const hotspotById = new Map<string, PlanHotspot>(
  [...abbeyHotspots, ...libraryHotspots].map((h) => [h.id, h]),
);

/** Центроид многоугольника (по площади) — точка привязки знаков. */
export function centroid(poly: [number, number][]): [number, number] {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i]!;
    const [x1, y1] = poly[(i + 1) % poly.length]!;
    const f = x0 * y1 - x1 * y0;
    a += f; cx += (x0 + x1) * f; cy += (y0 + y1) * f;
  }
  if (Math.abs(a) < 1e-6) return poly[0]!;
  return [Math.round((cx / (3 * a)) * 10) / 10, Math.round((cy / (3 * a)) * 10) / 10];
}

/** Явные точки привязки там, где центроид неудачен (вогнутые зоны). */
const ANCHOR_OVERRIDE: Record<string, [number, number]> = {
  'ab-cliff': [985, 160],
  'ab-cemetery': [800, 540],
  'ab-road': [150, 470],
  'ab-dormitory-east': [1160, 565],
  'ab-aedificium': [912, 260],
};

export function hotspotAnchor(h: PlanHotspot): [number, number] {
  return ANCHOR_OVERRIDE[h.id] ?? centroid(h.poly);
}
