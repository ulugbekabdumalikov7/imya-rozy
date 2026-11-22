import type { TourId } from '../../lib/guide';
import type { Route } from '../../lib/router';

/**
 * Путеводители атласа. Тексты не раскрывают сюжет: только то, что читатель знает с первой страницы
 * или видит в интерфейсе. Каждый шаг подсвечивает настоящие элементы; первый найденный — главный,
 * к нему тянется нить от карточки.
 */
export interface GuideStep {
  /** Уникален среди всех путеводителей (по нему меняется оформление шага). */
  id: string;
  /** Латинская рубрика, как у разделов атласа. */
  rubric: string;
  title: string;
  text: string;
  /**
   * CSS-селекторы подсвечиваемых элементов (не больше трёх). Подсвечиваются те, что видны на экране:
   * так один шаг подходит и компьютеру, и телефону (там часть панелей спрятана за кнопкой).
   */
  targets: string[];
  /** Шагу нужен план аббатства: путеводитель сам приводит туда читателя. */
  needsMap?: boolean;
  /** В карточке — настоящий выбор режима чтения. */
  picker?: boolean;
  /** «Попробуйте сами»: подсвеченное можно нажать по-настоящему, и путеводитель идёт дальше. */
  tryIt?: string;
}

export interface Tour {
  id: TourId;
  steps: GuideStep[];
  /** Подсказки раздела относятся к его главной странице (не к досье героя или отдельной справке). */
  matches?: (r: Route) => boolean;
  startLabel: string;
  finishLabel: string;
}

/** Сколько мест-подсветок одновременно умеет показывать путеводитель. */
export const MAX_TARGETS = 3;

const nav = (to: string) => `.mainnav [data-guide="${to}"]`;

const INTRO_STEPS: GuideStep[] = [
  {
    id: 'gate',
    rubric: 'Ad lectorem',
    title: 'У ворот аббатства',
    text: 'Ноябрь 1327 года, горы Северной Италии. Этот атлас — записи следствия по роману Умберто Эко: места, люди, дни и улики, сведённые в одно расследование. Обойдём аббатство за полминуты.',
    targets: [],
  },
  {
    id: 'intro-map',
    rubric: 'Locus',
    title: 'Карта — первый свидетель',
    text: 'Каждая постройка на плане отвечает на нажатие: что здесь случилось и кто здесь бывал. Подсвечен Эдифиций; над ним — библиотека-лабиринт, её план открывается на соседней вкладке.',
    targets: ['[data-spot="ab-aedificium"]', '[data-guide="plan-switch"]'],
    needsMap: true,
  },
  {
    id: 'intro-people',
    rubric: 'Personae',
    title: 'Люди и дни',
    text: 'Досье монахов и гостей; связи между ними, которые меняются день ото дня; хроника семи дней по часам службы — от утрени до повечерия.',
    targets: [nav('heroes'), nav('relations'), nav('timeline')],
  },
  {
    id: 'intro-clues',
    rubric: 'Indicia',
    title: 'Улики и версии',
    text: 'Каждая догадка держится на находках. Здесь видно, что её подтверждает, что опровергает и как одна улика связывает место, человека и событие.',
    targets: [nav('clues')],
  },
  {
    id: 'intro-spoilers',
    rubric: 'Cave lector',
    title: 'Атлас знает не больше вас',
    text: 'Отметьте, сколько вы прочли, — атлас откроет только это. Разгадка остаётся запечатанной, пока вы сами её не попросите.',
    targets: ['[data-guide="spoiler"]'],
    picker: true,
  },
];

const g = (name: string) => `[data-guide="${name}"]`;
const listView = (section: string) => (r: Route) => r.path[0] === section && r.path.length === 1;

