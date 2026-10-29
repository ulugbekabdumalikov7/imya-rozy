import type { StoryEvent } from './types';

/**
 * События романа. Канонические часы указаны там, где роман привязывает эпизод к главе-часу
 * (заголовки глав сверены по пересказам глав, см. AUDIT.md); если час неизвестен,
 * источники расходятся или эпизод растянут, используется 'unknown'.
 * Главы «после повечерия» и «ночь» обе обозначены часом 'night'.
 *
 * characterIds — только те, кто физически присутствует в эпизоде (на этом строится
 * слой «Здесь бывали» на карте). Упомянутые, но отсутствующие герои сюда не входят.
 * locationId — место, где эпизод происходит; если роман (по доступным пересказам) его не называет,
 * поле не заполняется, и эпизод не отмечается на карте.
 *
 * День 0 — предыстория (до прибытия), день 8 — эпилог.
 */
export const events: StoryEvent[] = [
  // ───────────── Предыстория ─────────────
  {
    id: 'e-adelmo-bargain', title: 'Сделка Адельма и Беренгара', day: 0, hour: 'unknown', sequence: 10,
    description: 'Незадолго до приезда Вильгельма Адельм соглашается на постыдную сделку с Беренгаром: близость в обмен на доступ к запретной книге. Потом он исповедуется Хорхе и рассказывает о книге Венанцию.',
    significance: 'Отсюда начинается цепь событий: стыд, исповедь и отчаяние Адельма, а через него знание о книге доходит до Венанция.',
    kinds: ['library'], characterIds: ['adelmo', 'berengar'], clueIds: ['t-benno-tale', 't-berengar-ghost'], relatedEventIds: ['e-adelmo-death', 'e-benno-tale'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel', 'litcharts'],
  },
  {
    id: 'e-adelmo-death', title: 'Гибель Адельма', day: 0, hour: 'night', sequence: 20,
    description: 'Перед метелью Адельм погибает. Тело находят в обрыве под Эдифицием, между северной и восточной башнями, под снегом и осыпью. Аббат не знает, упал ли он, бросился сам или его выбросили из окна.',
    later: [
      { revealDay: 2, text: 'Беренгар рассказывает, что в ту ночь видел Адельма на кладбище: тот говорил, что проклят.', certainty: 'confirmed' },
      { revealDay: 2, text: 'Вильгельм заключает: Адельм ушёл с кладбища к ограде за конюшнями и бросился в обрыв ещё до бури; осыпь потом принесла тело к подножию Эдифиция. Это не убийство.', certainty: 'interpretation' },
    ],
    significance: 'Смерть, с которой начинается расследование. Её истинный характер становится ясен уже на второй день.',
    kinds: ['death'], locationId: 'ravine', characterIds: ['adelmo'], clueIds: ['c-adelmo-fall', 't-berengar-ghost'], relatedEventIds: ['e-adelmo-bargain', 'e-abbot-commission'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel', 'nusquamia'],
  },

  // ───────────── День первый ─────────────
  {
    id: 'e-arrival', title: 'Прибытие и конь аббата', day: 1, hour: 'prime', sequence: 100,
    description: 'Поднимаясь к аббатству, Вильгельм встречает келаря с братией, ищущих сбежавшего коня. Не видев животного, он описывает его и указывает, куда тот побежал.',
    significance: 'Первая демонстрация метода: следы на снегу и сломанные ветки — это знаки, которые можно прочитать.',
    kinds: ['arrival', 'clue'], locationId: 'gate', characterIds: ['william', 'adso', 'remigio'], clueIds: ['c-brunellus'], relatedEventIds: ['e-abbot-commission'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbot-commission', title: 'Поручение аббата', day: 1, hour: 'terce', sequence: 110,
    description: 'Аббон приходит к Вильгельму в келью странноприимного дома; Адсон слышит разговор из соседней каморки. Аббат рассказывает о смерти Адельма и просит разобраться до прибытия посольств. Ходить и расспрашивать можно всех, но в библиотеку подниматься нельзя.',
    significance: 'Задаёт условия расследования: искать можно везде, кроме главного места.',
    kinds: ['meeting'], locationId: 'pilgrims-house', characterIds: ['abbo', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-adelmo-death', 'e-arrival'],
    revealDay: 0, certainty: 'interpretation', sourceIds: ['novel', 'wordsandpeace', 'coursehero'],
  },
  {
    id: 'e-ubertino-church', title: 'Портал церкви и Убертин', day: 1, hour: 'sext', sequence: 120,
    description: 'Адсон потрясён резным порталом с видением Апокалипсиса. Ему впервые попадается Сальватор, говорящий на смеси языков. В церкви Вильгельм встречает старого друга Убертина Казальского.',
    significance: 'Вводит темы францисканской бедности, ереси и апокалиптического страха.',
    kinds: ['meeting', 'political'], locationId: 'church', characterIds: ['william', 'adso', 'ubertino', 'salvatore'], clueIds: [], relatedEventIds: [],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel', 'coursehero'],
  },
  {
    id: 'e-severinus-garden', title: 'Беседа с травником', day: 1, hour: 'nones', sequence: 130,
    description: 'Северин показывает Вильгельму сад. Они беседуют о травах — лечащих, дурманящих и опасных.',
    significance: 'Устанавливает союз Вильгельма и Северина и вводит тему ядов.',
    kinds: ['meeting'], locationId: 'herb-garden', characterIds: ['william', 'adso', 'severinus'], clueIds: [], relatedEventIds: [],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-scriptorium-laughter', title: 'Скрипторий и спор о смехе', day: 1, hour: 'nones', sequence: 140,
    description: 'Вильгельм осматривает скрипторий, знакомится с Малахией, Беренгаром, Венанцием и другими монахами. Над рисунками Адельма вспыхивает спор с Хорхе: подобает ли монаху смеяться.',
    significance: 'Главный идейный конфликт романа обозначен в первый же день. Смех окажется сердцевиной тайны.',
    kinds: ['library', 'meeting'], locationId: 'scriptorium', characterIds: ['william', 'adso', 'jorge', 'malachi', 'berengar', 'venantius', 'benno', 'aymaro'], clueIds: ['c-adelmo-margins'], relatedEventIds: ['e-benno-testimony'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-adelmo-reasoning', title: 'Где упал Адельм', day: 1, hour: 'vespers', sequence: 150,
    description: 'Обходя постройки, Вильгельм приходит к первым выводам о смерти Адельма: чтобы выбросить тело из окна Эдифиция, убийце пришлось бы поднять его наверх и открыть окно. Проще предположить, что Адельм бросился сам.',
    significance: 'Первое сомнение в версии об убийстве; принцип простейшего объяснения.',
    kinds: ['clue'], locationId: 'aedificium', characterIds: ['william', 'adso'], clueIds: ['c-adelmo-fall'], relatedEventIds: ['e-adelmo-death'],
    revealDay: 0, certainty: 'interpretation', sourceIds: ['novel', 'litcharts', 'nusquamia'],
  },
  {
    id: 'e-nicholas-glass', title: 'Разговор со стекольщиком', day: 1, hour: 'vespers', sequence: 160,
    description: 'Николай Моримондский восхищается очками Вильгельма. Вильгельм рассказывает о стекле, линзах и о знании, которое помогает человеку, а не пугает его.',
    significance: 'Очки станут одной из самых уязвимых деталей расследования.',
    kinds: ['meeting'], locationId: 'workshops', characterIds: ['william', 'adso', 'nicholas'], clueIds: [], relatedEventIds: ['e-new-lenses'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbot-dinner', title: 'Ужин у аббата', day: 1, hour: 'compline', sequence: 170,
    description: 'В трапезной Вильгельм ужинает за столом аббата вместе с Малахией, Хорхе и Алинардом. Хорхе снова говорит, что Христос не смеялся, и предостерегает, что последние дни нельзя тратить на смех. Ночью Адсон видит свет на верхнем этаже Эдифиция.',
    significance: 'Иерархия общины видна по месту за столом; спор о смехе продолжается.',
    kinds: ['meeting'], locationId: 'refectory', characterIds: ['abbo', 'william', 'adso', 'malachi', 'jorge', 'alinardo'], clueIds: [], relatedEventIds: ['e-scriptorium-laughter'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel', 'wordsandpeace', 'litcharts'],
  },
  {
    id: 'e-venantius-dies', title: 'Смерть Венанция', safeTitle: 'Ночь в Эдифиции', day: 1, hour: 'night', sequence: 190,
    description: 'Ночью Венанций читает спрятанную книгу, чувствует недомогание, спускается в кухню и умирает. Беренгар находит тело и, боясь разоблачения, выносит его к свинарнику.',
    significance: 'Механизм первой смерти от книги. Читатель узнаёт его только из итогового объяснения.',
    kinds: ['death'], locationId: 'kitchen', characterIds: ['venantius', 'berengar'], clueIds: ['c-snow-trail', 'c-black-fingers', 't-remigio-kitchen'], relatedEventIds: ['e-venantius-found', 'e-remigio-pressed'],
    revealDay: 7, critical: true, certainty: 'interpretation', sourceIds: ['novel', 'wiki-novel'],
  },

  // ───────────── День второй ─────────────
  {
    id: 'e-venantius-found', title: 'Венанций в сосуде с кровью', day: 2, hour: 'matins', sequence: 200,
    description: 'После утрени в сосуде со свиной кровью находят тело Венанция вниз головой. Аббатство в смятении: смерть явно связана с первой.',
    later: [
      { revealDay: 2, text: 'Вильгельм читает следы на снегу: тело, похоже, волокли от Эдифиция.', certainty: 'interpretation' },
      { revealDay: 7, critical: true, text: 'В сосуд тело бросил Беренгар; Венанций был уже мёртв от яда.', certainty: 'confirmed' },
    ],
    significance: 'Вторая смерть превращает несчастный случай в серию и заставляет думать о злом умысле.',
    kinds: ['death', 'discovery'], locationId: 'pigsty', characterIds: ['venantius', 'william', 'adso', 'abbo', 'severinus'], clueIds: ['c-snow-trail', 'c-black-fingers'], relatedEventIds: ['e-venantius-dies', 'e-venantius-exam'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-venantius-exam', title: 'Осмотр тела', day: 2, hour: 'unknown', sequence: 205,
    description: 'Северин осматривает тело. Лицо не отёкшее, как у утопленника: Венанций был мёртв до того, как попал в сосуд. Северин признаёт, что в лечебнице хранятся вещества, способные убить.',
    significance: 'Возникает подозрение на яд.',
    kinds: ['clue'], characterIds: ['william', 'adso', 'severinus', 'venantius'], clueIds: ['c-black-fingers'], relatedEventIds: ['e-venantius-found'],
    revealDay: 2, certainty: 'interpretation', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-benno-testimony', title: 'Рассказ Бенция', day: 2, hour: 'prime', sequence: 210,
    description: 'Бенций рассказывает о споре в скриптории незадолго до смерти Адельма: Венанций ссылался на книгу Аристотеля о комедии, говорили о загадках, Беренгар пошутил про «африканцев», а потом Венанций и Адельм расспрашивали его о книге с пометкой «finis Africae».',
    significance: 'Впервые звучит название тайного места библиотеки.',
    kinds: ['clue', 'meeting'], characterIds: ['benno', 'william', 'adso'], clueIds: ['t-benno', 'c-finis-words'], relatedEventIds: ['e-scriptorium-laughter', 'e-benno-tale'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-berengar-ghost', title: 'Беренгар и «призрак» Адельма', day: 2, hour: 'prime', sequence: 215,
    description: 'Перепуганный Беренгар рассказывает, что в ночь гибели Адельма встретил его на кладбище: тот говорил, что проклят, и капля его пота обожгла Беренгару руку. Вильгельм объясняет: это был живой Адельм, возвращавшийся с исповеди со свечой.',
    significance: 'Свидетельство, которое объясняет душевное состояние Адельма и выдаёт страх самого Беренгара.',
    kinds: ['clue'], characterIds: ['berengar', 'william', 'adso'], clueIds: ['t-berengar-ghost'], relatedEventIds: ['e-adelmo-death'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-aymaro-allusions', title: 'Ссора и намёки Аймаро', day: 2, hour: 'terce', sequence: 217,
    description: 'Сальватор и Ремигий бранятся, обвиняя друг друга в ереси. Аймаро намекает на связь Беренгара и Адельма и жалуется, что аббатством заправляют иностранцы.',
    significance: 'Обнажается раскол общины и тайны, о которых шепчутся монахи.',
    kinds: ['meeting'], characterIds: ['aymaro', 'salvatore', 'remigio', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-benno-tale'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-benno-tale', title: 'Бенций о сделке', day: 2, hour: 'sext', sequence: 219,
    description: 'Бенций рассказывает всё: Адельм согласился на близость с Беренгаром в обмен на доступ к запретной книге, затем исповедался Хорхе, рассказал о книге Венанцию и ушёл на кладбище.',
    significance: 'Причина отчаяния Адельма становится известна.',
    kinds: ['clue'], characterIds: ['benno', 'william', 'adso'], clueIds: ['t-benno-tale'], relatedEventIds: ['e-adelmo-bargain', 'e-benno-testimony'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-abbot-treasure', title: 'Сокровища и страх аббата', day: 2, hour: 'nones', sequence: 225,
    description: 'Аббат показывает богатства аббатства и говорит о предстоящей встрече. Он боится, что посланники папы свяжут смерти с францисканцами, и признаёт, что в обители укрываются бывшие минориты — в том числе Ремигий.',
    significance: 'Первый намёк на прошлое келаря.',
    kinds: ['meeting', 'political'], locationId: 'church', characterIds: ['abbo', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-dolcino-story'],
    revealDay: 2, certainty: 'interpretation', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-alinardo-labyrinth', title: 'Речи Алинарда', day: 2, hour: 'unknown', sequence: 230,
    description: 'Старейший монах называет библиотеку лабиринтом, видит в смертях знаки близкого Апокалипсиса и подсказывает тайный вход в Эдифиций через оссуарий: четвёртый череп справа, нажать на глазницы.',
    significance: 'Следователи узнают, как ночью попасть в запертое здание.',
    kinds: ['meeting'], characterIds: ['alinardo', 'william', 'adso'], clueIds: ['t-alinardo'], relatedEventIds: ['e-night-scriptorium'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-night-scriptorium', title: 'Ночь в скриптории', day: 2, hour: 'night', sequence: 240,
    description: 'Ходом из оссуария Вильгельм и Адсон проникают в Эдифиций и слышат, что внутри есть кто-то ещё. На столе Венанция — заметки по-гречески; у пламени на пергаменте проступает тайнопись знаками зодиака. Кто-то в темноте выхватывает книгу со стола и убегает. Пропадают и очки Вильгельма.',
    later: [
      { revealDay: 4, text: 'Очки потом найдут в одежде Беренгара.', certainty: 'confirmed' },
      { revealDay: 7, critical: true, text: 'Книгу тоже унёс Беренгар.', certainty: 'confirmed' },
    ],
    significance: 'Главные материальные улики второй половины расследования появляются и тут же ускользают.',
    kinds: ['library', 'clue'], locationId: 'scriptorium', characterIds: ['william', 'adso'], clueIds: ['c-venantius-notes', 'c-stolen-book', 'c-stolen-lenses'], relatedEventIds: ['e-first-labyrinth', 'e-cipher-solved'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-first-labyrinth', title: 'Первое проникновение в лабиринт', day: 2, hour: 'night', sequence: 250,
    description: 'Поднявшись в библиотеку, следователи блуждают по комнатам без окон. Адсон пугается кривого зеркала (надпись над ним — «Super thronos viginti quatuor») и видений от трав. Выход удаётся найти лишь через несколько часов.',
    significance: 'Библиотека защищена не только запретом, но и устройством самого пространства.',
    kinds: ['library'], locationId: 'library', characterIds: ['william', 'adso'], clueIds: ['c-library-defenses'], relatedEventIds: ['e-library-map'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },

  // ───────────── День третий ─────────────
  {
    id: 'e-berengar-missing', title: 'Беренгар исчез', day: 3, hour: 'lauds', sequence: 300,
    description: 'Беренгар не появляется на службе. Монахи ищут его напрасно; под его ложем в келье находят окровавленную ткань.',
    later: [{ revealDay: 7, critical: true, text: 'К этому времени Беренгар уже прочитал книгу и был отравлен.', certainty: 'interpretation' }],
    significance: 'Главный подозреваемый исчезает.',
    kinds: ['discovery'], locationId: 'dormitory', characterIds: ['william', 'adso', 'abbo'], clueIds: ['c-bloody-cloth'], relatedEventIds: ['e-berengar-found'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'litcharts', 'supersummary'],
  },
  {
    id: 'e-new-lenses', title: 'Новые линзы', day: 3, hour: 'unknown', sequence: 305,
    description: 'Вильгельм просит Николая изготовить новые стёкла взамен украденных.',
    significance: 'Без очков Вильгельм не может читать мелкие записи Венанция.',
    kinds: ['clue'], locationId: 'workshops', characterIds: ['william', 'nicholas'], clueIds: ['c-stolen-lenses'], relatedEventIds: ['e-nicholas-glass', 'e-lenses-returned'],
    revealDay: 3, certainty: 'interpretation', sourceIds: ['novel', 'supersummary'],
  },
  {
    id: 'e-salvatore-story', title: 'Рассказ Сальватора', day: 3, hour: 'unknown', sequence: 310,
    description: 'Сальватор рассказывает Адсону о своих скитаниях с бродягами и сектантами. На вопрос о Дольчино он раздражается и уходит.',
    significance: 'Адсон начинает догадываться, что келарь и Сальватор связаны с прошлым дольчинистов.',
    kinds: ['meeting'], locationId: 'kitchen', characterIds: ['adso', 'salvatore'], clueIds: ['c-dolcinian-past'], relatedEventIds: ['e-dolcino-story'],
    revealDay: 3, certainty: 'interpretation', sourceIds: ['novel', 'supersummary', 'litcharts'],
  },
  {
    id: 'e-cipher-solved', title: 'Тайнопись Венанция', day: 3, hour: 'unknown', sequence: 315,
    description: 'Объясняя Адсону природу ереси, Вильгельм между делом рассказывает, как разгадал тайнопись знаками зодиака: «Secretum finis Africae manus supra idolum age primum et septimum de quatuor» — тайна предела Африки: рука над идолом действует на первое и седьмое из четырёх.',
    significance: 'Становится ясно, что в Finis Africae ведёт механизм. Смысл «первого и седьмого из четырёх» пока не понятен.',
    kinds: ['clue', 'library'], characterIds: ['william', 'adso'], clueIds: ['c-venantius-notes'], relatedEventIds: ['e-night-scriptorium', 'e-greek-notes', 'e-quatuor-solved'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'litcharts', 'supersummary'],
  },
  {
    id: 'e-dolcino-story', title: 'История Дольчино', day: 3, hour: 'night', sequence: 330,
    description: 'После повечерия Убертин рассказывает Адсону историю апостольских братьев и Дольчино. Адсон понимает, что келарь и Сальватор связаны с этим прошлым.',
    significance: 'Даёт материал для будущего обвинения Бернарда Ги.',
    kinds: ['political', 'meeting'], locationId: 'church', characterIds: ['adso', 'ubertino'], clueIds: ['c-dolcinian-past'], relatedEventIds: ['e-salvatore-story', 'e-trial'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'dolcino', 'supersummary'],
  },
  {
    id: 'e-adso-girl', title: 'Адсон и девушка', day: 3, hour: 'night', sequence: 340,
    description: 'Взволнованный, Адсон один поднимается в библиотеку, а возвращаясь через кухню, встречает девушку из деревни. Очнувшись, он видит, что она исчезла, оставив свёрток с огромным вырезанным сердцем животного, и теряет сознание. Той же ночью он исповедуется Вильгельму.',
    significance: 'Личная история рассказчика, которая отзовётся на суде инквизитора.',
    kinds: ['meeting'], locationId: 'kitchen', characterIds: ['adso', 'girl'], clueIds: [], relatedEventIds: ['e-salvatore-arrest', 'e-berengar-found'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'litcharts', 'supersummary'],
  },
  {
    id: 'e-berengar-dies', title: 'Смерть Беренгара', safeTitle: 'Ночь в купальне', day: 3, hour: 'night', sequence: 345,
    description: 'Отравленный страницами книги, Беренгар ищет облегчения в купальне и умирает в ванне.',
    significance: 'Вторая смерть от книги. Её обстоятельства восстанавливаются по телу и итоговому объяснению.',
    kinds: ['death'], locationId: 'balneary', characterIds: ['berengar'], clueIds: ['c-black-tongue'], relatedEventIds: ['e-berengar-found'],
    revealDay: 7, critical: true, certainty: 'interpretation', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'e-berengar-found', title: 'Тело в купальне', day: 3, hour: 'night', sequence: 347,
    description: 'После исповеди Адсона Вильгельм решает, что следующую смерть надо искать у воды. В купальне они находят Беренгара утонувшим в ванне.',
    significance: 'Пропавший подозреваемый — третья жертва.',
    kinds: ['death', 'discovery'], locationId: 'balneary', characterIds: ['berengar', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-berengar-dies', 'e-severinus-poison'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'litcharts', 'supersummary'],
  },

  // ───────────── День четвёртый ─────────────
  {
    id: 'e-severinus-poison', title: 'Чёрный язык и пропавший яд', day: 4, hour: 'lauds', sequence: 400,
    description: 'Вильгельм и Северин осматривают тело Беренгара: язык и кончики пальцев почернели, как у Венанция, — для утопленника это странно. Северин вспоминает, что когда-то, после взлома в бурю, из лечебницы пропал сильнодействующий яд.',
    significance: 'Сходство признаков у двух мёртвых указывает на одну причину — яд — и на давно задуманное злодеяние.',
    kinds: ['clue'], characterIds: ['severinus', 'william', 'adso', 'berengar'], clueIds: ['c-black-tongue', 'c-black-fingers', 't-severinus-poison'], relatedEventIds: ['e-berengar-found'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel', 'wordsandpeace', 'litcharts'],
  },
  {
    id: 'e-remigio-pressed', title: 'Признания Сальватора и келаря', day: 4, hour: 'prime', sequence: 410,
    description: 'Сальватор признаётся, что приводит в аббатство деревенских девушек для келаря. Ремигий признаёт это и своё прошлое среди дольчинистов и рассказывает, что в ночь смерти Венанция видел его тело в кухне рядом с разбитой чашей и ушёл, промолчав. Он говорит, что обязан Малахии.',
    significance: 'У следствия появляется человек с тайной — но не той, что нужна; становится известно, что Венанций лежал мёртвым в кухне.',
    kinds: ['meeting', 'clue'], characterIds: ['william', 'adso', 'salvatore', 'remigio'], clueIds: ['c-dolcinian-past', 't-remigio-kitchen'], relatedEventIds: ['e-dolcino-story', 'e-trial', 'e-venantius-dies'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel', 'wordsandpeace', 'litcharts'],
  },
  {
    id: 'e-lenses-returned', title: 'Шесть глаз', day: 4, hour: 'prime', sequence: 412,
    description: 'Северин находит украденные очки Вильгельма в одежде Беренгара и возвращает их; тут же Николай приносит новые линзы.',
    significance: 'Очки крал Беренгар. С двумя парами стёкол Вильгельм может читать записи Венанция.',
    kinds: ['clue'], characterIds: ['severinus', 'nicholas', 'william', 'adso'], clueIds: ['c-stolen-lenses'], relatedEventIds: ['e-new-lenses', 'e-greek-notes'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel', 'wordsandpeace', 'litcharts'],
  },
  {
    id: 'e-greek-notes', title: 'Греческие заметки', day: 4, hour: 'terce', sequence: 420,
    description: 'Вильгельм читает греческие заметки Венанция. Слова понятны, но смысла не складывают: похоже, это выписки, сделанные при чтении другой книги.',
    significance: 'Расшифрованное остаётся непонятным, но указывает на книгу, которую читал Венанций.',
    kinds: ['clue', 'library'], characterIds: ['william', 'adso'], clueIds: ['c-venantius-notes'], relatedEventIds: ['e-cipher-solved', 'e-lenses-returned'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel', 'wordsandpeace', 'litcharts'],
  },
  {
    id: 'e-minorites-arrive', title: 'Прибытие миноритов', day: 4, hour: 'sext', sequence: 425,
    description: 'Отправившись с Северином за трюфелями, Адсон видит подъезжающих францисканцев. Михаил Цезенский, Иероним Каффский и другие долго совещаются с Вильгельмом и Убертином; о папе Иоанне XXII говорят горькие вещи.',
    significance: 'Францисканская сторона встречи на месте.',
    kinds: ['political', 'arrival'], locationId: 'gate', characterIds: ['michael', 'jerome', 'william', 'ubertino', 'adso', 'severinus'], clueIds: [], relatedEventIds: ['e-legations-arrive', 'e-disputation'],
    revealDay: 4, certainty: 'interpretation', sourceIds: ['novel', 'wordsandpeace', 'litcharts'],
  },
  {
    id: 'e-legations-arrive', title: 'Прибытие папского посольства', day: 4, hour: 'nones', sequence: 430,
    description: 'Прибывают кардинал Бертран дель Поджетто, Бернард Ги и другие люди из Авиньона. Бернард уже знает о смертях и сразу начинает допрашивать работников.',
    significance: 'Расследование теперь идёт под взглядом инквизиции и политиков.',
    kinds: ['political', 'arrival'], locationId: 'gate', characterIds: ['bertrand', 'bernard', 'abbo', 'william'], clueIds: [], relatedEventIds: ['e-minorites-arrive', 'e-disputation'],
    revealDay: 4, certainty: 'interpretation', sourceIds: ['novel', 'wordsandpeace'],
  },
  {
    id: 'e-alinardo-trumpets', title: 'Семь труб', day: 4, hour: 'vespers', sequence: 435,
    description: 'Алинард утверждает, что смерти следуют Апокалипсису, и намекает на следующую — по четвёртой трубе. Он жалуется, что библиотекарем когда-то выбрали чужеземца, а не его. Вильгельм объясняет Адсону свой метод: приходить к вероятной истине через ряд ошибок.',
    significance: 'Ложная, но влиятельная версия становится рабочей.',
    kinds: ['clue'], characterIds: ['alinardo', 'william', 'adso'], clueIds: ['t-alinardo'], relatedEventIds: ['e-alinardo-labyrinth'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel', 'wordsandpeace', 'litcharts'],
  },
  {
    id: 'e-library-map', title: 'План лабиринта', day: 4, hour: 'night', sequence: 440,
    description: 'Во второй вылазке Вильгельм методично наносит комнаты на план и понимает, что надписи складываются в названия стран. Одна семиугольная комната в южной башне недоступна — замурованный «предел Африки»; «идол» из тайнописи — зеркало. Вход открыть не удаётся: неизвестно, что такое «первое и седьмое из четырёх».',
    significance: 'Лабиринт перестаёт быть хаосом и становится картой.',
    kinds: ['library', 'clue'], locationId: 'library', characterIds: ['william', 'adso'], clueIds: ['c-labyrinth-plan'], relatedEventIds: ['e-first-labyrinth', 'e-finis-africae'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel', 'wordsandpeace', 'litcharts'],
  },
  {
    id: 'e-salvatore-arrest', title: 'Арест Сальватора и девушки', day: 4, hour: 'night', sequence: 450,
    description: 'Лучники Бернарда Ги хватают у трапезной Сальватора, пытавшегося колдовством добиться любви девушки, и саму девушку. Её объявляют ведьмой; обоих запирают в кельях при кузнице.',
    significance: 'У инквизитора появляются готовые обвиняемые.',
    kinds: ['trial', 'political'], locationId: 'refectory', characterIds: ['salvatore', 'girl', 'bernard', 'adso', 'william'], clueIds: [], relatedEventIds: ['e-trial'],
    revealDay: 4, certainty: 'interpretation', sourceIds: ['novel', 'wordsandpeace', 'litcharts'],
  },

  // ───────────── День пятый ─────────────
  {
    id: 'e-disputation', title: 'Диспут о бедности', day: 5, hour: 'prime', sequence: 500,
    description: 'В капитулярной зале францисканцы и папские посланники спорят о том, владел ли Христос имуществом. Спор быстро переходит в обвинения; в третьем часу Вильгельм говорит о границах церковной власти.',
    significance: 'Политическая миссия Вильгельма проваливается: примирения нет.',
    kinds: ['political', 'meeting'], locationId: 'chapter-house', characterIds: ['william', 'adso', 'michael', 'bertrand', 'bernard', 'jerome', 'ubertino', 'abbo'], clueIds: [], relatedEventIds: ['e-legations-arrive'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'cum-inter', 'litcharts'],
  },
  {
    id: 'e-severinus-strange-book', title: '«Я нашёл странную книгу»', day: 5, hour: 'terce', sequence: 510,
    description: 'После диспута Северин отзывает Вильгельма и говорит, что нашёл в лечебнице странную книгу. Вильгельм велит ему запереться и ждать. Хорхе, Ремигий и Аймаро, кажется, слышат разговор.',
    significance: 'Книга впервые оказывается почти в руках следователя — и о ней узнают другие.',
    kinds: ['clue'], locationId: 'chapter-house', characterIds: ['severinus', 'william', 'adso', 'jorge', 'remigio', 'aymaro'], clueIds: ['c-strange-book'], relatedEventIds: ['e-severinus-killed'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-severinus-killed', title: 'Убийство Северина', day: 5, hour: 'sext', sequence: 520,
    description: 'Придя в лечебницу, Вильгельм находит Северина мёртвым: голова разбита армиллярной (небесной) сферой, на руках кожаные перчатки, полки перевёрнуты. Бернард уже схватил келаря Ремигия, рывшегося в полках. Бенций говорит, что до прихода Ремигия видел здесь прячущегося Малахию. Вильгельм ищет греческую книгу и не замечает, что нужная — арабская рукопись, в которую переплетено несколько сочинений; когда он понимает это, книги уже нет.',
    later: [
      { revealDay: 5, text: 'Позже выясняется, что книгу унёс Бенций.', certainty: 'confirmed' },
      { revealDay: 7, critical: true, text: 'Убил Северина Малахия по наущению Хорхе.', certainty: 'confirmed' },
    ],
    significance: 'Единственное в серии прямое убийство человеческой рукой.',
    kinds: ['death', 'discovery'], locationId: 'hospital', characterIds: ['severinus', 'william', 'adso', 'remigio', 'bernard', 'benno'], clueIds: ['c-armillary', 'c-strange-book', 't-benno-malachi'], relatedEventIds: ['e-severinus-strange-book', 'e-benno-book', 'e-trial'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel', 'litcharts'],
  },
  {
    id: 'e-trial', title: 'Суд Бернарда Ги', day: 5, hour: 'nones', sequence: 540,
    description: 'Бернард судит келаря. Измученный пыткой Сальватор показывает, что знал Ремигия среди еретиков и что тот получил от Дольчино письма и отдал их на хранение Малахии; Малахия это подтверждает и уходит безнаказанным. Ремигий признаёт ересь, а под угрозой пытки — и все убийства. Бернард приговаривает его и Сальватора к смерти. Вильгельм бессилен.',
    significance: 'Официальная «разгадка» найдена — и она ложна.',
    kinds: ['trial', 'political'], locationId: 'chapter-house', characterIds: ['bernard', 'remigio', 'salvatore', 'malachi', 'william', 'adso', 'bertrand', 'abbo'], clueIds: ['t-remigio-confession'], relatedEventIds: ['e-severinus-killed', 'e-salvatore-arrest'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'gui-practica', 'litcharts'],
  },
  {
    id: 'e-ubertino-flees', title: 'Бегство Убертина', day: 5, hour: 'vespers', sequence: 550,
    description: 'Михаил объявляет, что всё же поедет в Авиньон. Вильгельм советует Убертину бежать: Бернард наметил его следующей жертвой. Той же ночью Убертин уходит с припасами, которые дал ему аббат.',
    significance: 'Фон политической угрозы, нависшей над францисканцами.',
    kinds: ['political'], characterIds: ['ubertino', 'william', 'michael', 'abbo'], clueIds: [], relatedEventIds: ['e-trial'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-benno-book', title: 'Признание Бенция', day: 5, hour: 'vespers', sequence: 555,
    description: 'После ужина Бенций признаётся, что раньше Вильгельма унёс книгу из лечебницы, а потом вернул её библиотеке, когда Малахия сделал его помощником библиотекаря вместо Беренгара.',
    significance: 'Книга снова уходит в руки библиотеки.',
    kinds: ['clue'], characterIds: ['benno', 'william', 'adso'], clueIds: ['t-benno-book'], relatedEventIds: ['e-severinus-killed', 'e-malachi-death'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-jorge-sermon', title: 'Проповедь Хорхе', day: 5, hour: 'compline', sequence: 560,
    description: 'Хорхе произносит проповедь о близости Антихриста и о гордыне знания: прогресса нет, есть лишь непрерывное повторение того, что уже известно.',
    significance: 'Самое открытое изложение взглядов Хорхе.',
    kinds: ['meeting'], locationId: 'church', characterIds: ['jorge', 'william', 'adso'], clueIds: [], relatedEventIds: [],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },

  // ───────────── День шестой ─────────────
  {
    id: 'e-malachi-death', title: 'Смерть Малахии', day: 6, hour: 'matins', sequence: 600,
    description: 'На утрене Малахия падает на хорах. Умирая, он говорит: «Он сказал мне… правда… в ней сила тысячи скорпионов». Пальцы у него чёрные. Хорхе плачет: «Это никогда не кончится».',
    later: [{ revealDay: 7, critical: true, text: 'Малахия открыл книгу, хотя Хорхе предупреждал его не делать этого.', certainty: 'confirmed' }],
    significance: 'Смерть доказывает, что арест Ремигия ничего не решил.',
    kinds: ['death', 'discovery'], locationId: 'church', characterIds: ['malachi', 'william', 'adso', 'abbo', 'jorge'], clueIds: ['c-malachi-words', 'c-black-fingers'], relatedEventIds: ['e-benno-book', 'e-nicholas-librarians'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel', 'litcharts'],
  },
  {
    id: 'e-nicholas-librarians', title: 'Сокровищница и библиотекари', day: 6, hour: 'prime', sequence: 610,
    description: 'Николай, накануне избранный келарем, показывает в крипте сокровища и реликвии и рассказывает, что библиотекарь обычно становится аббатом, и о прежних библиотекарях.',
    significance: 'Первая прямая нить к тому, кто на деле распоряжается библиотекой.',
    kinds: ['clue'], locationId: 'church', characterIds: ['nicholas', 'william', 'adso'], clueIds: ['c-librarian-succession'], relatedEventIds: ['e-catalogue'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-adso-dream', title: 'Сон Адсона', day: 6, hour: 'terce', sequence: 620,
    description: 'Под пение «Dies irae» Адсону снится пир, на котором библейские персонажи ведут себя как в шутовском представлении. Вильгельм узнаёт в сне «Киприанов пир».',
    significance: 'Сон подсказывает, что тайная книга связана со смехом и пародией.',
    kinds: ['clue'], locationId: 'church', characterIds: ['adso', 'william'], clueIds: ['c-coena-dream'], relatedEventIds: ['e-catalogue'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'coena', 'litcharts'],
  },
  {
    id: 'e-catalogue', title: 'Каталог библиотеки', day: 6, hour: 'sext', sequence: 630,
    description: 'Вильгельм находит в каталоге запись о томе «finis Africae»: в нём переплетены несколько сочинений на арабском, сирийском, латыни и греческом, среди них «Киприанов пир». Записи сделаны тремя руками; по датам библиотекарей выходит, что около полувека назад между Павлом Риминийским и Робертом Боббиенским был ещё один, нигде не названный.',
    significance: 'Книга и её хранитель вычислены по документам.',
    kinds: ['clue', 'library'], locationId: 'scriptorium', characterIds: ['william', 'adso', 'benno'], clueIds: ['c-catalogue'], relatedEventIds: ['e-nicholas-librarians', 'e-adso-dream'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-abbot-dismisses', title: 'Аббат отстраняет Вильгельма', day: 6, hour: 'nones', sequence: 640,
    description: 'Аббат говорит о языке драгоценных камней и о том, что толкование принадлежит власти, обвиняет Вильгельма в гордыне и велит наутро покинуть аббатство: дальше он разберётся сам.',
    significance: 'У следствия остаётся одна ночь.',
    kinds: ['meeting'], locationId: 'abbots-house', characterIds: ['abbo', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-abbot-enters'],
    revealDay: 6, certainty: 'interpretation', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-abbot-enters', title: 'Аббат уходит в Эдифиций', day: 6, hour: 'compline', sequence: 645,
    description: 'На повечерии аббат запрещает всем покидать дормиторий. Потом Вильгельм и Адсон видят, как он один входит в Эдифиций. Через час он всё ещё не вернулся.',
    significance: 'Аббат сам пошёл за тайной.',
    kinds: ['discovery'], locationId: 'aedificium', characterIds: ['abbo', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-abbot-trapped', 'e-quatuor-solved'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-abbot-trapped', title: 'Аббат в ловушке', safeTitle: 'Исчезновение аббата', day: 6, hour: 'night', sequence: 647,
    description: 'Хорхе заманивает аббата к тайному ходу в Finis Africae, приводит механизм в действие и запирает его на узкой лестнице в стене.',
    significance: 'Седьмая «труба», по замыслу Хорхе.',
    kinds: ['death'], locationId: 'finis-africae', characterIds: ['abbo', 'jorge'], clueIds: [], relatedEventIds: ['e-abbot-enters', 'e-finis-africae'],
    revealDay: 7, critical: true, certainty: 'interpretation', sourceIds: ['novel', 'wiki-novel', 'supersummary'],
  },
  {
    id: 'e-quatuor-solved', title: '«Первое и седьмое из четырёх»', day: 6, hour: 'night', sequence: 650,
    description: 'В конюшне Адсон вспоминает искажённую латынь Сальватора — «tertius equi», «третья лошади». Вильгельм понимает: «четыре» — это слово quatuor из надписи над зеркалом, и нажимать надо на его первую и седьмую буквы.',
    significance: 'Ключ к механизму Finis Africae найден.',
    kinds: ['clue', 'library'], locationId: 'stables', characterIds: ['william', 'adso'], clueIds: ['c-quatuor'], relatedEventIds: ['e-cipher-solved', 'e-finis-africae'],
    revealDay: 6, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },

  // ───────────── День седьмой ─────────────
  {
    id: 'e-finis-africae', title: 'В Finis Africae', day: 7, hour: 'night', sequence: 700,
    description: 'Нажав на буквы надписи, Вильгельм и Адсон открывают зеркало, как дверь. В замурованной комнате их ждёт Хорхе. Он даёт Вильгельму книгу — вторую книгу «Поэтики» Аристотеля о комедии. Вильгельм листает её в перчатках.',
    significance: 'Встреча двух представлений о знании: открыть его или охранять.',
    kinds: ['finale', 'library'], locationId: 'finis-africae', characterIds: ['william', 'adso', 'jorge'], clueIds: ['c-poetics'], relatedEventIds: ['e-jorge-confession', 'e-quatuor-solved'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel', 'litcharts'],
  },
  {
    id: 'e-jorge-confession', title: 'Объяснение Хорхе', day: 7, hour: 'night', sequence: 710,
    description: 'Хорхе подтверждает: он десятилетиями направлял библиотекарей, отравил страницы книги, внушил Малахии, что Беренгар и Северин были любовниками, и тем толкнул его к убийству, запер аббата и отказывается его освободить. Вильгельм понимает, что апокалиптический порядок смертей был его собственной ложной схемой, которой Хорхе воспользовался.',
    significance: 'Итоговая разгадка всех смертей.',
    kinds: ['finale'], locationId: 'finis-africae', characterIds: ['jorge', 'william', 'adso'], clueIds: ['c-poetics'], relatedEventIds: ['e-finis-africae', 'e-fire'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel', 'litcharts', 'supersummary'],
  },
  {
    id: 'e-fire', title: 'Пожар в библиотеке', day: 7, hour: 'night', sequence: 720,
    description: 'Хорхе рвёт и ест отравленные страницы. В погоне в темноте светильник Адсона оказывается на полу, огонь охватывает книги. Хорхе погибает; Вильгельм и Адсон спасаются.',
    significance: 'Тайна уничтожена вместе с библиотекой.',
    kinds: ['finale', 'death'], locationId: 'library', characterIds: ['jorge', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-jorge-confession', 'e-abbey-burns'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'e-abbey-burns', title: 'Аббатство в огне', day: 7, hour: 'unknown', sequence: 730,
    description: 'Адсон бьёт тревогу, монахи носят воду, но некому распоряжаться и воды мало. Пожар перекидывается на церковь и постройки; аббатство горит три дня и три ночи. Вильгельм и Адсон уходят.',
    significance: 'Конец аббатства как мира.',
    kinds: ['finale'], locationId: 'aedificium', characterIds: ['william', 'adso'], clueIds: [], relatedEventIds: ['e-fire'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'litcharts', 'supersummary'],
  },

  // ───────────── Эпилог ─────────────
  {
    id: 'e-epilogue', title: 'Последний лист', day: 8, hour: 'unknown', sequence: 800,
    description: 'Вильгельм и Адсон расстаются в Мюнхене; Вильгельм дарит ему очки, сделанные Николаем, и позже умирает во время великой чумы. Спустя годы Адсон возвращается к руинам, собирает обрывки пергамента и составляет из них свою «меньшую библиотеку».',
    significance: 'Роман заканчивается размышлением о том, что от вещей остаются только имена.',
    kinds: ['epilogue'], locationId: 'aedificium', characterIds: ['adso'], clueIds: [], relatedEventIds: ['e-abbey-burns'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'litcharts', 'supersummary'],
  },
];

export const eventById = new Map(events.map((e) => [e.id, e]));
export const eventsSorted = [...events].sort((a, b) => a.sequence - b.sequence);
