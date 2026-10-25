import type { StoryEvent } from './types';

/**
 * События романа. Канонические часы указаны там, где роман привязывает эпизод к главе-часу;
 * если час неизвестен или эпизод растянут, используется 'unknown'.
 * День 0 — предыстория (до прибытия), день 8 — эпилог.
 */
export const events: StoryEvent[] = [
  // ───────────── Предыстория ─────────────
  {
    id: 'e-adelmo-bargain', title: 'Сделка Адельма и Беренгара', day: 0, hour: 'unknown', sequence: 10,
    description: 'Незадолго до приезда Вильгельма Адельм соглашается на постыдную сделку с Беренгаром: близость в обмен на тайну библиотеки.',
    significance: 'Отсюда начинается цепь событий: стыд, исповедь и отчаяние Адельма, а через него знание о тайне доходит до Венанция.',
    kinds: ['library'], characterIds: ['adelmo', 'berengar'], clueIds: ['t-berengar-ghost'], relatedEventIds: ['e-adelmo-death'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'e-adelmo-death', title: 'Гибель Адельма', day: 0, hour: 'night', sequence: 20,
    description: 'В метель Адельм погибает. Утром его тело находят в обрыве под Эдифицием, под снегом и осыпью камней. Аббат считает, что он выпал из окна здания.',
    later: [
      { revealDay: 2, text: 'Беренгар рассказывает, что в ту ночь видел Адельма на кладбище: тот говорил о своём проклятии.', certainty: 'confirmed' },
      { revealDay: 3, text: 'Вильгельм приходит к выводу, что Адельм бросился с высоты сам, в отчаянии. Это не убийство.', certainty: 'confirmed' },
    ],
    significance: 'Смерть, с которой начинается расследование. Её истинный характер становится ясен лишь постепенно.',
    kinds: ['death'], locationId: 'ravine', characterIds: ['adelmo'], clueIds: ['c-adelmo-fall', 't-berengar-ghost'], relatedEventIds: ['e-adelmo-bargain', 'e-abbot-commission'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },

  // ───────────── День первый ─────────────
  {
    id: 'e-arrival', title: 'Прибытие и конь аббата', day: 1, hour: 'prime', sequence: 100,
    description: 'Поднимаясь к аббатству, Вильгельм встречает келаря с братией, ищущих сбежавшего коня. Не видев животного, он описывает его масть, повадки и указывает, куда тот побежал.',
    significance: 'Первая демонстрация метода: следы на снегу и сломанные ветки — это знаки, которые можно прочитать.',
    kinds: ['arrival', 'clue'], locationId: 'gate', characterIds: ['william', 'adso', 'remigio'], clueIds: ['c-brunellus'], relatedEventIds: ['e-abbot-commission'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbot-commission', title: 'Поручение аббата', day: 1, hour: 'terce', sequence: 110,
    description: 'Аббон рассказывает о смерти Адельма и просит Вильгельма разобраться до прибытия посольств. Он запрещает ему подниматься в библиотеку.',
    significance: 'Задаёт условия расследования: искать можно везде, кроме главного места.',
    kinds: ['meeting'], locationId: 'abbots-house', characterIds: ['abbo', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-adelmo-death', 'e-arrival'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-ubertino-church', title: 'Портал церкви и Убертин', day: 1, hour: 'sext', sequence: 120,
    description: 'Адсон потрясён резным порталом с видением Апокалипсиса. В церкви Вильгельм встречает старого друга Убертина Казальского.',
    significance: 'Вводит темы францисканской бедности, ереси и апокалиптического страха.',
    kinds: ['meeting', 'political'], locationId: 'church', characterIds: ['william', 'adso', 'ubertino'], clueIds: [], relatedEventIds: [],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-severinus-garden', title: 'Беседа с травником', day: 1, hour: 'nones', sequence: 130,
    description: 'Северин показывает Вильгельму сад и лечебницу. Они беседуют о травах — лечащих, дурманящих и опасных.',
    significance: 'Устанавливает союз Вильгельма и Северина и вводит тему ядов.',
    kinds: ['meeting'], locationId: 'herb-garden', characterIds: ['william', 'adso', 'severinus'], clueIds: [], relatedEventIds: [],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-scriptorium-laughter', title: 'Скрипторий и спор о смехе', day: 1, hour: 'nones', sequence: 140,
    description: 'Вильгельм осматривает скрипторий, знакомится с Малахией, Беренгаром, Венанцием, Бенцием. Над рисунками Адельма вспыхивает спор с Хорхе: подобает ли монаху смеяться.',
    significance: 'Главный идейный конфликт романа обозначен в первый же день. Смех окажется сердцевиной тайны.',
    kinds: ['library', 'meeting'], locationId: 'scriptorium', characterIds: ['william', 'adso', 'jorge', 'malachi', 'berengar', 'venantius', 'benno', 'aymaro'], clueIds: ['c-adelmo-margins'], relatedEventIds: ['e-benno-testimony'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-adelmo-reasoning', title: 'Где упал Адельм', day: 1, hour: 'vespers', sequence: 150,
    description: 'Обходя постройки, Вильгельм замечает, что окна Эдифиция над обрывом не открываются. Версия о падении из окна сомнительна; тело могло упасть с другого места и сползти вместе с осыпью.',
    significance: 'Первое сомнение в официальной версии.',
    kinds: ['clue'], locationId: 'aedificium', characterIds: ['william', 'adso'], clueIds: ['c-adelmo-fall'], relatedEventIds: ['e-adelmo-death'],
    revealDay: 0, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-nicholas-glass', title: 'Разговор со стекольщиком', day: 1, hour: 'vespers', sequence: 160,
    description: 'Николай Моримондский восхищается очками Вильгельма. Вильгельм рассказывает о стекле, линзах и о знании, которое помогает человеку, а не пугает его.',
    significance: 'Очки станут одной из самых уязвимых деталей расследования.',
    kinds: ['meeting'], locationId: 'workshops', characterIds: ['william', 'adso', 'nicholas'], clueIds: [], relatedEventIds: ['e-new-lenses'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-venantius-dies', title: 'Смерть Венанция', safeTitle: 'Ночь в Эдифиции', day: 1, hour: 'night', sequence: 190,
    description: 'Ночью Венанций читает спрятанную книгу в скриптории, чувствует недомогание, спускается вниз и умирает. Беренгар находит тело и, боясь разоблачения, выносит его к свинарнику.',
    significance: 'Механизм первой смерти от книги. Читатель узнаёт его только из итогового объяснения.',
    kinds: ['death'], locationId: 'kitchen', characterIds: ['venantius', 'berengar'], clueIds: ['c-snow-trail', 'c-black-fingers'], relatedEventIds: ['e-venantius-found'],
    revealDay: 7, critical: true, certainty: 'interpretation', sourceIds: ['novel', 'wiki-novel'],
  },

  // ───────────── День второй ─────────────
  {
    id: 'e-venantius-found', title: 'Венанций в сосуде с кровью', day: 2, hour: 'matins', sequence: 200,
    description: 'После утрени работники находят в сосуде со свиной кровью тело Венанция вниз головой. Аббатство в смятении: смерть явно связана с первой.',
    later: [
      { revealDay: 2, text: 'Вильгельм замечает на снегу след, тянущийся от Эдифиция: тело, похоже, принесли.', certainty: 'interpretation' },
      { revealDay: 7, critical: true, text: 'В сосуд тело бросил Беренгар; Венанций был уже мёртв от яда.', certainty: 'confirmed' },
    ],
    significance: 'Вторая смерть превращает несчастный случай в серию и заставляет думать о злом умысле.',
    kinds: ['death', 'discovery'], locationId: 'pigsty', characterIds: ['venantius', 'william', 'adso', 'abbo', 'severinus'], clueIds: ['c-snow-trail', 'c-black-fingers'], relatedEventIds: ['e-venantius-dies', 'e-venantius-exam'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-venantius-exam', title: 'Осмотр тела в лечебнице', day: 2, hour: 'unknown', sequence: 205,
    description: 'Северин обмывает тело. Ран нет, признаков борьбы нет. Вильгельм сомневается, что Венанций погиб в сосуде, и спрашивает травника о ядах.',
    significance: 'Возникает подозрение на яд.',
    kinds: ['clue'], locationId: 'hospital', characterIds: ['william', 'severinus', 'venantius'], clueIds: ['c-black-fingers'], relatedEventIds: ['e-venantius-found'],
    revealDay: 2, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-benno-testimony', title: 'Рассказ Бенция', day: 2, hour: 'prime', sequence: 210,
    description: 'Бенций рассказывает о споре в скриптории незадолго до смерти Адельма: о загадках, о смехе, о «пределе Африки». Он намекает на отношения Беренгара и Адельма.',
    significance: 'Впервые звучит название тайного места библиотеки.',
    kinds: ['clue', 'meeting'], locationId: 'cloister', characterIds: ['benno', 'william', 'adso'], clueIds: ['t-benno', 'c-finis-words'], relatedEventIds: ['e-scriptorium-laughter'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-berengar-ghost', title: 'Беренгар и «призрак» Адельма', day: 2, hour: 'prime', sequence: 215,
    description: 'Перепуганный Беренгар рассказывает, что в ночь гибели Адельма встретил его на кладбище: тот говорил, что проклят и видел ад.',
    significance: 'Свидетельство, которое объясняет душевное состояние Адельма и выдаёт страх самого Беренгара.',
    kinds: ['clue'], locationId: 'cemetery', characterIds: ['berengar', 'adelmo', 'william'], clueIds: ['t-berengar-ghost'], relatedEventIds: ['e-adelmo-death'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-alinardo-labyrinth', title: 'Речи Алинарда', day: 2, hour: 'unknown', sequence: 220,
    description: 'Старейший монах говорит о лабиринте, о прежних библиотекарях и о том, что его самого когда-то обошли.',
    significance: 'Первые намёки на скрытую историю власти над библиотекой.',
    kinds: ['meeting'], locationId: 'cloister', characterIds: ['alinardo', 'william', 'adso'], clueIds: ['t-alinardo'], relatedEventIds: ['e-nicholas-librarians'],
    revealDay: 2, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-night-scriptorium', title: 'Ночь в скриптории', day: 2, hour: 'night', sequence: 240,
    description: 'Пройдя ходом из оссуария, Вильгельм и Адсон проникают в Эдифиций. На столе Венанция — записи по-гречески и тайнопись знаками зодиака. Кто-то в темноте выхватывает книгу со стола и убегает. Пропадают очки Вильгельма.',
    later: [
      { revealDay: 7, critical: true, text: 'Книгу и очки унёс Беренгар.', certainty: 'confirmed' },
    ],
    significance: 'Главные материальные улики второй половины расследования появляются и тут же ускользают.',
    kinds: ['library', 'clue'], locationId: 'scriptorium', characterIds: ['william', 'adso'], clueIds: ['c-venantius-notes', 'c-stolen-book', 'c-stolen-lenses'], relatedEventIds: ['e-first-labyrinth', 'e-cipher-solved'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-first-labyrinth', title: 'Первое проникновение в лабиринт', day: 2, hour: 'night', sequence: 250,
    description: 'Поднявшись в библиотеку, следователи блуждают по комнатам без окон. Адсон пугается кривого зеркала и видений от дурманящего дыма. Выход удаётся найти с трудом.',
    significance: 'Библиотека защищена не только запретом, но и устройством самого пространства.',
    kinds: ['library'], locationId: 'library', characterIds: ['william', 'adso'], clueIds: ['c-library-defenses'], relatedEventIds: ['e-library-map'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },

  // ───────────── День третий ─────────────
  {
    id: 'e-berengar-missing', title: 'Беренгар исчез', day: 3, hour: 'unknown', sequence: 300,
    description: 'Беренгар не появляется на службах. В его келье находят окровавленную ткань.',
    later: [{ revealDay: 7, critical: true, text: 'К этому времени Беренгар уже прочитал книгу и был отравлен.', certainty: 'interpretation' }],
    significance: 'Главный подозреваемый исчезает.',
    kinds: ['discovery'], locationId: 'dormitory', characterIds: ['berengar', 'william', 'abbo'], clueIds: ['c-bloody-cloth'], relatedEventIds: ['e-berengar-found'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-dolcino-story', title: 'История Дольчино', day: 3, hour: 'unknown', sequence: 310,
    description: 'Сальватор, а затем Убертин рассказывают Адсону о бродячих еретиках и о Дольчино. Адсон понимает, что келарь и Сальватор связаны с этим прошлым.',
    significance: 'Даёт материал для будущего обвинения Бернарда Ги.',
    kinds: ['political', 'meeting'], locationId: 'church', characterIds: ['adso', 'salvatore', 'ubertino', 'remigio'], clueIds: ['c-dolcinian-past'], relatedEventIds: ['e-trial'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'dolcino'],
  },
  {
    id: 'e-new-lenses', title: 'Новые линзы', day: 3, hour: 'unknown', sequence: 320,
    description: 'Вильгельм с Николаем пытаются выточить новые стёкла взамен украденных.',
    significance: 'Без очков Вильгельм не может читать мелкие записи Венанция.',
    kinds: ['clue'], locationId: 'workshops', characterIds: ['william', 'nicholas'], clueIds: ['c-stolen-lenses'], relatedEventIds: ['e-nicholas-glass'],
    revealDay: 3, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-adso-girl', title: 'Адсон и девушка', day: 3, hour: 'night', sequence: 340,
    description: 'Возвращаясь через кухню, Адсон встречает девушку из деревни. Утром она исчезает, оставив свёрток. Адсон исповедуется Вильгельму.',
    significance: 'Личная история рассказчика, которая отзовётся на суде инквизитора.',
    kinds: ['meeting'], locationId: 'kitchen', characterIds: ['adso', 'girl'], clueIds: [], relatedEventIds: ['e-salvatore-arrest'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-berengar-dies', title: 'Смерть Беренгара', safeTitle: 'Ночь в купальне', day: 3, hour: 'night', sequence: 345,
    description: 'Отравленный страницами книги, Беренгар ищет облегчения в купальне и умирает в ванне.',
    significance: 'Вторая смерть от книги. Её обстоятельства восстанавливаются по телу и итоговому объяснению.',
    kinds: ['death'], locationId: 'balneary', characterIds: ['berengar'], clueIds: ['c-black-tongue'], relatedEventIds: ['e-berengar-found'],
    revealDay: 7, critical: true, certainty: 'interpretation', sourceIds: ['novel', 'wiki-novel'],
  },

  // ───────────── День четвёртый ─────────────
  {
    id: 'e-berengar-found', title: 'Тело в купальне', day: 4, hour: 'lauds', sequence: 400,
    description: 'Беренгара находят мёртвым в ванне купальни. У него почерневший язык и кончики пальцев, как у Венанция.',
    later: [{ revealDay: 4, text: 'Среди вещей Беренгара, по ряду пересказов, находятся и украденные очки Вильгельма.', certainty: 'uncertain' }],
    significance: 'Сходство признаков у двух мёртвых указывает на одну причину — яд.',
    kinds: ['death', 'discovery'], locationId: 'balneary', characterIds: ['berengar', 'william', 'adso', 'severinus'], clueIds: ['c-black-tongue', 'c-black-fingers'], relatedEventIds: ['e-berengar-dies', 'e-severinus-poison'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-severinus-poison', title: 'Пропавший яд', day: 4, hour: 'unknown', sequence: 410,
    description: 'Северин вспоминает, что когда-то из его лаборатории пропало сильнодействующее вещество, о котором знали немногие.',
    significance: 'Связывает смерти с конкретным источником яда.',
    kinds: ['clue'], locationId: 'hospital', characterIds: ['severinus', 'william'], clueIds: ['t-severinus-poison'], relatedEventIds: ['e-berengar-found'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-remigio-pressed', title: 'Прошлое келаря', day: 4, hour: 'unknown', sequence: 415,
    description: 'Сальватор признаётся, что приводит в аббатство деревенских девушек для келаря. Вильгельм даёт Ремигию понять, что знает о его прошлом среди дольчинистов.',
    significance: 'У следствия появляется человек с тайной — но не той, что нужна.',
    kinds: ['meeting', 'clue'], locationId: 'kitchen', characterIds: ['william', 'salvatore', 'remigio'], clueIds: ['c-dolcinian-past'], relatedEventIds: ['e-dolcino-story', 'e-trial'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-cipher-solved', title: 'Тайнопись Венанция', day: 4, hour: 'unknown', sequence: 420,
    description: 'Вильгельм расшифровывает запись знаками зодиака: речь о тайне «предела Африки» и о том, что нужно действовать рукой над идолом на первом и седьмом из четырёх. Греческие заметки проступают при нагреве.',
    significance: 'Становится ясно, что в Finis Africae ведёт механизм. Смысл «первого и седьмого из четырёх» пока не понятен.',
    kinds: ['clue', 'library'], locationId: 'scriptorium', characterIds: ['william', 'adso'], clueIds: ['c-venantius-notes'], relatedEventIds: ['e-night-scriptorium', 'e-quatuor-solved'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-alinardo-trumpets', title: 'Семь труб', day: 4, hour: 'unknown', sequence: 425,
    description: 'Алинард связывает смерти с трубами Апокалипсиса: град и огонь, кровь, вода. Вильгельм начинает проверять эту схему.',
    significance: 'Рождается ложная, но влиятельная версия.',
    kinds: ['clue'], locationId: 'cloister', characterIds: ['alinardo', 'william'], clueIds: ['t-alinardo'], relatedEventIds: [],
    revealDay: 4, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-legations-arrive', title: 'Прибытие посольств', day: 4, hour: 'unknown', sequence: 430,
    description: 'В аббатство въезжают францисканцы во главе с Михаилом Цезенским и папское посольство кардинала Бертрана дель Поджетто вместе с инквизитором Бернардом Ги.',
    significance: 'Расследование теперь идёт под взглядом инквизиции и политиков.',
    kinds: ['political', 'arrival'], locationId: 'gate', characterIds: ['michael', 'bertrand', 'bernard', 'jerome', 'abbo', 'william'], clueIds: [], relatedEventIds: ['e-disputation'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-library-map', title: 'План лабиринта', day: 4, hour: 'night', sequence: 440,
    description: 'Во второй вылазке Вильгельм методично наносит комнаты на план и понимает, что надписи складываются в названия стран. Одна комната отсутствует — замурованный «предел Африки». Вход в неё найти не удаётся.',
    significance: 'Лабиринт перестаёт быть хаосом и становится картой.',
    kinds: ['library', 'clue'], locationId: 'library', characterIds: ['william', 'adso'], clueIds: ['c-labyrinth-plan'], relatedEventIds: ['e-first-labyrinth', 'e-finis-africae'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-salvatore-arrest', title: 'Арест Сальватора и девушки', day: 4, hour: 'night', sequence: 450,
    description: 'Стража Бернарда Ги хватает Сальватора, пытавшегося с помощью чёрного петуха приворожить девушку. Девушку объявляют ведьмой.',
    significance: 'У инквизитора появляются готовые обвиняемые.',
    kinds: ['trial', 'political'], locationId: 'kitchen', characterIds: ['salvatore', 'girl', 'bernard', 'adso', 'william'], clueIds: [], relatedEventIds: ['e-trial'],
    revealDay: 4, certainty: 'interpretation', sourceIds: ['novel'],
  },

  // ───────────── День пятый ─────────────
  {
    id: 'e-disputation', title: 'Диспут о бедности', day: 5, hour: 'prime', sequence: 500,
    description: 'В капитулярном зале францисканцы и папские посланники спорят о том, владел ли Христос имуществом. Спор быстро переходит в обвинения; Вильгельм говорит о границах церковной власти.',
    significance: 'Политическая миссия Вильгельма проваливается: примирения нет.',
    kinds: ['political', 'meeting'], locationId: 'chapter-house', characterIds: ['william', 'michael', 'bertrand', 'bernard', 'jerome', 'ubertino', 'abbo'], clueIds: [], relatedEventIds: ['e-legations-arrive'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'cum-inter'],
  },
  {
    id: 'e-severinus-strange-book', title: '«Я нашёл странную книгу»', day: 5, hour: 'unknown', sequence: 510,
    description: 'Во время диспута Северин тихо сообщает Вильгельму, что нашёл у себя в лаборатории странную книгу. Вильгельм просит дождаться его.',
    significance: 'Книга впервые оказывается почти в руках следователя.',
    kinds: ['clue'], locationId: 'chapter-house', characterIds: ['severinus', 'william'], clueIds: ['c-strange-book'], relatedEventIds: ['e-severinus-killed'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-severinus-killed', title: 'Убийство Северина', day: 5, hour: 'unknown', sequence: 520,
    description: 'Придя в лабораторию, Вильгельм находит Северина мёртвым: голова разбита армиллярной сферой. В лаборатории схвачен келарь Ремигий. Книги нет.',
    later: [
      { revealDay: 5, text: 'Позже выясняется, что книгу унёс Бенций.', certainty: 'confirmed' },
      { revealDay: 7, critical: true, text: 'Убил Северина Малахия по наущению Хорхе.', certainty: 'confirmed' },
    ],
    significance: 'Единственное в серии прямое убийство человеческой рукой.',
    kinds: ['death', 'discovery'], locationId: 'hospital', characterIds: ['severinus', 'william', 'adso', 'remigio', 'bernard'], clueIds: ['c-armillary', 'c-strange-book'], relatedEventIds: ['e-severinus-strange-book', 'e-benno-book', 'e-trial'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'e-benno-book', title: 'Признание Бенция', day: 5, hour: 'unknown', sequence: 530,
    description: 'Бенций признаётся, что раньше Вильгельма забрал книгу из лечебницы, а потом отдал её Малахии, получив должность помощника библиотекаря.',
    significance: 'Книга снова уходит в руки библиотеки.',
    kinds: ['clue'], locationId: 'scriptorium', characterIds: ['benno', 'malachi', 'william'], clueIds: ['t-benno-book'], relatedEventIds: ['e-severinus-killed', 'e-malachi-death'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-trial', title: 'Суд Бернарда Ги', day: 5, hour: 'unknown', sequence: 540,
    description: 'Бернард судит келаря. Под угрозой пытки Ремигий признаётся в ереси и во всех смертях. Сальватор и девушка осуждены вместе с ним. Вильгельм бессилен.',
    significance: 'Официальная «разгадка» найдена — и она ложна.',
    kinds: ['trial', 'political'], locationId: 'chapter-house', characterIds: ['bernard', 'remigio', 'salvatore', 'girl', 'william', 'adso', 'bertrand', 'abbo'], clueIds: ['t-remigio-confession'], relatedEventIds: ['e-severinus-killed', 'e-salvatore-arrest'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'gui-practica'],
  },
  {
    id: 'e-ubertino-flees', title: 'Бегство Убертина', day: 5, hour: 'night', sequence: 550,
    description: 'Опасаясь ареста, Убертин тайно покидает аббатство.',
    significance: 'Фон политической угрозы, нависшей над францисканцами.',
    kinds: ['political'], locationId: 'gate', characterIds: ['ubertino', 'william'], clueIds: [], relatedEventIds: [],
    revealDay: 5, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-jorge-sermon', title: 'Проповедь Хорхе', day: 5, hour: 'compline', sequence: 560,
    description: 'Хорхе произносит проповедь о близости Антихриста, о гордыне знания и о том, что сохранять истину важнее, чем искать новое.',
    significance: 'Самое открытое изложение взглядов Хорхе.',
    kinds: ['meeting'], locationId: 'church', characterIds: ['jorge', 'william', 'adso'], clueIds: [], relatedEventIds: [],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },

  // ───────────── День шестой ─────────────
  {
    id: 'e-malachi-death', title: 'Смерть Малахии', day: 6, hour: 'matins', sequence: 600,
    description: 'На утрене Малахия падает на хорах. Умирая, он бормочет о скорпионах. Пальцы у него чёрные.',
    later: [{ revealDay: 7, critical: true, text: 'Малахия открыл книгу, хотя Хорхе предупреждал его не делать этого.', certainty: 'confirmed' }],
    significance: 'Смерть доказывает, что арест Ремигия ничего не решил.',
    kinds: ['death', 'discovery'], locationId: 'church', characterIds: ['malachi', 'william', 'adso', 'abbo', 'jorge'], clueIds: ['c-malachi-words', 'c-black-fingers'], relatedEventIds: ['e-benno-book', 'e-nicholas-librarians'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'e-nicholas-librarians', title: 'Сокровищница и хроника библиотекарей', day: 6, hour: 'unknown', sequence: 610,
    description: 'Николай, ставший келарем, показывает реликвии и рассказывает, как сменялись библиотекари. Неожиданные назначения указывают на чьё-то давнее влияние.',
    significance: 'Первая прямая нить к тайному хозяину библиотеки.',
    kinds: ['clue'], locationId: 'church', characterIds: ['nicholas', 'william', 'adso'], clueIds: ['c-librarian-succession'], relatedEventIds: ['e-catalogue'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-adso-dream', title: 'Сон Адсона', day: 6, hour: 'unknown', sequence: 620,
    description: 'Адсону снится пир, на котором библейские персонажи ведут себя как в шутовском представлении. Вильгельм узнаёт в сне «Киприанов пир».',
    significance: 'Сон подсказывает, что тайная книга связана со смехом и пародией.',
    kinds: ['clue'], locationId: 'church', characterIds: ['adso', 'william'], clueIds: ['c-coena-dream'], relatedEventIds: ['e-catalogue'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'coena'],
  },
  {
    id: 'e-catalogue', title: 'Каталог библиотеки', day: 6, hour: 'unknown', sequence: 630,
    description: 'Вильгельм изучает каталог: в одной записи собраны несколько текстов на разных языках, в том числе загадочный греческий. Почерки записей показывают, кто на деле вёл библиотеку.',
    significance: 'Книга и её хранитель вычислены по документам.',
    kinds: ['clue', 'library'], locationId: 'scriptorium', characterIds: ['william', 'adso'], clueIds: ['c-catalogue'], relatedEventIds: ['e-nicholas-librarians', 'e-adso-dream'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbot-dismisses', title: 'Аббат отстраняет Вильгельма', day: 6, hour: 'vespers', sequence: 640,
    description: 'Аббат требует, чтобы Вильгельм наутро покинул аббатство: дальше он разберётся сам.',
    significance: 'У следствия остаётся одна ночь.',
    kinds: ['meeting'], locationId: 'abbots-house', characterIds: ['abbo', 'william'], clueIds: [], relatedEventIds: ['e-abbot-trapped'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-quatuor-solved', title: '«Первое и седьмое из четырёх»', day: 6, hour: 'night', sequence: 650,
    description: 'Случайная фраза Адсона наводит Вильгельма на мысль: «четыре» — это слово надписи над зеркалом, и нажимать надо на его первую и седьмую буквы.',
    significance: 'Ключ к механизму Finis Africae найден.',
    kinds: ['clue', 'library'], locationId: 'mirror-room', characterIds: ['william', 'adso'], clueIds: ['c-quatuor'], relatedEventIds: ['e-cipher-solved', 'e-finis-africae'],
    revealDay: 6, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbot-trapped', title: 'Аббат в ловушке', safeTitle: 'Исчезновение аббата', day: 6, hour: 'night', sequence: 655,
    description: 'Аббат отправляется к тайному ходу, ведущему к Finis Africae. Хорхе приводит механизм в действие и запирает его в узком проходе.',
    significance: 'Седьмая «труба», по замыслу Хорхе.',
    kinds: ['death'], locationId: 'finis-africae', characterIds: ['abbo', 'jorge'], clueIds: [], relatedEventIds: ['e-abbot-dismisses', 'e-finis-africae'],
    revealDay: 7, critical: true, certainty: 'interpretation', sourceIds: ['novel', 'wiki-novel'],
  },

  // ───────────── День седьмой ─────────────
  {
    id: 'e-finis-africae', title: 'В Finis Africae', day: 7, hour: 'night', sequence: 700,
    description: 'Вильгельм и Адсон открывают проход за зеркалом. В замурованной комнате их ждёт Хорхе. Он даёт Вильгельму книгу — вторую книгу «Поэтики» Аристотеля о комедии. Вильгельм читает её в перчатках.',
    significance: 'Встреча двух представлений о знании: открыть его или охранять.',
    kinds: ['finale', 'library'], locationId: 'finis-africae', characterIds: ['william', 'adso', 'jorge'], clueIds: ['c-poetics'], relatedEventIds: ['e-jorge-confession', 'e-quatuor-solved'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'e-jorge-confession', title: 'Объяснение Хорхе', day: 7, hour: 'night', sequence: 710,
    description: 'Хорхе подтверждает: он отравил страницы, держал Малахию в повиновении, подтолкнул его к убийству Северина и запер аббата. Апокалиптический порядок смертей был случайностью, а затем стал игрой, которую он принял.',
    significance: 'Итоговая разгадка всех смертей.',
    kinds: ['finale'], locationId: 'finis-africae', characterIds: ['jorge', 'william', 'adso', 'malachi', 'severinus', 'abbo'], clueIds: ['c-poetics'], relatedEventIds: ['e-finis-africae', 'e-fire'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'e-fire', title: 'Пожар в библиотеке', day: 7, hour: 'night', sequence: 720,
    description: 'Хорхе рвёт и ест отравленные страницы. В борьбе опрокидывается светильник, огонь охватывает книги. Хорхе погибает; Вильгельм и Адсон спасаются.',
    significance: 'Тайна уничтожена вместе с библиотекой.',
    kinds: ['finale', 'death'], locationId: 'library', characterIds: ['jorge', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-jorge-confession', 'e-abbey-burns'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbey-burns', title: 'Аббатство в огне', day: 7, hour: 'unknown', sequence: 730,
    description: 'Монахи не могут погасить огонь. Пожар перекидывается на церковь и постройки и горит несколько дней. Вильгельм и Адсон уходят.',
    significance: 'Конец аббатства как мира.',
    kinds: ['finale'], locationId: 'aedificium', characterIds: ['william', 'adso', 'nicholas'], clueIds: [], relatedEventIds: ['e-fire'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },

  // ───────────── Эпилог ─────────────
  {
    id: 'e-epilogue', title: 'Последний лист', day: 8, hour: 'unknown', sequence: 800,
    description: 'Спустя годы Адсон возвращается к руинам, собирает обрывки пергамента и из этих осколков составляет свою «меньшую библиотеку». Вильгельм к тому времени умер во время чумы.',
    significance: 'Роман заканчивается размышлением о том, что от вещей остаются только имена.',
    kinds: ['epilogue'], locationId: 'aedificium', characterIds: ['adso', 'william'], clueIds: [], relatedEventIds: ['e-abbey-burns'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },
];

export const eventById = new Map(events.map((e) => [e.id, e]));
export const eventsSorted = [...events].sort((a, b) => a.sequence - b.sequence);