export const TOURS: Record<TourId, Tour> = {
  intro: { id: 'intro', steps: INTRO_STEPS, startLabel: 'Войти', finishLabel: 'Начать расследование' },

  map: {
    id: 'map',
    matches: (r) => r.path[0] === 'map',
    startLabel: 'Далее',
    finishLabel: 'Понятно',
    steps: [
      {
        id: 'map-layers',
        rubric: 'Strata',
        title: 'Слои плана',
        text: 'Включайте и прячьте слои: кто где бывал, где лежат улики, путь выбранного героя. Режим расследования связывает события нитью по порядку дней.',
        targets: [g('map-layers'), g('map-layers-btn')],
      },
      {
        id: 'map-days',
        rubric: 'Dies',
        title: 'День и маршрут',
        text: 'Оставьте на плане один день — или выберите героя и пройдите его путём: отпечатки следов взяты из текста, контуры — реконструкция.',
        targets: [g('map-days'), g('map-route'), g('map-layers-btn')],
      },
      {
        id: 'map-hours',
        rubric: 'Horae',
        title: 'Час за часом',
        text: 'Роман по часам службы: шаг за шагом видно, кто где находится и что уже случилось к этому моменту.',
        targets: ['.moment-toggle'],
      },
    ],
  },

  heroes: {
    id: 'heroes',
    matches: listView('heroes'),
    startLabel: 'Далее',
    finishLabel: 'Понятно',
    steps: [
      {
        id: 'heroes-filters',
        rubric: 'Quaerere',
        title: 'Найти героя',
        text: 'Ищите по имени или отбирайте: по принадлежности, по отношению к библиотеке, по роли в сюжете и по эпизоду, где герой участвует.',
        targets: [g('heroes-filters')],
      },
      {
        id: 'heroes-card',
        rubric: 'Persona',
        title: 'Досье',
        text: 'Карточка ведёт в досье: роль, характер, связи, места и хроника появлений — в пределах того, что вы уже прочли.',
        targets: ['.hero-grid > li:first-child'],
      },
    ],
  },

  relations: {
    id: 'relations',
    matches: listView('relations'),
    startLabel: 'Далее',
    finishLabel: 'Понятно',
    steps: [
      {
        id: 'relations-tabs',
        rubric: 'Fata',
        title: 'Граф или сравнение',
        text: 'Граф показывает всех героев сразу. Сравнение ставит две судьбы рядом — день за днём.',
        targets: ['.tabs'],
      },
      {
        id: 'relations-types',
        rubric: 'Vincula',
        title: 'Типы связей',
        text: 'Оставьте только нужные нити — например, одни конфликты или одно доверие. Цвет и штрих линии повторяют тип.',
        targets: [g('rel-types')],
      },
      {
        id: 'relations-graph',
        rubric: 'Mutatio',
        title: 'Связь меняется',
        text: 'Нажмите на героя или на линию: откроется, на каком эпизоде держится связь и как она менялась по дням.',
        targets: ['.graph-stage'],
      },
    ],
  },

  timeline: {
    id: 'timeline',
    matches: listView('timeline'),
    startLabel: 'Далее',
    finishLabel: 'Понятно',
    steps: [
      {
        id: 'timeline-days',
        rubric: 'Dies',
        title: 'Семь дней',
        text: 'Каждый день романа — отдельная глава хроники. Нажмите на день, чтобы оставить только его.',
        targets: ['.day-strip'],
      },
      {
        id: 'timeline-filters',
        rubric: 'Delectus',
        title: 'Что показать',
        text: 'Отберите события: только встречи, только библиотеку или всё, где участвуют Вильгельм и Адсон.',
        targets: [g('tl-filters')],
      },
      {
        id: 'timeline-event',
        rubric: 'Hora',
        title: 'Событие на своём часе',
        text: 'Слева — час службы, от утрени до повечерия. Нажмите на событие: откроются место, участники и улики.',
        targets: ['.tl-event'],
      },
    ],
  },

  clues: {
    id: 'clues',
    matches: (r) => r.path[0] === 'clues',
    startLabel: 'Далее',
    finishLabel: 'Понятно',
    steps: [
      {
        id: 'clues-hyps',
        rubric: 'Opiniones',
        title: 'Версии',
        text: 'Слева — догадки, которые выдвигают герои. У каждой — кто её держится и проверена ли она к вашему дню.',
        targets: [g('hyp-list')],
        tryIt: 'Выберите любую версию',
      },
      {
        id: 'clues-threads',
        rubric: 'Indicia',
        title: 'Нити к уликам',
        text: 'Нити ведут к находкам: что версию подтверждает, а что ей противоречит. Свидетельство — слова героя, а не доказанный факт.',
        targets: ['.board-cols'],
      },
      {
        id: 'clues-card',
        rubric: 'Res',
        title: 'Улика',
        text: 'Нажмите на улику — узнаете, где и когда её нашли, кого она касается и к каким событиям ведёт.',
        targets: ['.clue-card'],
      },
    ],
  },

  history: {
    id: 'history',
    matches: listView('history'),
    startLabel: 'Далее',
    finishLabel: 'Понятно',
    steps: [
      {
        id: 'history-list',
        rubric: 'Historia',
        title: 'Справки к роману',
        text: 'Папа и император, спор о бедности, инквизиция, монастырский распорядок, рукописи — то, о чём спорят герои.',
        targets: ['.history-list'],
      },
      {
        id: 'history-note',
        rubric: 'Veritas',
        title: 'История и вымысел',
        text: 'Внутри каждой справки отдельно сказано, что было на самом деле, а что придумал Эко, — и где это звучит в романе.',
        targets: ['.history-list > li:first-child'],
      },
    ],
  },
};

/** Подсказки к разделу, на странице которого читатель сейчас. */
export function tourForRoute(r: Route): TourId | null {
  for (const t of Object.values(TOURS)) if (t.matches?.(r)) return t.id;
  return null;
}
