import type { Route, RouteStep } from './types';

/**
 * Маршруты строятся только по эпизодам, где местонахождение персонажа известно.
 * Шаги kind='gap' означают, что между двумя известными точками роман не говорит, где был герой:
 * на карте такой участок не соединяется линией.
 */
const s = (
  locationId: string, day: number, note: string, kind: RouteStep['kind'] = 'confirmed',
  eventId?: string, revealDay = day, critical = false,
): RouteStep => ({ locationId, day, note, kind, eventId, revealDay: Math.max(0, revealDay), critical });

export const routes: Route[] = [
  {
    id: 'route-william', characterId: 'william', title: 'Путь Вильгельма',
    steps: [
      s('gate', 1, 'Прибытие; эпизод с конём аббата.', 'confirmed', 'e-arrival', 0),
      s('abbots-house', 1, 'Разговор с аббатом, поручение.', 'confirmed', 'e-abbot-commission', 0),
      s('church', 1, 'Портал церкви, встреча с Убертином.', 'confirmed', 'e-ubertino-church', 0),
      s('herb-garden', 1, 'Беседа с Северином о травах.', 'confirmed', 'e-severinus-garden', 0),
      s('scriptorium', 1, 'Скрипторий, спор о смехе.', 'confirmed', 'e-scriptorium-laughter', 0),
      s('aedificium', 1, 'Осмотр Эдифиция снаружи: окна над обрывом.', 'confirmed', 'e-adelmo-reasoning', 0),
      s('workshops', 1, 'Разговор со стекольщиком.', 'confirmed', 'e-nicholas-glass', 0),
      s('pigsty', 2, 'Тело Венанция.', 'confirmed', 'e-venantius-found'),
      s('hospital', 2, 'Осмотр тела с Северином.', 'confirmed', 'e-venantius-exam'),
      s('cloister', 2, 'Разговоры с Бенцием и Беренгаром.', 'reconstructed', 'e-benno-testimony'),
      s('ossuary', 2, 'Ночью — через оссуарий.', 'confirmed', 'e-night-scriptorium'),
      s('kitchen', 2, 'Ход выходит в кухню.', 'confirmed', 'e-night-scriptorium'),
      s('scriptorium', 2, 'Стол Венанция, похищенная книга.', 'confirmed', 'e-night-scriptorium'),
      s('library', 2, 'Блуждание по лабиринту.', 'confirmed', 'e-first-labyrinth'),
      s('dormitory', 3, 'Исчезновение Беренгара: где именно был Вильгельм в этот момент, неясно.', 'gap', 'e-berengar-missing'),
      s('workshops', 3, 'Работа над новыми линзами.', 'reconstructed', 'e-new-lenses'),
      s('balneary', 4, 'Тело Беренгара.', 'confirmed', 'e-berengar-found'),
      s('hospital', 4, 'Северин о пропавшем яде.', 'confirmed', 'e-severinus-poison'),
      s('scriptorium', 4, 'Расшифровка тайнописи.', 'reconstructed', 'e-cipher-solved'),
      s('gate', 4, 'Прибытие посольств.', 'reconstructed', 'e-legations-arrive'),
      s('library', 4, 'Составление плана лабиринта.', 'confirmed', 'e-library-map'),
      s('chapter-house', 5, 'Диспут о бедности.', 'confirmed', 'e-disputation'),
      s('hospital', 5, 'Северин мёртв.', 'confirmed', 'e-severinus-killed'),
      s('chapter-house', 5, 'Суд Бернарда Ги.', 'confirmed', 'e-trial'),
      s('church', 5, 'Проповедь Хорхе на повечерии.', 'confirmed', 'e-jorge-sermon'),
      s('church', 6, 'Смерть Малахии на утрене.', 'confirmed', 'e-malachi-death'),
      s('scriptorium', 6, 'Каталог библиотеки.', 'confirmed', 'e-catalogue'),
      s('abbots-house', 6, 'Аббат велит уехать.', 'confirmed', 'e-abbot-dismisses'),
      s('mirror-room', 6, 'Разгадка «четырёх».', 'confirmed', 'e-quatuor-solved', 6, true),
      s('finis-africae', 7, 'Встреча с Хорхе.', 'confirmed', 'e-finis-africae', 7, true),
      s('library', 7, 'Пожар.', 'confirmed', 'e-fire', 7, true),
      s('aedificium', 7, 'Уход из горящего аббатства.', 'confirmed', 'e-abbey-burns', 7, true),
    ],
  },
  {
    id: 'route-adso', characterId: 'adso', title: 'Путь Адсона',
    steps: [
      s('gate', 1, 'Прибытие вместе с учителем.', 'confirmed', 'e-arrival', 0),
      s('church', 1, 'Потрясение от портала.', 'confirmed', 'e-ubertino-church', 0),
      s('scriptorium', 1, 'Скрипторий.', 'confirmed', 'e-scriptorium-laughter', 0),
      s('pigsty', 2, 'Тело Венанция.', 'confirmed', 'e-venantius-found'),
      s('ossuary', 2, 'Ночной путь в Эдифиций.', 'confirmed', 'e-night-scriptorium'),
      s('scriptorium', 2, 'Стол Венанция.', 'confirmed', 'e-night-scriptorium'),
      s('library', 2, 'Зеркало и видения.', 'confirmed', 'e-first-labyrinth'),
      s('church', 3, 'Рассказ о Дольчино.', 'reconstructed', 'e-dolcino-story'),
      s('kitchen', 3, 'Встреча с девушкой.', 'confirmed', 'e-adso-girl'),
      s('balneary', 4, 'Тело Беренгара.', 'confirmed', 'e-berengar-found'),
      s('library', 4, 'План лабиринта.', 'confirmed', 'e-library-map'),
      s('kitchen', 4, 'Арест Сальватора и девушки.', 'reconstructed', 'e-salvatore-arrest'),
      s('chapter-house', 5, 'Диспут и суд.', 'confirmed', 'e-trial'),
      s('church', 6, 'Смерть Малахии; сон о пире.', 'confirmed', 'e-adso-dream'),
      s('mirror-room', 6, 'Подсказка, ставшая ключом.', 'confirmed', 'e-quatuor-solved', 6, true),
      s('finis-africae', 7, 'Последняя ночь.', 'confirmed', 'e-finis-africae', 7, true),
      s('library', 7, 'Пожар.', 'confirmed', 'e-fire', 7, true),
      s('aedificium', 8, 'Спустя годы — у руин.', 'confirmed', 'e-epilogue', 7, true),
    ],
  },
  {
    id: 'route-venantius', characterId: 'venantius', title: 'Последние дни Венанция',
    steps: [
      s('scriptorium', 1, 'Спор о смехе.', 'confirmed', 'e-scriptorium-laughter', 0),
      s('scriptorium', 1, 'Ночью читает книгу за своим столом.', 'reconstructed', 'e-venantius-dies', 7, true),
      s('kitchen', 1, 'Спускается и умирает.', 'reconstructed', 'e-venantius-dies', 7, true),
      s('pigsty', 2, 'Тело обнаружено в сосуде.', 'confirmed', 'e-venantius-found'),
    ],
  },
  {
    id: 'route-berengar', characterId: 'berengar', title: 'Путь Беренгара',
    steps: [
      s('cemetery', 0, 'По его словам, видел здесь Адельма в ночь гибели.', 'reconstructed', 'e-berengar-ghost', 2),
      s('scriptorium', 1, 'В скриптории при библиотекаре.', 'confirmed', 'e-scriptorium-laughter', 0),
      s('kitchen', 1, 'Находит тело Венанция.', 'reconstructed', 'e-venantius-dies', 7, true),
      s('pigsty', 1, 'Переносит тело в сосуд.', 'reconstructed', 'e-venantius-dies', 7, true),
      s('scriptorium', 2, 'Выхватывает книгу со стола Венанция.', 'confirmed', 'e-night-scriptorium', 7, true),
      s('dormitory', 3, 'Исчезает; где он провёл день — неизвестно.', 'gap', 'e-berengar-missing'),
      s('balneary', 3, 'Умирает в купальне.', 'reconstructed', 'e-berengar-dies', 7, true),
      s('balneary', 4, 'Тело найдено.', 'confirmed', 'e-berengar-found'),
    ],
  },
  {
    id: 'route-severinus', characterId: 'severinus', title: 'Путь Северина',
    steps: [
      s('herb-garden', 1, 'Показывает сад Вильгельму.', 'confirmed', 'e-severinus-garden', 0),
      s('hospital', 2, 'Осматривает тело Венанция.', 'confirmed', 'e-venantius-exam'),
      s('balneary', 4, 'Осматривает тело Беренгара.', 'confirmed', 'e-berengar-found'),
      s('hospital', 4, 'Вспоминает о пропавшем яде.', 'confirmed', 'e-severinus-poison'),
      s('chapter-house', 5, 'Сообщает о книге.', 'confirmed', 'e-severinus-strange-book'),
      s('hospital', 5, 'Убит в лаборатории.', 'confirmed', 'e-severinus-killed'),
    ],
  },
  {
    id: 'route-malachi', characterId: 'malachi', title: 'Путь Малахии',
    steps: [
      s('scriptorium', 1, 'Встречает Вильгельма в скриптории.', 'confirmed', 'e-scriptorium-laughter', 0),
      s('hospital', 5, 'Приходит в лабораторию Северина.', 'reconstructed', 'e-severinus-killed', 7, true),
      s('scriptorium', 5, 'Получает книгу от Бенция.', 'confirmed', 'e-benno-book'),
      s('church', 6, 'Умирает на утрене.', 'confirmed', 'e-malachi-death'),
    ],
  },
  {
    id: 'route-jorge', characterId: 'jorge', title: 'Путь Хорхе',
    steps: [
      s('scriptorium', 1, 'Спор о смехе.', 'confirmed', 'e-scriptorium-laughter', 0),
      s('church', 5, 'Проповедь о конце времён.', 'confirmed', 'e-jorge-sermon'),
      s('church', 6, 'На утрене, когда умирает Малахия.', 'confirmed', 'e-malachi-death'),
      s('finis-africae', 6, 'Запирает аббата и ждёт следователей.', 'confirmed', 'e-abbot-trapped', 7, true),
      s('library', 7, 'Пожар.', 'confirmed', 'e-fire', 7, true),
    ],
  },
  {
    id: 'route-abbo', characterId: 'abbo', title: 'Путь аббата',
    steps: [
      s('abbots-house', 1, 'Даёт поручение Вильгельму.', 'confirmed', 'e-abbot-commission', 0),
      s('pigsty', 2, 'У тела Венанция.', 'reconstructed', 'e-venantius-found'),
      s('dormitory', 3, 'Исчезновение Беренгара.', 'reconstructed', 'e-berengar-missing'),
      s('gate', 4, 'Встречает посольства.', 'confirmed', 'e-legations-arrive'),
      s('chapter-house', 5, 'Диспут и суд.', 'confirmed', 'e-trial'),
      s('church', 6, 'Смерть Малахии.', 'confirmed', 'e-malachi-death'),
      s('abbots-house', 6, 'Отстраняет Вильгельма.', 'confirmed', 'e-abbot-dismisses'),
      s('finis-africae', 6, 'Заперт в потайном ходе.', 'reconstructed', 'e-abbot-trapped', 7, true),
    ],
  },
  {
    id: 'route-bernard', characterId: 'bernard', title: 'Путь Бернарда Ги',
    steps: [
      s('gate', 4, 'Прибывает с папским посольством.', 'confirmed', 'e-legations-arrive'),
      s('kitchen', 4, 'Арест Сальватора и девушки.', 'reconstructed', 'e-salvatore-arrest'),
      s('chapter-house', 5, 'Диспут.', 'confirmed', 'e-disputation'),
      s('hospital', 5, 'Берёт под стражу Ремигия.', 'confirmed', 'e-severinus-killed'),
      s('chapter-house', 5, 'Суд.', 'confirmed', 'e-trial'),
    ],
  },
  {
    id: 'route-remigio', characterId: 'remigio', title: 'Путь Ремигия',
    steps: [
      s('gate', 1, 'Ищет коня аббата.', 'confirmed', 'e-arrival', 0),
      s('kitchen', 4, 'Разговор о его прошлом.', 'reconstructed', 'e-remigio-pressed'),
      s('hospital', 5, 'Схвачен в лаборатории.', 'confirmed', 'e-severinus-killed'),
      s('chapter-house', 5, 'Суд и признание.', 'confirmed', 'e-trial'),
    ],
  },
];

export const routeByCharacter = new Map(routes.map((r) => [r.characterId, r]));
