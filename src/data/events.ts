import type { StoryEvent } from './types';

/**
 * События романа. Канонические часы указаны там, где роман привязывает эпизод к главе-часу
 * (заголовки глав сверены по тексту перевода Е. Костюкович, см. AUDIT.md); если час неизвестен,
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
    description: 'Незадолго до приезда Вильгельма Беренгар предлагает Адельму постыдную сделку: близость в обмен на тайну, которую Адельм жаждал узнать. Той же ночью Адельм выходит из кельи Беренгара, исповедуется Хорхе и уходит в церковь; за ним следят Беренгар и Венанций.',
    significance: 'Отсюда начинается цепь событий: стыд, исповедь и отчаяние Адельма. Вильгельм предполагает, что тайну Адельм успел передать Венанцию.',
    kinds: ['library'], characterIds: ['adelmo', 'berengar'], clueIds: ['t-benno-tale', 't-berengar-ghost'], relatedEventIds: ['e-adelmo-death', 'e-benno-tale'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel', 'litcharts'],
  },
  {
    id: 'e-adelmo-death', title: 'Гибель Адельма', day: 0, hour: 'night', sequence: 20,
    description: 'В ночь бури Адельм погибает. Изорванное тело находят под отвесным обрывом у подножия восточной башни Эдифиция. Аббат подозревает убийство: наутро все окна были закрыты, а из открытого окна он сам бы не выпал.',
    later: [
      { revealDay: 1, text: 'Вильгельм заключает, что Адельм сам бросился с уступа стены, откуда сбрасывают мусор, а оползень снёс тело к восточной башне. Это не убийство.', certainty: 'interpretation' },
      { revealDay: 2, text: 'Беренгар рассказывает, что в ту ночь видел Адельма на кладбище: тот говорил, что проклят. Вильгельм уточняет: Адельм бросился с уступа стены за скотным двором ещё до бури.', certainty: 'confirmed' },
    ],
    significance: 'Смерть, с которой начинается расследование. Вильгельм объясняет её уже в первый вечер, а на второй день находятся свидетели.',
    kinds: ['death'], locationId: 'ravine', characterIds: ['adelmo'], clueIds: ['c-adelmo-fall', 't-berengar-ghost'], relatedEventIds: ['e-adelmo-bargain', 'e-abbot-commission'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
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
    description: 'Келарь отводит гостей в странноприимные палаты. Около третьего часа аббат Аббон приходит к Вильгельму в келью; Адсон, лежа в нише, невольно слышит разговор. Аббат рассказывает о гибели Адельма — наутро все окна Эдифиция были закрыты — и просит разобраться до прибытия посольств. Ходить и расспрашивать можно всех, но подниматься в библиотеку нельзя.',
    significance: 'Задаёт условия расследования: искать можно везде, кроме главного места.',
    kinds: ['meeting'], locationId: 'pilgrims-house', characterIds: ['abbo', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-adelmo-death', 'e-arrival'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
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
    description: 'После осмотра построек Вильгельм излагает Адсону свою версию: под восточной башней, где нашли тело, скал нет, там растут пинии, а скалы есть под уступом стены, откуда сбрасывают мусор; на свалке почти нет снега, видны следы оползня. Убийце пришлось бы проникнуть в башню, оглушить жертву, поднять её к высокому окну и открыть его. Проще предположить, что Адельм бросился сам, а оползень принёс тело к башне.',
    significance: 'Первое сомнение в версии об убийстве; принцип простейшего объяснения.',
    kinds: ['clue'], locationId: 'aedificium', characterIds: ['william', 'adso'], clueIds: ['c-adelmo-fall'], relatedEventIds: ['e-adelmo-death'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
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
    description: 'В трапезной Вильгельм и Адсон ужинают за столом аббата вместе с Малахией, келарем, Хорхе и почти столетним Алинардом. Ужин кончается суровой отповедью Хорхе. Ночью Адсон видит свет на верхнем этаже Эдифиция.',
    significance: 'Иерархия общины видна по месту за столом; спор о смехе продолжается.',
    kinds: ['meeting'], locationId: 'refectory', characterIds: ['abbo', 'william', 'adso', 'malachi', 'remigio', 'jorge', 'alinardo'], clueIds: [], relatedEventIds: ['e-scriptorium-laughter'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
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
    description: 'Во время утрени в церковь вбегают перепуганные свинари. На задворках хора, перед скотным двором, из бочки со свиной кровью торчат ноги Венанция. Аббатство в смятении: смерть явно связана с первой.',
    later: [
      { revealDay: 2, text: 'Вильгельм читает следы на снегу: тело, похоже, волокли от Эдифиция.', certainty: 'interpretation' },
      { revealDay: 7, critical: true, text: 'В сосуд тело бросил Беренгар; Венанций был уже мёртв от яда.', certainty: 'confirmed' },
    ],
    significance: 'Вторая смерть превращает несчастный случай в серию и заставляет думать о злом умысле.',
    kinds: ['death', 'discovery'], locationId: 'pigsty', characterIds: ['venantius', 'william', 'adso', 'abbo', 'remigio', 'severinus'], clueIds: ['c-snow-trail', 'c-black-fingers'], relatedEventIds: ['e-venantius-dies', 'e-venantius-exam'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'e-venantius-exam', title: 'Осмотр тела', day: 2, hour: 'unknown', sequence: 205,
    description: 'Северин замечает, что лицо не отёкшее, как у утопленника: Венанций был мёртв до того, как попал в бочку. Тело обмывают в купальне и переносят в лабораторию Северина; ран нет. Северин признаёт, что держит вещества, которые в больших дозах убивают.',
    significance: 'Возникает подозрение на яд.',
    kinds: ['clue'], locationId: 'hospital', characterIds: ['william', 'adso', 'severinus', 'venantius'], clueIds: ['c-black-fingers'], relatedEventIds: ['e-venantius-found'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-benno-testimony', title: 'Рассказ Бенция', day: 2, hour: 'prime', sequence: 210,
    description: 'В клуатре, на балюстраде между колоннами, Бенций рассказывает о споре над миниатюрами Адельма: Венанций ссылался на Аристотеля, Хорхе возражал, Беренгар захохотал и сказал, что у «африканцев» найдутся загадки потруднее, а Малахия вытолкал его. Потом Венанций и Адельм о чём-то расспрашивали Беренгара. В каталоге Бенций однажды видел помету «предел Африки», но Малахия сказал, что такие книги утеряны.',
    significance: 'Впервые звучит название тайного места библиотеки.',
    kinds: ['clue', 'meeting'], locationId: 'cloister', characterIds: ['benno', 'william', 'adso'], clueIds: ['t-benno', 'c-finis-words'], relatedEventIds: ['e-scriptorium-laughter', 'e-benno-tale'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-berengar-ghost', title: 'Беренгар и «призрак» Адельма', day: 2, hour: 'prime', sequence: 215,
    description: 'Вильгельм нагоняет Беренгара на кладбище, когда тот спешит к Эдифиции. Перепуганный Беренгар признаётся, что в ночь гибели Адельма видел его здесь: тот говорил, что проклят, и капля его огненного пота обожгла Беренгару руку.',
    significance: 'Свидетельство, которое объясняет душевное состояние Адельма и выдаёт страх самого Беренгара.',
    kinds: ['clue'], locationId: 'cemetery', characterIds: ['berengar', 'william', 'adso'], clueIds: ['t-berengar-ghost'], relatedEventIds: ['e-adelmo-death'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-aymaro-allusions', title: 'Ссора и намёки Аймаро', day: 2, hour: 'terce', sequence: 217,
    description: 'Сальватор и Ремигий бранятся, обвиняя друг друга в ереси. Аймаро Александрийский намекает на связь Беренгара с Адельмом и жалуется, что библиотекой заправляет кучка иностранцев.',
    significance: 'Обнажается раскол общины и тайны, о которых шепчутся монахи.',
    kinds: ['meeting'], characterIds: ['aymaro', 'salvatore', 'remigio', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-benno-tale'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-benno-tale', title: 'Бенций о сделке', day: 2, hour: 'sext', sequence: 219,
    description: 'Бенций рассказывает: Беренгар предложил Адельму низостную сделку в обмен на тайну, которую тот жаждал узнать, и Адельм согласился. Ночью Бенций видел, как Адельм выбежал из кельи Беренгара, исповедался у двери Хорхе и ушёл в церковь; Беренгар остался на кладбище, а следом за Адельмом в хор вошёл Венанций.',
    significance: 'Причина отчаяния Адельма становится известна.',
    kinds: ['clue'], locationId: 'herb-garden', characterIds: ['benno', 'william', 'adso'], clueIds: ['t-benno-tale'], relatedEventIds: ['e-adelmo-bargain', 'e-benno-testimony'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbot-treasure', title: 'Сокровища и страх аббата', day: 2, hour: 'nones', sequence: 225,
    description: 'Аббат в церкви показывает сокровища обители и говорит о предстоящей встрече. Он боится, что папские посланники свяжут смерти с ересью, и признаёт, что в обители укрываются бывшие минориты — в том числе келарь Ремигий.',
    significance: 'Первый намёк на прошлое келаря.',
    kinds: ['meeting', 'political'], locationId: 'church', characterIds: ['abbo', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-dolcino-story'],
    revealDay: 2, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-alinardo-labyrinth', title: 'Речи Алинарда', day: 2, hour: 'vespers', sequence: 230,
    description: 'В саду у клуатра старец Алинард называет библиотеку лабиринтом, видит в смертях знаки Апокалипсиса и подсказывает путь: в третьей часовне за поперечным нефом, на алтаре с черепами, ткнуть в глаза четвёртого черепа справа — и откроется оссуарий.',
    significance: 'Следователи узнают, как ночью попасть в запертое здание.',
    kinds: ['meeting'], locationId: 'cloister', characterIds: ['alinardo', 'william', 'adso'], clueIds: ['t-alinardo'], relatedEventIds: ['e-night-scriptorium'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-night-scriptorium', title: 'Ночь в скриптории', day: 2, hour: 'compline', sequence: 240,
    description: 'После повечерия Вильгельм и Адсон проходят из часовни через оссуарий и подземный ход в кухню Эдифиция и поднимаются в скрипторий; наверху кто-то есть. На столе Венанция — заметки мелким греческим письмом; у фонаря на пергаменте проступают знаки некромантского шифра. Пока Вильгельм отложил очки, неизвестный уносит со стола книгу, а затем и очки.',
    later: [
      { revealDay: 4, text: 'Очки потом найдут в одежде Беренгара.', certainty: 'confirmed' },
      { revealDay: 7, critical: true, text: 'Книгу тоже унёс Беренгар.', certainty: 'confirmed' },
    ],
    significance: 'Главные материальные улики второй половины расследования появляются и тут же ускользают.',
    kinds: ['library', 'clue'], locationId: 'scriptorium', characterIds: ['william', 'adso'], clueIds: ['c-venantius-notes', 'c-stolen-book', 'c-stolen-lenses'], relatedEventIds: ['e-first-labyrinth', 'e-cipher-solved'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-first-labyrinth', title: 'Первое проникновение в лабиринт', day: 2, hour: 'night', sequence: 250,
    description: 'Поднявшись по восточной лестнице, следователи блуждают по комнатам библиотеки. Адсон пугается кривого зеркала (надпись над ним — «Super thronos viginti quatuor») и видений от курящихся дурманных трав. Выход удаётся найти лишь через несколько часов; аббат сообщает, что Беренгара не было на повечерии.',
    significance: 'Библиотека защищена не только запретом, но и устройством самого пространства.',
    kinds: ['library'], locationId: 'library', characterIds: ['william', 'adso'], clueIds: ['c-library-defenses'], relatedEventIds: ['e-library-map'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },

  // ───────────── День третий ─────────────
  {
    id: 'e-berengar-missing', title: 'Беренгар исчез', day: 3, hour: 'lauds', sequence: 300,
    description: 'Беренгар не явился ни на повечерие, ни на утреню. Утром в его келье находят белую ткань, пропитанную кровью. Хорхе переспрашивает: «Неужели кровь?», а Алинард твердит: «Третья труба несёт смерть от вод».',
    later: [{ revealDay: 7, critical: true, text: 'К этому времени Беренгар уже прочитал книгу и был отравлен.', certainty: 'interpretation' }],
    significance: 'Главный подозреваемый исчезает.',
    kinds: ['discovery'], locationId: 'dormitory', characterIds: ['william', 'adso', 'abbo', 'jorge', 'alinardo'], clueIds: ['c-bloody-cloth'], relatedEventIds: ['e-berengar-found'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-new-lenses', title: 'Новые линзы', day: 3, hour: 'nones', sequence: 305,
    description: 'Адсон застаёт Вильгельма в кузне: вместе с Николаем он перебирает и шлифует стёкла для новых очков.',
    significance: 'Без очков Вильгельм не может читать мелкие записи Венанция.',
    kinds: ['clue'], locationId: 'workshops', characterIds: ['william', 'adso', 'nicholas'], clueIds: ['c-stolen-lenses'], relatedEventIds: ['e-nicholas-glass', 'e-lenses-returned'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-salvatore-story', title: 'Рассказ Сальватора', day: 3, hour: 'sext', sequence: 303,
    description: 'За завтраком в кухне Сальватор рассказывает Адсону о голодном детстве и скитаниях с бродягами и сектантами. Вильгельм, выслушав пересказ, предполагает, что тот «потёрся и у дольчиниан».',
    significance: 'Адсон начинает догадываться, что келарь и Сальватор связаны с прошлым дольчинистов.',
    kinds: ['meeting'], locationId: 'kitchen', characterIds: ['adso', 'salvatore'], clueIds: ['c-dolcinian-past'], relatedEventIds: ['e-dolcino-story'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-cipher-solved', title: 'Тайнопись Венанция', day: 3, hour: 'nones', sequence: 315,
    description: 'Объясняя Адсону природу ереси, Вильгельм между делом показывает расшифровку тайнописи Венанция: «Secretum finis Africae manus supra idolum age primum et septimum de quatuor» — «тайна предела Африки открывается рукой над идолом чрез первый и седьмой в четырёх».',
    significance: 'Становится ясно, что в Finis Africae ведёт механизм. Смысл «первого и седьмого из четырёх» пока не понятен.',
    kinds: ['clue', 'library'], characterIds: ['william', 'adso'], clueIds: ['c-venantius-notes'], relatedEventIds: ['e-night-scriptorium', 'e-greek-notes', 'e-quatuor-solved'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-dolcino-story', title: 'История Дольчино', day: 3, hour: 'night', sequence: 330,
    description: 'После повечерия Адсон находит Убертина перед статуей Богоматери в церкви, и тот рассказывает историю брата Дольчина и апостольских братьев.',
    significance: 'Даёт материал для будущего обвинения Бернарда Ги.',
    kinds: ['political', 'meeting'], locationId: 'church', characterIds: ['adso', 'ubertino'], clueIds: ['c-dolcinian-past'], relatedEventIds: ['e-salvatore-story', 'e-trial'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-adso-girl', title: 'Адсон и девушка', day: 3, hour: 'night', sequence: 340,
    description: 'Взволнованный рассказом, Адсон один поднимается в библиотеку, а возвращаясь через трапезную, застаёт в кухне девушку из деревни. Очнувшись, он видит, что она исчезла, а в свёртке у печи — сердце животного, и теряет сознание. Ночью он исповедуется Вильгельму.',
    significance: 'Личная история рассказчика, которая отзовётся на суде инквизитора.',
    kinds: ['meeting'], locationId: 'kitchen', characterIds: ['adso', 'girl'], clueIds: [], relatedEventIds: ['e-salvatore-arrest', 'e-berengar-found'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel'],
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
    description: 'После исповеди Адсона они слышат в церкви Алинарда: «с третьей трубой…». Вильгельм рассуждает, что третий мёртвый должен быть в воде, а Адсон вспоминает о бане. В купальнях за лечебницей они находят Беренгара утонувшим в ванне.',
    significance: 'Пропавший подозреваемый — третья жертва.',
    kinds: ['death', 'discovery'], locationId: 'balneary', characterIds: ['berengar', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-berengar-dies', 'e-severinus-poison'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel'],
  },

  // ───────────── День четвёртый ─────────────
  {
    id: 'e-severinus-poison', title: 'Чёрный язык и пропавший яд', day: 4, hour: 'lauds', sequence: 400,
    description: 'В лаборатории Вильгельм и Северин (в рукавицах для ядов) осматривают тело Беренгара: язык и кончики пальцев черны — для утопленника это странно. Северин вспоминает, что много лет назад, когда буря разгромила лабораторию, у него пропала склянка с сильнейшим ядом; о ней он рассказывал Малахии, и мог слышать Беренгар.',
    significance: 'Сходство признаков у двух мёртвых указывает на одну причину — яд — и на давно задуманное злодеяние.',
    kinds: ['clue'], locationId: 'hospital', characterIds: ['severinus', 'william', 'adso', 'berengar'], clueIds: ['c-black-tongue', 'c-black-fingers', 't-severinus-poison'], relatedEventIds: ['e-berengar-found'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-remigio-pressed', title: 'Признания Сальватора и келаря', day: 4, hour: 'prime', sequence: 410,
    description: 'Сальватор признаётся, что приводит в аббатство деревенских девушек для келаря. Ремигий признаёт это и своё прошлое среди дольчинистов и рассказывает, что в ночь смерти Венанция видел его мёртвым в кухне, возле кадки, рядом с разбитой чашкой и разлитой водой, и ушёл, промолчав. Свидетельствовать против Малахии он отказывается: тот что-то о нём знает и всегда вёл себя порядочно.',
    significance: 'У следствия появляется человек с тайной — но не той, что нужна; становится известно, что Венанций лежал мёртвым в кухне.',
    kinds: ['meeting', 'clue'], characterIds: ['william', 'adso', 'salvatore', 'remigio'], clueIds: ['c-dolcinian-past', 't-remigio-kitchen'], relatedEventIds: ['e-dolcino-story', 'e-trial', 'e-venantius-dies'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-lenses-returned', title: 'Шесть глаз', day: 4, hour: 'prime', sequence: 412,
    description: 'Северин приносит украденные очки Вильгельма — они были в рясе Беренгара. Тут же Николай приносит новые, и Вильгельм, оставив старые про запас, уходит в келью читать записи Венанция.',
    significance: 'Очки крал Беренгар. С двумя парами стёкол Вильгельм может читать записи Венанция.',
    kinds: ['clue'], characterIds: ['severinus', 'nicholas', 'william', 'adso'], clueIds: ['c-stolen-lenses'], relatedEventIds: ['e-new-lenses', 'e-greek-notes'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-greek-notes', title: 'Греческие заметки', day: 4, hour: 'terce', sequence: 420,
    description: 'Вильгельм возвращается с запиской Венанция: греческие слова прочитаны, но и после расшифровки остаются непонятными — похоже, это выписки, сделанные при чтении другой книги.',
    significance: 'Расшифрованное остаётся непонятным, но указывает на книгу, которую читал Венанций.',
    kinds: ['clue', 'library'], locationId: 'pilgrims-house', characterIds: ['william', 'adso'], clueIds: ['c-venantius-notes'], relatedEventIds: ['e-cipher-solved', 'e-lenses-returned'],
    revealDay: 4, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-minorites-arrive', title: 'Прибытие миноритов', day: 4, hour: 'sext', sequence: 425,
    description: 'Адсон собирается с Северином и свинарями в долину за трюфелями, а возвращается с подъехавшими миноритами. Михаил Цезенский, Иероним Каффский и другие держат с Вильгельмом и Убертином совет; об Иоанне XXII говорят много неутешительного.',
    significance: 'Францисканская сторона встречи на месте.',
    kinds: ['political', 'arrival'], locationId: 'gate', characterIds: ['michael', 'jerome', 'william', 'ubertino', 'adso', 'severinus'], clueIds: [], relatedEventIds: ['e-legations-arrive', 'e-disputation'],
    revealDay: 4, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-legations-arrive', title: 'Прибытие папского посольства', day: 4, hour: 'nones', sequence: 430,
    description: 'Прибывают кардинал Бертран дель Поджетто, Бернард Ги и другие люди из Авиньона. Бернард уже знает о смертях и сразу начинает допрашивать работников.',
    significance: 'Расследование теперь идёт под взглядом инквизиции и политиков.',
    kinds: ['political', 'arrival'], locationId: 'gate', characterIds: ['bertrand', 'bernard', 'abbo', 'william'], clueIds: [], relatedEventIds: ['e-minorites-arrive', 'e-disputation'],
    revealDay: 4, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-alinardo-trumpets', title: 'Семь труб', day: 4, hour: 'vespers', sequence: 435,
    description: 'Алинард: «И третий труп находился там, где предуказано книгой. Теперь жди четвёртой трубы!» Он жалуется, что должен был стать библиотекарем, но другой добился, чтобы его послали в Силос, привёз оттуда лучшие рукописи, знал наречие неверных — и библиотеку поручили ему. Вильгельм объясняет Адсону, как идти к вероятной истине через ряд ошибок.',
    significance: 'Ложная, но влиятельная версия становится рабочей.',
    kinds: ['clue'], characterIds: ['alinardo', 'william', 'adso'], clueIds: ['t-alinardo'], relatedEventIds: ['e-alinardo-labyrinth'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-library-map', title: 'План лабиринта', day: 4, hour: 'night', sequence: 440,
    description: 'Во второй вылазке Вильгельм методично наносит комнаты на план и понимает, что надписи складываются в названия стран. Одна семиугольная комната в южной башне недоступна — замурованный «предел Африки»; «идол» из тайнописи — зеркало. Вход открыть не удаётся: неизвестно, что такое «первое и седьмое из четырёх».',
    significance: 'Лабиринт перестаёт быть хаосом и становится картой.',
    kinds: ['library', 'clue'], locationId: 'library', characterIds: ['william', 'adso'], clueIds: ['c-labyrinth-plan'], relatedEventIds: ['e-first-labyrinth', 'e-finis-africae'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-salvatore-arrest', title: 'Арест Сальватора и девушки', day: 4, hour: 'night', sequence: 450,
    description: 'Лучники Бернарда Ги хватают у самой кухонной двери Сальватора и девушку. В узле Сальватора — нож, чёрный кот и два раздавленных яйца; «Чёрный кот и чёрный петух!» — восклицает Бернард. Девушку объявляют ведьмой; пленников разводят по темницам в подвале кузни.',
    significance: 'У инквизитора появляются готовые обвиняемые.',
    kinds: ['trial', 'political'], locationId: 'kitchen', characterIds: ['salvatore', 'girl', 'bernard', 'adso', 'william'], clueIds: [], relatedEventIds: ['e-trial'],
    revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },

  // ───────────── День пятый ─────────────
  {
    id: 'e-disputation', title: 'Диспут о бедности', day: 5, hour: 'prime', sequence: 500,
    description: 'В капитулярной зале францисканцы и папские посланники спорят о том, владел ли Христос имуществом. Спор быстро переходит в обвинения; в третьем часу Вильгельм говорит о границах церковной власти.',
    significance: 'Политическая миссия Вильгельма проваливается: примирения нет.',
    kinds: ['political', 'meeting'], locationId: 'chapter-house', characterIds: ['william', 'adso', 'michael', 'bertrand', 'bernard', 'jerome', 'ubertino', 'abbo'], clueIds: [], relatedEventIds: ['e-legations-arrive'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'cum-inter'],
  },
  {
    id: 'e-severinus-strange-book', title: '«Я нашёл странную книгу»', day: 5, hour: 'terce', sequence: 510,
    description: 'Во время диспута послушник вызывает Вильгельма в сени капитулярной залы. Северин шепчет: Беренгар перед смертью побывал в лечебнице, а у себя в лаборатории Северин нашёл чужую, очень странную книгу. Рядом бесшумно возникает Хорхе, за ним пробирается Аймаро; Вильгельм на всю залу кричит Северину вслед, чтобы записи не вернулись на старое место.',
    significance: 'Книга впервые оказывается почти в руках следователя — и о ней узнают другие.',
    kinds: ['clue'], locationId: 'chapter-house', characterIds: ['severinus', 'william', 'adso', 'jorge', 'aymaro'], clueIds: ['c-strange-book'], relatedEventIds: ['e-severinus-killed'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-severinus-killed', title: 'Убийство Северина', day: 5, hour: 'sext', sequence: 520,
    description: 'В разгромленной лаборатории Северин лежит с разбитой головой; рядом — армиллярная сфера, на руках у Северина кожаные рукавицы. Лучники держат келаря. В толпе — Малахия; уводимый Ремигий кричит ему: «Клянись, и я клянусь!», тот отвечает: «Я не буду делать ничего во вред тебе». Бенций шепчет, что Малахия прятался за пологом ещё до прихода келаря. Вильгельм ищет греческую книгу и отбрасывает арабскую — а нужная именно она: в одном томе переплетены несколько сочинений. Когда он это понимает, книги уже нет.',
    later: [
      { revealDay: 5, text: 'Позже выясняется, что книгу унёс Бенций.', certainty: 'confirmed' },
      { revealDay: 7, critical: true, text: 'Убил Северина Малахия по наущению Хорхе.', certainty: 'confirmed' },
    ],
    significance: 'Единственное в серии прямое убийство человеческой рукой.',
    kinds: ['death', 'discovery'], locationId: 'hospital', characterIds: ['severinus', 'william', 'adso', 'remigio', 'bernard', 'benno', 'malachi', 'abbo'], clueIds: ['c-armillary', 'c-strange-book', 't-benno-malachi'], relatedEventIds: ['e-severinus-strange-book', 'e-benno-book', 'e-trial'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-trial', title: 'Суд Бернарда Ги', day: 5, hour: 'nones', sequence: 540,
    description: 'В капитулярной зале Бернард судит келаря. Выясняется, что письма Дольчино Ремигий отдал на хранение Малахии; Малахия это подтверждает и уходит, а из толпы ему кричат насмешку о послушниках. Ремигий признаёт ересь, а под угрозой пытки — и убийства. Бернард объявляет, что его отвезут в Авиньон на окончательный суд и затем сожгут. Вильгельм бессилен.',
    significance: 'Официальная «разгадка» найдена — и она ложна.',
    kinds: ['trial', 'political'], locationId: 'chapter-house', characterIds: ['bernard', 'remigio', 'salvatore', 'malachi', 'william', 'adso', 'bertrand', 'abbo'], clueIds: ['t-remigio-confession'], relatedEventIds: ['e-severinus-killed', 'e-salvatore-arrest'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'gui-practica'],
  },
  {
    id: 'e-ubertino-flees', title: 'Бегство Убертина', day: 5, hour: 'vespers', sequence: 550,
    description: 'В клуатре Михаил объявляет, что едет в Авиньон. Вильгельм велит Убертину попросить у аббата коня, провиант и письмо в далёкий монастырь и уехать под покровом тумана. За ужином Михаил сообщает, что Убертин покинул аббатство.',
    significance: 'Фон политической угрозы, нависшей над францисканцами.',
    kinds: ['political'], locationId: 'cloister', characterIds: ['ubertino', 'william', 'michael', 'adso'], clueIds: [], relatedEventIds: ['e-trial'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-benno-book', title: 'Признание Бенция', day: 5, hour: 'vespers', sequence: 555,
    description: 'После ужина в углу кухни Бенций признаётся: книгу из лечебницы взял он и спрятал под тюфяк, даже не заглянув в неё; а когда Малахия предложил ему место помощника библиотекаря, передал книгу Малахии. Аббат утвердил его назначение полчаса назад.',
    significance: 'Книга снова уходит в руки библиотеки.',
    kinds: ['clue'], locationId: 'kitchen', characterIds: ['benno', 'william', 'adso'], clueIds: ['t-benno-book'], relatedEventIds: ['e-severinus-killed', 'e-malachi-death'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-jorge-sermon', title: 'Проповедь Хорхе', day: 5, hour: 'compline', sequence: 560,
    description: 'Хорхе произносит проповедь о близости Антихриста и о гордыне знания: прогресса нет, есть лишь непрерывное повторение того, что уже известно.',
    significance: 'Самое открытое изложение взглядов Хорхе.',
    kinds: ['meeting'], locationId: 'church', characterIds: ['jorge', 'william', 'adso'], clueIds: [], relatedEventIds: [],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },

  // ───────────── День шестой ─────────────
  {
    id: 'e-malachi-death', title: 'Смерть Малахии', day: 6, hour: 'matins', sequence: 600,
    description: 'На утрене Малахия падает на хорах, вцепляется в Вильгельма и хрипит: «Меня предупреждали… Это правда… Там сила тысячи скорпионов…» Подушечки трёх пальцев его правой руки черны. Хорхе плачет: «Это никогда не кончится…»',
    later: [{ revealDay: 7, critical: true, text: 'Малахия открыл книгу, хотя Хорхе предупреждал его не делать этого.', certainty: 'confirmed' }],
    significance: 'Смерть доказывает, что арест Ремигия ничего не решил.',
    kinds: ['death', 'discovery'], locationId: 'church', characterIds: ['malachi', 'william', 'adso', 'abbo', 'jorge'], clueIds: ['c-malachi-words', 'c-black-fingers'], relatedEventIds: ['e-benno-book', 'e-nicholas-librarians'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-nicholas-librarians', title: 'Сокровищница и библиотекари', day: 6, hour: 'prime', sequence: 610,
    description: 'Николай, только что назначенный келарем, показывает в крипте сокровища и реликвии и рассказывает о прежних библиотекарях и аббатах: о Павле из Римини, о больном Роберте и о том, как сам Аббон пришёл к власти.',
    significance: 'Первая прямая нить к тому, кто на деле распоряжается библиотекой.',
    kinds: ['clue'], locationId: 'church', characterIds: ['nicholas', 'william', 'adso'], clueIds: ['c-librarian-succession'], relatedEventIds: ['e-catalogue'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-adso-dream', title: 'Сон Адсона', day: 6, hour: 'terce', sequence: 620,
    description: 'Под пение «Dies irae» Адсону снится пир, на котором библейские персонажи ведут себя как в шутовском представлении. Вильгельм узнаёт в сне «Киприанов пир».',
    significance: 'Сон подсказывает, что тайная книга связана со смехом и пародией.',
    kinds: ['clue'], locationId: 'church', characterIds: ['adso', 'william'], clueIds: ['c-coena-dream'], relatedEventIds: ['e-catalogue'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'coena'],
  },
  {
    id: 'e-catalogue', title: 'Каталог библиотеки', day: 6, hour: 'sext', sequence: 630,
    description: 'В скриптории Вильгельм требует у Бенция каталог: под одной пометой «предел Африки» числятся четыре сочинения на арабском, сирийском, латыни и греческом, среди них «Киприанов пир». По почеркам и датам он восстанавливает историю библиотекарей.',
    significance: 'Книга и её хранитель вычислены по документам.',
    kinds: ['clue', 'library'], locationId: 'scriptorium', characterIds: ['william', 'adso', 'benno'], clueIds: ['c-catalogue'], relatedEventIds: ['e-nicholas-librarians', 'e-adso-dream'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbot-dismisses', title: 'Аббат отстраняет Вильгельма', day: 6, hour: 'nones', sequence: 640,
    description: 'В своих покоях над капитулярной залой аббат говорит о языке драгоценных камней, отказывается слушать Вильгельма и велит наутро покинуть аббатство: расследование окончено.',
    significance: 'У следствия остаётся одна ночь.',
    kinds: ['meeting'], locationId: 'abbots-house', characterIds: ['abbo', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-abbot-enters'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbot-enters', title: 'Аббат уходит в Эдифиций', day: 6, hour: 'compline', sequence: 645,
    description: 'Хорхе исчез: его не нашли ни в скриптории, ни в келье. После повечерия аббат велит всем немедленно разойтись и не выходить из здания почивален. Вильгельм и Адсон видят, как он входит в Эдифиций через дверь трапезной. Прошёл час — он не вернулся.',
    significance: 'Аббат сам пошёл за тайной.',
    kinds: ['discovery'], locationId: 'aedificium', characterIds: ['abbo', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-abbot-trapped', 'e-quatuor-solved'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbot-trapped', title: 'Аббат в ловушке', safeTitle: 'Исчезновение аббата', day: 6, hour: 'night', sequence: 647,
    description: 'Хорхе велит аббату прийти и, когда тот поднимается по тайной лестнице в стене из оссуария к пределу Африки, приводит механизм в действие и замуровывает его.',
    significance: 'Седьмая «труба», по замыслу Хорхе.',
    kinds: ['death'], locationId: 'finis-africae', characterIds: ['abbo', 'jorge'], clueIds: [], relatedEventIds: ['e-abbot-enters', 'e-finis-africae'],
    revealDay: 7, critical: true, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'e-quatuor-solved', title: '«Первое и седьмое из четырёх»', day: 6, hour: 'night', sequence: 650,
    description: 'У конюшни Адсон вспоминает латынь Сальватора: «tertius equi» — «третий в конях», то есть третья буква слова. Вильгельм понимает: «первый и седьмой в четырёх» — буквы слова quatuor в надписи над зеркалом.',
    significance: 'Ключ к механизму Finis Africae найден.',
    kinds: ['clue', 'library'], locationId: 'stables', characterIds: ['william', 'adso'], clueIds: ['c-quatuor'], relatedEventIds: ['e-cipher-solved', 'e-finis-africae'],
    revealDay: 6, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },

  // ───────────── День седьмой ─────────────
  {
    id: 'e-finis-africae', title: 'В Finis Africae', day: 7, hour: 'night', sequence: 700,
    description: 'Нажав на буквы q и r надписи, Вильгельм и Адсон открывают зеркало, как дверь. В пределе Африки их ждёт Хорхе. Он даёт Вильгельму книгу — вторую книгу «Поэтики» Аристотеля. Вильгельм листает её в рукавицах, снятых с убитого Северина.',
    significance: 'Встреча двух представлений о знании: открыть его или охранять.',
    kinds: ['finale', 'library'], locationId: 'finis-africae', characterIds: ['william', 'adso', 'jorge'], clueIds: ['c-poetics'], relatedEventIds: ['e-jorge-confession', 'e-quatuor-solved'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-jorge-confession', title: 'Объяснение Хорхе', day: 7, hour: 'night', sequence: 710,
    description: 'Хорхе подтверждает догадки Вильгельма: он давно похитил яд у Северина и пропитал им страницы, направлял библиотекарей, внушил Малахии, что Беренгар был в связи с Северином и отдал ему книгу, и тем толкнул его к убийству; про тысячу скорпионов сказал Малахии нарочно — «для тебя». Аббата он сам велел позвать и замуровал. Вильгельм понимает, что апокалиптический порядок смертей вообразил он сам после одной фразы Алинарда.',
    significance: 'Итоговая разгадка всех смертей.',
    kinds: ['finale'], locationId: 'finis-africae', characterIds: ['jorge', 'william', 'adso'], clueIds: ['c-poetics'], relatedEventIds: ['e-finis-africae', 'e-fire'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-fire', title: 'Пожар в библиотеке', day: 7, hour: 'night', sequence: 720,
    description: 'Хорхе рвёт и ест отравленные страницы. В погоне он вырывает у Адсона фонарь и швыряет его в груду книг; огонь охватывает библиотеку. Вильгельм и Адсон спасаются.',
    significance: 'Тайна уничтожена вместе с библиотекой.',
    kinds: ['finale', 'death'], locationId: 'library', characterIds: ['jorge', 'william', 'adso'], clueIds: [], relatedEventIds: ['e-jorge-confession', 'e-abbey-burns'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'e-abbey-burns', title: 'Аббатство в огне', day: 7, hour: 'unknown', sequence: 730,
    description: 'Адсон бьёт тревогу, монахи носят воду, но ими некому распоряжаться: нет ни келаря Ремигия, ни Малахии, ни аббата. Николай пытается направлять скотников. Огонь перекидывается на церковь, конюшни и хлевы; аббатство горит три дня и три ночи. Вильгельм и Адсон уходят.',
    significance: 'Конец аббатства как мира.',
    kinds: ['finale'], locationId: 'aedificium', characterIds: ['william', 'adso', 'nicholas'], clueIds: [], relatedEventIds: ['e-fire'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },

  // ───────────── Эпилог ─────────────
  {
    id: 'e-epilogue', title: 'Последний лист', day: 8, hour: 'unknown', sequence: 800,
    description: 'Вильгельм и Адсон расстаются в Мюнхене; Вильгельм дарит ему стёкла, сделанные Николаем, и позже умирает во время великой чумы. Спустя годы Адсон возвращается к руинам, собирает обрывки пергамента и составляет из них свою «меньшую библиотеку».',
    significance: 'Роман заканчивается размышлением о том, что от вещей остаются только имена.',
    kinds: ['epilogue'], locationId: 'aedificium', characterIds: ['adso'], clueIds: [], relatedEventIds: ['e-abbey-burns'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },
];

export const eventById = new Map(events.map((e) => [e.id, e]));
export const eventsSorted = [...events].sort((a, b) => a.sequence - b.sequence);
