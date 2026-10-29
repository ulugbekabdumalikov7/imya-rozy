import type { Clue, Hypothesis } from './types';

/**
 * Улики (clue), свидетельства (testimony), предметы (object) и установленные факты (fact).
 * Свидетельство — это утверждение персонажа, а не факт: speakerId указывает, кто говорит.
 */
export const clues: Clue[] = [
  {
    id: 'c-brunellus', kind: 'clue', title: 'Следы коня на снегу',
    description: 'По отпечаткам копыт, сломанным веткам и волосу на кустах Вильгельм описывает коня, которого не видел, и указывает, куда тот свернул.',
    eventId: 'e-arrival', locationId: 'gate', characterIds: ['william', 'remigio'], revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-adelmo-margins', kind: 'object', title: 'Рисунки на полях Адельма',
    description: 'Перевёрнутый мир на полях рукописей: звери в монашеских одеждах, люди-птицы. Из-за них в скриптории начинается спор о смехе.',
    eventId: 'e-scriptorium-laughter', locationId: 'scriptorium', characterIds: ['adelmo', 'jorge', 'william'], revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-adelmo-fall', kind: 'clue', title: 'Падение не из окна',
    description: 'Окна Эдифиция отворяются выше человеческого роста, и наутро все они были закрыты. Случайно выпасть нельзя, а убийце пришлось бы оглушить жертву, поднять её к высокому окну и открыть его. К тому же под восточной башней скал нет, а тело побито о скалы.',
    later: [
      { revealDay: 1, text: 'Вывод Вильгельма: Адельм бросился с уступа стены, откуда сбрасывают мусор, а оползень снёс тело к восточной башне.', certainty: 'interpretation' },
      { revealDay: 2, text: 'Уточнение: уступ стены за скотным двором; Адельм бросился ещё до бури, а оползень протащил тело под восточную и северную башни.', certainty: 'interpretation' },
    ],
    eventId: 'e-adelmo-reasoning', locationId: 'ravine', characterIds: ['adelmo', 'william'], revealDay: 0, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 't-berengar-ghost', kind: 'testimony', title: 'Беренгар: «я видел Адельма»',
    speakerId: 'berengar',
    description: 'Беренгар утверждает, что в ночь гибели встретил Адельма на кладбище и тот говорил о своём проклятии.',
    later: [{ revealDay: 2, text: 'Рассказ правдив в главном: Адельм действительно был в отчаянии. Но о своей роли в этом Беренгар умалчивает — её раскрывает Бенций.', certainty: 'interpretation' }],
    eventId: 'e-berengar-ghost', locationId: 'cemetery', characterIds: ['berengar', 'adelmo'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-snow-trail', kind: 'clue', title: 'След на снегу к сосуду',
    description: 'На снегу виден след от Эдифиция к свинарнику, словно что-то тяжёлое волокли.',
    later: [{ revealDay: 7, critical: true, text: 'Так Беренгар перенёс тело Венанция.', certainty: 'confirmed' }],
    eventId: 'e-venantius-found', locationId: 'pigsty', characterIds: ['venantius'], revealDay: 2, certainty: 'interpretation', sourceIds: ['novel'],
  },
  {
    id: 'c-black-fingers', kind: 'clue', title: 'Почерневшие пальцы',
    description: 'Кончики пальцев погибших потемнели, как от какого-то вещества.',
    later: [{ revealDay: 7, critical: true, text: 'Яд был на страницах; его переносили в рот, смачивая пальцы при перелистывании.', certainty: 'confirmed' }],
    eventId: 'e-venantius-exam', locationId: 'hospital', characterIds: ['venantius', 'berengar', 'malachi'], revealDay: 2, certainty: 'interpretation', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 't-benno', kind: 'testimony', title: 'Бенций о споре в скриптории',
    speakerId: 'benno',
    description: 'Бенций рассказывает о споре над миниатюрами Адельма: Венанций ссылался на Аристотеля, Хорхе возражал, Беренгар захохотал, что у «африканцев» найдутся загадки потруднее, а потом Венанций и Адельм о чём-то расспрашивали Беренгара. В каталоге Бенций видел помету «предел Африки», но Малахия сказал, что такие книги утеряны.',
    eventId: 'e-benno-testimony', locationId: 'scriptorium', characterIds: ['benno', 'berengar', 'adelmo', 'venantius', 'jorge'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 't-benno-tale', kind: 'testimony', title: 'Бенций о сделке Адельма',
    speakerId: 'benno',
    description: 'Беренгар предложил Адельму низостную сделку в обмен на тайну, которую тот жаждал узнать, и Адельм согласился. Ночью Адельм выбежал из кельи Беренгара, исповедался у двери Хорхе и ушёл в церковь; следом за ним в хор вошёл Венанций.',
    later: [{ revealDay: 2, text: 'Вильгельм считает весьма вероятным, что в церкви Адельм передал тайну Венанцию.', certainty: 'interpretation' }],
    eventId: 'e-benno-tale', locationId: 'herb-garden', characterIds: ['benno', 'adelmo', 'berengar', 'jorge', 'venantius'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-finis-words', kind: 'clue', title: 'Слова «предел Африки»',
    description: 'Выражение, которым в скриптории обозначают что-то запретное в библиотеке.',
    eventId: 'e-benno-testimony', locationId: 'finis-africae', characterIds: ['benno', 'venantius'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 't-alinardo', kind: 'testimony', title: 'Алинард о трубах и библиотекарях',
    speakerId: 'alinardo',
    description: 'Старик называет библиотеку лабиринтом, видит в смертях знаки Апокалипсиса и подсказывает тайный вход в Эдифиций через оссуарий.',
    later: [
      { revealDay: 3, text: 'Наутро после исчезновения Беренгара: «Третья труба несёт смерть от вод».', certainty: 'confirmed' },
      { revealDay: 4, text: 'Он ждёт четвёртой трубы и жалуется, что библиотекарем должен был стать он, но другой добился, чтобы его послали в Силос, привёз лучшие рукописи, знал наречие неверных — и библиотеку поручили ему.', certainty: 'confirmed' },
    ],
    eventId: 'e-alinardo-labyrinth', locationId: 'ossuary', characterIds: ['alinardo'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-venantius-notes', kind: 'object', title: 'Записи Венанция',
    description: 'Заметки мелким греческим письмом на столе Венанция; у фонаря на пергаменте проступают знаки некромантского шифра.',
    later: [
      { revealDay: 3, text: 'Расшифровка: «тайна предела Африки открывается рукой над идолом чрез первый и седьмой в четырёх».', certainty: 'confirmed' },
      { revealDay: 4, text: 'Греческие заметки, прочитанные с новыми стёклами, бессвязны: похоже, это выписки из книги, которую читал Венанций.', certainty: 'confirmed' },
    ],
    eventId: 'e-night-scriptorium', locationId: 'scriptorium', characterIds: ['venantius', 'william'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-stolen-book', kind: 'object', title: 'Книга со стола Венанция',
    description: 'Книга, которую кто-то выхватил в темноте у Вильгельма из-под руки.',
    later: [{ revealDay: 7, critical: true, text: 'Это была та самая отравленная книга; её унёс Беренгар.', certainty: 'confirmed' }],
    eventId: 'e-night-scriptorium', locationId: 'scriptorium', characterIds: ['william'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-stolen-lenses', kind: 'object', title: 'Украденные очки',
    description: 'В ту же ночь пропадают очки Вильгельма — без них он не может читать мелкие записи.',
    later: [{ revealDay: 4, text: 'Северин находит очки в рясе мёртвого Беренгара.', certainty: 'confirmed' }],
    eventId: 'e-night-scriptorium', locationId: 'scriptorium', characterIds: ['william', 'nicholas'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-library-defenses', kind: 'clue', title: 'Зеркало и дурманящий дым',
    description: 'Кривое зеркало и горящие травы, вызывающие видения, — защита лабиринта от непрошеных гостей.',
    eventId: 'e-first-labyrinth', locationId: 'mirror-room', characterIds: ['adso', 'william'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-bloody-cloth', kind: 'clue', title: 'Окровавленная простыня в келье',
    description: 'В келье пропавшего Беренгара находят белую ткань, пропитанную кровью.',
    eventId: 'e-berengar-missing', locationId: 'dormitory', characterIds: ['berengar'], revealDay: 3, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-dolcinian-past', kind: 'fact', title: 'Ремигий и Сальватор — бывшие дольчинисты',
    description: 'Келарь и Сальватор в молодости были среди последователей Дольчино.',
    eventId: 'e-dolcino-story', locationId: 'church', characterIds: ['remigio', 'salvatore'], revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'dolcino'],
  },
  {
    id: 'c-black-tongue', kind: 'clue', title: 'Чёрный язык Беренгара',
    description: 'При осмотре тела Северин и Вильгельм замечают почерневший язык — странный признак для утопленника.',
    eventId: 'e-severinus-poison', locationId: 'hospital', characterIds: ['berengar', 'severinus', 'william'], revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 't-remigio-kitchen', kind: 'testimony', title: 'Ремигий: «я видел его в кухне»',
    speakerId: 'remigio',
    description: 'Келарь признаётся, что в ночь смерти Венанция, придя в кухню на тайное свидание, увидел его мёртвым возле кадки — без следов борьбы, рядом с разбитой чашкой и разлитой водой — и ушёл, ничего не сказав. Наутро, увидев тело в бочке, он оледенел от ужаса.',
    eventId: 'e-remigio-pressed', locationId: 'kitchen', characterIds: ['remigio', 'venantius'], revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 't-severinus-poison', kind: 'testimony', title: 'Северин о пропавшем яде',
    speakerId: 'severinus',
    description: 'Травник рассказывает, что много лет назад, когда буря разгромила его лабораторию, пропала склянка с сильнейшим ядом. Он подозревал послушника Августина, погибшего в прошлом году. О яде он рассказывал Малахии; мог слышать и Беренгар.',
    eventId: 'e-severinus-poison', locationId: 'hospital', characterIds: ['severinus'], revealDay: 4, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-labyrinth-plan', kind: 'fact', title: 'План лабиринта',
    description: 'Надписи над проходами складываются в названия стран. В схеме не хватает одной комнаты.',
    eventId: 'e-library-map', locationId: 'library', characterIds: ['william', 'adso'], revealDay: 4, certainty: 'confirmed', sourceIds: ['novel', 'novel-plans'],
  },
  {
    id: 'c-strange-book', kind: 'testimony', title: 'Северин: странная книга',
    speakerId: 'severinus',
    description: 'В сенях капитулярной залы Северин шепчет, что Беренгар перед смертью побывал в лечебнице, а в лаборатории нашлась чужая, очень странная книга. Рядом бесшумно возникает Хорхе; за ним пробирается Аймаро.',
    eventId: 'e-severinus-strange-book', locationId: 'hospital', characterIds: ['severinus', 'william', 'berengar'], revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-armillary', kind: 'object', title: 'Небесный глобус',
    description: 'Металлический небесный глобус (армиллярная сфера) на треноге, которым разбили голову Северину.',
    eventId: 'e-severinus-killed', locationId: 'hospital', characterIds: ['severinus'], revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 't-benno-malachi', kind: 'testimony', title: 'Бенций: Малахия был в лечебнице',
    speakerId: 'benno',
    description: 'Бенций уверен, что Малахия выжидал в лаборатории за пологом ещё до прихода келаря и вышел, только когда собралось много народу.',
    eventId: 'e-severinus-killed', locationId: 'hospital', characterIds: ['benno', 'malachi'], revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 't-benno-book', kind: 'testimony', title: 'Бенций: «я взял книгу»',
    speakerId: 'benno',
    description: 'Бенций признаётся, что унёс книгу из лечебницы, спрятал под тюфяк, не заглянув в неё, и передал Малахии, когда тот сделал его своим помощником.',
    eventId: 'e-benno-book', locationId: 'hospital', characterIds: ['benno', 'malachi'], revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 't-remigio-confession', kind: 'testimony', title: 'Признание Ремигия',
    speakerId: 'remigio',
    description: 'Под угрозой пытки келарь признаётся в ереси и в убийствах.',
    later: [{ revealDay: 6, text: 'Смерть Малахии, случившаяся, когда Ремигий уже под стражей, показывает, что признание в убийствах ложно.', certainty: 'confirmed' }],
    eventId: 'e-trial', locationId: 'chapter-house', characterIds: ['remigio', 'bernard'], revealDay: 5, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-malachi-words', kind: 'testimony', title: 'Последние слова Малахии',
    speakerId: 'malachi',
    description: 'Умирая, Малахия хрипит: «Меня предупреждали… Это правда… Там сила тысячи скорпионов…»',
    eventId: 'e-malachi-death', locationId: 'church', characterIds: ['malachi'], revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-librarian-succession', kind: 'testimony', title: 'Хроника библиотекарей',
    speakerId: 'nicholas',
    description: 'Николай рассказывает, что библиотекарь обычно становится аббатом, и вспоминает прежних библиотекарей.',
    later: [{ revealDay: 6, text: 'Аймаро радуется смерти «германца» Малахии; итальянские монахи говорят, что по правилу библиотекарь должен знать греческий и арабский.', certainty: 'confirmed' }],
    eventId: 'e-nicholas-librarians', locationId: 'church', characterIds: ['nicholas', 'malachi', 'alinardo', 'jorge'], revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-coena-dream', kind: 'clue', title: 'Сон о пире',
    description: 'Сон Адсона повторяет «Киприанов пир» — пародию, где священное становится смешным.',
    eventId: 'e-adso-dream', locationId: 'church', characterIds: ['adso', 'william'], revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'coena'],
  },
  {
    id: 'c-catalogue', kind: 'object', title: 'Запись в каталоге',
    description: 'Под одной пометой «предел Африки» в каталоге значатся четыре сочинения на арабском, сирийском, латыни и греческом, среди них «Киприанов пир». По почеркам и датам Вильгельм восстанавливает историю библиотекарей.',
    later: [{ revealDay: 7, critical: true, text: 'Греческое сочинение в этом томе — вторая книга «Поэтики» Аристотеля.', certainty: 'confirmed' }],
    eventId: 'e-catalogue', locationId: 'scriptorium', characterIds: ['william'], revealDay: 6, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-quatuor', kind: 'clue', title: 'Слово «quatuor» над зеркалом',
    description: '«Четыре» из тайнописи — это слово quatuor надписи над зеркалом. Нажатие на его первую и седьмую буквы (q и r) открывает проход. Догадку подсказывает латынь Сальватора «tertius equi» — «третий в конях», то есть третья буква слова.',
    eventId: 'e-quatuor-solved', locationId: 'mirror-room', characterIds: ['william', 'adso'], revealDay: 6, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },
  {
    id: 'c-poetics', kind: 'object', title: 'Вторая книга «Поэтики»',
    description: 'Единственный уцелевший список утраченного трактата Аристотеля о комедии. Его страницы пропитаны ядом.',
    eventId: 'e-finis-africae', locationId: 'finis-africae', characterIds: ['jorge', 'william'], revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'janko'],
  },

  // ───────────── Установленные факты (итог) ─────────────
  {
    id: 'f-adelmo-suicide', kind: 'fact', title: 'Адельм покончил с собой',
    description: 'Первая смерть не была убийством: Адельм бросился с высоты в отчаянии.',
    eventId: 'e-adelmo-death', locationId: 'ravine', characterIds: ['adelmo'], revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'f-poison-book', kind: 'fact', title: 'Смерти причиняет книга',
    description: 'Венанций, Беренгар и Малахия умерли от яда на страницах книги.',
    eventId: 'e-jorge-confession', locationId: 'finis-africae', characterIds: ['venantius', 'berengar', 'malachi', 'jorge'], revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'f-berengar-moved', kind: 'fact', title: 'Беренгар спрятал тело Венанция',
    description: 'Беренгар не убивал Венанция, а лишь перенёс его тело в сосуд с кровью.',
    eventId: 'e-jorge-confession', locationId: 'pigsty', characterIds: ['berengar', 'venantius'], revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'f-malachi-killed', kind: 'fact', title: 'Северина убил Малахия',
    description: 'Малахия убил Северина: Хорхе внушил ему, что Беренгар был в связи с Северином и отдал ему книгу из предела Африки.',
    eventId: 'e-jorge-confession', locationId: 'hospital', characterIds: ['malachi', 'severinus', 'jorge'], revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'f-jorge-master', kind: 'fact', title: 'Хорхе — тайный хозяин библиотеки',
    description: 'Десятилетиями Хорхе управлял библиотекой через назначенных им библиотекарей.',
    eventId: 'e-jorge-confession', locationId: 'finis-africae', characterIds: ['jorge', 'malachi'], revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
];

export const clueById = new Map(clues.map((c) => [c.id, c]));

/** Версии расследования. */
export const hypotheses: Hypothesis[] = [
  {
    id: 'h-window', title: 'Адельм выпал из окна Эдифиция',
    holderIds: ['abbo'],
    statement: 'Несчастный случай или убийство: молодой монах выпал или был выброшен из окна.',
    initialStatus: 'open', finalStatus: 'refuted',
    verdict: { revealDay: 1, text: 'Отвергнута Вильгельмом в первый же вечер: убийце пришлось бы поднять тело к высокому окну и открыть его, а под башней, где нашли тело, нет скал, о которые оно разбилось.', certainty: 'interpretation' },
    links: [
      { clueId: 'c-adelmo-fall', relation: 'contradicts', note: 'Окна закрыты и высоко; тело побито о скалы, которых под башней нет.', revealDay: 0 },
    ],
    eventIds: ['e-abbot-commission', 'e-adelmo-reasoning'], revealDay: 0, sourceIds: ['novel'],
  },
  {
    id: 'h-adelmo-suicide', title: 'Адельм покончил с собой',
    holderIds: ['william'],
    statement: 'Адельм бросился с высоты сам, раздавленный стыдом и страхом проклятия.',
    initialStatus: 'open', finalStatus: 'confirmed',
    verdict: { revealDay: 2, text: 'Подтверждено на второй день: рассказ Беренгара о встрече на кладбище и рассказ Бенция о сделке и исповеди объясняют отчаяние Адельма.', certainty: 'confirmed' },
    links: [
      { clueId: 'c-adelmo-fall', relation: 'supports', note: 'Падение не из окна оставляет место для прыжка с другой высоты.', revealDay: 0 },
      { clueId: 't-berengar-ghost', relation: 'supports', note: 'Адельм говорил о проклятии.', revealDay: 2 },
      { clueId: 't-benno-tale', relation: 'supports', note: 'Сделка с Беренгаром и исповедь у Хорхе.', revealDay: 2 },
      { clueId: 'f-adelmo-suicide', relation: 'supports', note: 'Итоговый вывод.', revealDay: 2 },
    ],
    eventIds: ['e-adelmo-death', 'e-adelmo-reasoning', 'e-berengar-ghost', 'e-benno-tale'], revealDay: 0, sourceIds: ['novel', 'litcharts'],
  },
  {
    id: 'h-apocalypse', title: 'Смерти следуют трубам Апокалипсиса',
    holderIds: ['alinardo', 'william'],
    statement: 'Град и огонь, кровь, вода, удар по третьей части светил: каждая смерть исполняет очередную трубу.',
    initialStatus: 'open', finalStatus: 'refuted',
    verdict: { revealDay: 7, critical: true, text: 'Схема ложна: Вильгельм вообразил её после одной фразы Алинарда. Но Хорхе знал о ней от Алинарда и нарочно подыгрывал — про тысячу скорпионов он сказал Малахии «для тебя», — поэтому ложная версия привела Вильгельма к истине.', certainty: 'confirmed' },
    links: [
      { clueId: 't-alinardo', relation: 'supports', note: 'Источник версии — речи Алинарда о знаках Апокалипсиса; на четвёртый день он прямо называет трубы.', revealDay: 2 },
      { clueId: 'c-snow-trail', relation: 'context', note: 'Кровь — «вторая труба»: совпадение, которое кажется знаком.', revealDay: 2 },
      { clueId: 'c-black-tongue', relation: 'context', note: 'Смерть в воде как будто продолжает ряд.', revealDay: 4 },
      { clueId: 'c-armillary', relation: 'context', note: 'Удар небесной сферой можно подогнать под «поражение светил».', revealDay: 5 },
      { clueId: 'c-malachi-words', relation: 'context', note: 'Скорпионы — образ из той же книги Откровения.', revealDay: 6 },
      { clueId: 'f-poison-book', relation: 'contradicts', note: 'Механизм смертей — яд, а не замысел по пророчеству.', revealDay: 7, critical: true },
    ],
    eventIds: ['e-berengar-missing', 'e-berengar-found', 'e-alinardo-trumpets'], revealDay: 3, sourceIds: ['novel'],
  },
  {
    id: 'h-berengar-killer', title: 'Беренгар убил Венанция',
    holderIds: ['william'],
    statement: 'У Беренгара были тайна и страх разоблачения; он исчезает сразу после второй смерти.',
    initialStatus: 'open', finalStatus: 'refuted',
    verdict: { revealDay: 7, critical: true, text: 'Опровергнуто: Беренгар лишь спрятал тело и забрал книгу — и сам погиб от неё.', certainty: 'confirmed' },
    links: [
      { clueId: 't-berengar-ghost', relation: 'context', note: 'Беренгар явно что-то скрывает.', revealDay: 2 },
      { clueId: 'c-bloody-cloth', relation: 'supports', note: 'Подозрительная находка в его келье.', revealDay: 3 },
      { clueId: 'c-black-tongue', relation: 'contradicts', note: 'Беренгар умер с теми же признаками, что и Венанций.', revealDay: 4 },
      { clueId: 't-remigio-kitchen', relation: 'contradicts', note: 'Тело Венанция лежало в кухне без следов борьбы.', revealDay: 4 },
      { clueId: 'f-berengar-moved', relation: 'contradicts', note: 'Итог: он только перенёс тело.', revealDay: 7, critical: true },
    ],
    eventIds: ['e-berengar-missing'], revealDay: 3, sourceIds: ['novel'],
  },
  {
    id: 'h-poison', title: 'Смерти вызывает яд',
    holderIds: ['william', 'severinus'],
    statement: 'Венанций и Беренгар отравлены, и источник яда как-то связан с книгами.',
    initialStatus: 'open', finalStatus: 'confirmed',
    verdict: { revealDay: 7, critical: true, text: 'Подтверждено: яд нанесён на страницы книги.', certainty: 'confirmed' },
    links: [
      { clueId: 'c-black-fingers', relation: 'supports', note: 'Почерневшие пальцы.', revealDay: 2 },
      { clueId: 'c-black-tongue', relation: 'supports', note: 'Почерневший язык.', revealDay: 4 },
      { clueId: 't-severinus-poison', relation: 'supports', note: 'Из лечебницы когда-то пропал яд.', revealDay: 4 },
      { clueId: 't-remigio-kitchen', relation: 'supports', note: 'Венанций лежал в кухне без следов борьбы, рядом с разбитой чашей.', revealDay: 4 },
      { clueId: 'c-malachi-words', relation: 'supports', note: 'Те же признаки у Малахии.', revealDay: 6 },
      { clueId: 'f-poison-book', relation: 'supports', note: 'Итоговое объяснение.', revealDay: 7, critical: true },
    ],
    eventIds: ['e-venantius-exam', 'e-berengar-found', 'e-severinus-poison'], revealDay: 2, sourceIds: ['novel'],
  },
  {
    id: 'h-remigio', title: 'Виновен келарь Ремигий',
    holderIds: ['bernard'],
    statement: 'Бывший еретик-дольчинист убивал, чтобы скрыть прошлое; его поймали на месте последнего убийства.',
    initialStatus: 'open', finalStatus: 'refuted',
    verdict: { revealDay: 6, text: 'Опровергнуто: Малахия умирает, когда Ремигий уже под стражей. Признание вырвано угрозой пытки.', certainty: 'confirmed' },
    links: [
      { clueId: 'c-dolcinian-past', relation: 'supports', note: 'Для инквизитора прошлое — уже улика.', revealDay: 3 },
      { clueId: 'c-armillary', relation: 'context', note: 'Ремигия схватили в лаборатории рядом с телом.', revealDay: 5 },
      { clueId: 't-remigio-confession', relation: 'supports', note: 'Признание под угрозой пытки.', revealDay: 5 },
      { clueId: 'c-malachi-words', relation: 'contradicts', note: 'Новая смерть при арестованном «убийце».', revealDay: 6 },
    ],
    eventIds: ['e-trial'], revealDay: 5, sourceIds: ['novel', 'gui-practica'],
  },
  {
    id: 'h-book', title: 'Всё дело в одной книге',
    holderIds: ['william'],
    statement: 'Каждый погибший так или иначе держал в руках одну и ту же книгу, спрятанную в «пределе Африки».',
    initialStatus: 'open', finalStatus: 'confirmed',
    verdict: { revealDay: 7, critical: true, text: 'Подтверждено: это вторая книга «Поэтики» Аристотеля.', certainty: 'confirmed' },
    links: [
      { clueId: 'c-finis-words', relation: 'supports', note: 'Тайное место библиотеки.', revealDay: 2 },
      { clueId: 'c-venantius-notes', relation: 'supports', note: 'Венанций искал проход и описывал книгу.', revealDay: 2 },
      { clueId: 'c-stolen-book', relation: 'supports', note: 'Книгу похищают у следствия.', revealDay: 2 },
      { clueId: 'c-strange-book', relation: 'supports', note: 'Книга всплывает в лечебнице.', revealDay: 5 },
      { clueId: 't-benno-book', relation: 'supports', note: 'Книга переходит к Малахии.', revealDay: 5 },
      { clueId: 'c-coena-dream', relation: 'supports', note: 'Тема — смех и пародия.', revealDay: 6 },
      { clueId: 'c-catalogue', relation: 'supports', note: 'Том в каталоге.', revealDay: 6 },
      { clueId: 'c-poetics', relation: 'supports', note: 'Книга найдена.', revealDay: 7, critical: true },
    ],
    eventIds: ['e-cipher-solved', 'e-catalogue'], revealDay: 2, sourceIds: ['novel'],
  },
  {
    id: 'h-hidden-librarian', title: 'У библиотеки есть тайный хозяин',
    holderIds: ['william'],
    statement: 'Назначения библиотекарей направляет не аббат, а кто-то, кто давно контролирует книги.',
    initialStatus: 'open', finalStatus: 'confirmed',
    verdict: { revealDay: 7, critical: true, text: 'Подтверждено: это Хорхе.', certainty: 'confirmed' },
    links: [
      { clueId: 't-alinardo', relation: 'supports', note: 'Обида Алинарда на несправедливый выбор.', revealDay: 4 },
      { clueId: 'c-librarian-succession', relation: 'supports', note: 'Странная преемственность должности.', revealDay: 6 },
      { clueId: 'c-catalogue', relation: 'supports', note: 'Почерки в каталоге.', revealDay: 6 },
      { clueId: 'f-jorge-master', relation: 'supports', note: 'Итоговое объяснение.', revealDay: 7, critical: true },
    ],
    eventIds: ['e-nicholas-librarians', 'e-catalogue'], revealDay: 6, sourceIds: ['novel'],
  },
  {
    id: 'h-malachi', title: 'Северина убил Малахия',
    holderIds: ['william'],
    statement: 'Книга ушла к Малахии; у библиотекаря был доступ и причина вернуть её любой ценой.',
    initialStatus: 'open', finalStatus: 'partial',
    verdict: { revealDay: 7, critical: true, text: 'Верно лишь отчасти: Малахия убил Северина, но был орудием Хорхе.', certainty: 'confirmed' },
    links: [
      { clueId: 't-benno-book', relation: 'supports', note: 'Книга ушла к Малахии.', revealDay: 5 },
      { clueId: 't-benno-malachi', relation: 'supports', note: 'Малахия выжидал в лаборатории за пологом ещё до прихода келаря.', revealDay: 5 },
      { clueId: 'c-malachi-words', relation: 'context', note: 'Малахию «предупреждали» — значит, был кто-то над ним.', revealDay: 6 },
      { clueId: 'f-malachi-killed', relation: 'supports', note: 'Итоговое объяснение.', revealDay: 7, critical: true },
      { clueId: 'f-jorge-master', relation: 'context', note: 'Приказ исходил от Хорхе.', revealDay: 7, critical: true },
    ],
    eventIds: ['e-severinus-killed', 'e-benno-book'], revealDay: 7, critical: true, sourceIds: ['novel', 'wiki-novel'],
  },
];
