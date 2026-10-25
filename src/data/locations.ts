import type { Location } from './types';

export const locations: Location[] = [
  // ───────────── Территория ─────────────
  {
    id: 'aedificium',
    name: 'Эдифиций',
    latin: 'Aedificium',
    type: 'aedificium',
    plan: { view: 'abbey', hotspot: 'ab-aedificium' },
    description:
      'Огромное восьмиугольное здание с четырьмя семиугольными башнями, стоящее на краю обрыва. Внизу — кухня и трапезная, над ними — скрипторий, на верхнем этаже — библиотека-лабиринт. Здание видно издалека и подавляет всё вокруг.',
    significance: [
      { revealDay: 0, text: 'Центр всей истории: знание здесь хранится, переписывается и прячется. Почти все линии расследования сходятся в этих стенах.' },
      { revealDay: 7, critical: true, text: 'В последнюю ночь здесь начинается пожар, который уничтожает библиотеку, а затем и всё аббатство.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel', 'novel-plans'],
  },
  {
    id: 'ravine',
    name: 'Обрыв под Эдифицием',
    type: 'outer',
    plan: { view: 'abbey', hotspot: 'ab-cliff' },
    description:
      'Крутой склон под стеной и башнями Эдифиция. Здание буквально вырастает из скалы, и с внешней стороны под ним открывается пропасть.',
    significance: [
      { revealDay: 0, text: 'Здесь, в снегу и осыпи, нашли тело Адельма. Как именно он сюда упал — первая загадка, с которой аббат обращается к Вильгельму.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'cemetery',
    name: 'Кладбище',
    type: 'outer',
    plan: { view: 'abbey', hotspot: 'ab-cemetery' },
    description: 'Монастырское кладбище между церковью и Эдифицием. Ночью, в снег, это одно из самых пустынных мест аббатства.',
    significance: [
      { revealDay: 2, text: 'Беренгар рассказывает, что в ночь гибели Адельма встретил его здесь, бледного и потрясённого, словно мертвеца, говорящего о своём проклятии.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'church',
    name: 'Церковь',
    latin: 'Ecclesia',
    type: 'church',
    plan: { view: 'abbey', hotspot: 'ab-church' },
    description:
      'Аббатская церковь с резным порталом, изображающим видение Апокалипсиса. Здесь проходят службы всех канонических часов, и вся жизнь монахов размерена её колоколом.',
    significance: [
      { revealDay: 0, text: 'В первый день Адсон долго разглядывает портал, и это видение задаёт апокалиптический тон всей книге. Здесь же Вильгельм встречает Убертина.' },
      { revealDay: 6, text: 'На утрене шестого дня Малахия падает замертво прямо на хорах.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },
  {
    id: 'ossuary',
    name: 'Оссуарий и подземный ход',
    type: 'passage',
    parentId: 'church',
    description:
      'Подземная костница под церковью. Из неё ведёт потайной ход, который выходит в кухню Эдифиция. Так можно попасть в здание, когда его двери заперты на ночь.',
    significance: [
      { revealDay: 2, text: 'Во вторую ночь Вильгельм и Адсон впервые проходят этим ходом в Эдифиций, следуя путём, которым ночью пользуется кто-то ещё.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },
  {
    id: 'cloister',
    name: 'Клуатр',
    latin: 'Claustrum',
    type: 'residence',
    plan: { view: 'abbey', hotspot: 'ab-cloister' },
    description: 'Крытая галерея вокруг внутреннего двора, соединяющая церковь с жилыми помещениями. Место для чтения, размышления и тихих разговоров.',
    significance: [
      { revealDay: 1, text: 'Многие беседы, в которых Вильгельм выясняет, кто что видел и кто кого опасается, происходят на ходу — в галереях и во дворе.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'chapter-house',
    name: 'Капитулярный зал',
    latin: 'Capitulum',
    type: 'residence',
    plan: { view: 'abbey', hotspot: 'ab-H' },
    description: 'Зал собраний общины. Здесь аббат объявляет решения и разбираются дела монастыря.',
    significance: [
      { revealDay: 5, text: 'На пятый день здесь проходит диспут о бедности Христа между францисканцами и папским посольством, а затем — суд Бернарда Ги над келарем.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'dormitory',
    name: 'Дормиторий и кельи',
    type: 'residence',
    plan: { view: 'abbey', hotspot: 'ab-dormitory-east' },
    description: 'Спальный корпус монахов с отдельными кельями. Ночью монахи обязаны быть здесь — поэтому любое ночное отсутствие становится подозрительным.',
    significance: [
      { revealDay: 3, text: 'Беренгар не возвращается в келью; в ней находят окровавленную ткань. С этого начинается его исчезновение.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'abbots-house',
    name: 'Дом аббата',
    type: 'residence',
    offPlan: 'На эталонном плане дом аббата не подписан, поэтому атлас его не размещает.',
    description: 'Покои аббата Аббона рядом с церковью. Сюда Вильгельма зовут для разговоров, где речь идёт о репутации обители не меньше, чем о правде.',
    significance: [
      { revealDay: 1, text: 'Здесь аббат поручает Вильгельму расследование и одновременно запрещает ему вход в библиотеку.' },
      { revealDay: 6, text: 'Здесь же на шестой день аббат объявляет, что Вильгельм должен покинуть аббатство.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'pilgrims-house',
    name: 'Странноприимный дом',
    type: 'residence',
    offPlan: 'На эталонном плане странноприимный дом не подписан, поэтому атлас его не размещает.',
    description: 'Помещения для гостей аббатства. Здесь живут Вильгельм и Адсон, а позже и члены прибывших посольств.',
    significance: [
      { revealDay: 1, text: 'Отсюда начинаются и сюда возвращаются ночные вылазки следователей.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'hospital',
    name: 'Лечебница и лаборатория',
    latin: 'Hospitale',
    type: 'medical',
    plan: { view: 'abbey', hotspot: 'ab-A-gate' },
    description: 'Владения травника Северина: лечебница, склад снадобий и лаборатория с приборами, книгами по медицине и опасными веществами.',
    significance: [
      { revealDay: 2, text: 'Здесь Вильгельм и Северин осматривают тело Венанция.' },
      { revealDay: 4, text: 'Северин упоминает, что когда-то из его лаборатории пропало сильное ядовитое вещество.' },
      { revealDay: 5, text: 'На пятый день здесь находят убитого Северина. Странная книга, о которой он успел сказать, исчезает.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },
  {
    id: 'balneary',
    name: 'Купальня',
    latin: 'Balneum',
    type: 'medical',
    plan: { view: 'abbey', hotspot: 'ab-B' },
    description: 'Помещение для омовений рядом с лечебницей, с ваннами, которые травник использовал и для лечебных купаний.',
    significance: [
      { revealDay: 4, text: 'Утром четвёртого дня здесь, в ванне, находят тело Беренгара.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },
  {
    id: 'herb-garden',
    name: 'Травяной сад',
    type: 'garden',
    plan: { view: 'abbey', hotspot: 'ab-plots' },
    description: 'Огород лечебных трав. Северин показывает его Вильгельму в первый же день — два знатока трав сразу находят общий язык.',
    significance: [
      { revealDay: 1, text: 'Через разговор о травах Вильгельм узнаёт, какие вещества могут лечить, а какие — дурманить или убивать.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },
  {
    id: 'pigsty',
    name: 'Свинарник',
    type: 'service',
    plan: { view: 'abbey', hotspot: 'ab-M' },
    description: 'Хозяйственный двор, где зимой режут свиней. Кровь собирают в большой сосуд, чтобы делать кровяную колбасу.',
    significance: [
      { revealDay: 2, text: 'Утром второго дня из сосуда с кровью торчат ноги Венанция.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },
  {
    id: 'stables',
    name: 'Конюшни',
    type: 'service',
    plan: { view: 'abbey', hotspot: 'ab-N' },
    description: 'Конюшни в южном ряду построек. Сюда ведут беглого коня аббата Гнедка (Brunellus), которого Вильгельм описал, ни разу не видев.',
    significance: [
      { revealDay: 1, text: 'Эта сцена в первый день показывает метод Вильгельма: читать следы как знаки.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'workshops',
    name: 'Мастерские',
    type: 'service',
    plan: { view: 'abbey', hotspot: 'ab-R-forge' },
    description: 'Кузница и мастерская стекольщика Николая Моримондского, где делают витражи и шлифуют стёкла.',
    significance: [
      { revealDay: 3, text: 'После кражи очков Вильгельм вместе с Николаем пытается выточить новые линзы.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'gate',
    name: 'Ворота',
    type: 'outer',
    plan: { view: 'abbey', hotspot: 'ab-gate' },
    description: 'Единственный главный вход в обнесённое стеной аббатство. Через него приходят гости, посольства и инквизиция.',
    significance: [
      { revealDay: 1, text: 'Вильгельм и Адсон прибывают сюда в первый день.' },
      { revealDay: 4, text: 'На четвёртый день через ворота въезжают францисканское и папское посольства с Бернардом Ги.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'village',
    name: 'Дорога в деревню',
    type: 'outer',
    plan: { view: 'abbey', hotspot: 'ab-road' },
    description: 'Спуск к бедной деревне у подножия горы. Деревня живёт за счёт аббатства и во многом от него зависит.',
    significance: [
      { revealDay: 3, text: 'Отсюда, тайно, в аббатство приходит девушка, которую Адсон встречает в кухне.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },

  // ───────────── Эдифиций: первый этаж ─────────────
  {
    id: 'kitchen',
    name: 'Кухня',
    type: 'service',
    parentId: 'aedificium',
    description: 'Большая кухня Эдифиция с печами. Сюда выходит подземный ход из оссуария, поэтому кухня — ночная дверь в здание.',
    significance: [
      { revealDay: 2, text: 'Ход из оссуария заканчивается здесь.' },
      { revealDay: 3, text: 'В третью ночь Адсон встречает в кухне девушку из деревни.' },
      { revealDay: 7, critical: true, text: 'По итоговому объяснению, именно здесь в первую ночь умер Венанций: почувствовав себя плохо, он спустился из скриптория и погиб.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },
  {
    id: 'refectory',
    name: 'Трапезная',
    latin: 'Refectorium',
    type: 'service',
    parentId: 'aedificium',
    description: 'Общая трапезная, где монахи едят в молчании под чтение. Порядок мест за столом отражает иерархию общины.',
    significance: [
      { revealDay: 1, text: 'За трапезой Вильгельм присматривается к монахам и их отношениям: кто с кем сидит, кто кого избегает.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },

  // ───────────── Эдифиций: второй этаж ─────────────
  {
    id: 'scriptorium',
    name: 'Скрипторий',
    latin: 'Scriptorium',
    type: 'library',
    parentId: 'aedificium',
    description:
      'Светлый зал, где монахи копируют, переводят и украшают рукописи. У каждого — свой стол у окна. Попасть отсюда наверх, в библиотеку, может только библиотекарь с помощником.',
    significance: [
      { revealDay: 1, text: 'В первый день здесь вспыхивает спор Вильгельма с Хорхе о смехе — над рисунками на полях, оставшимися после Адельма.' },
      { revealDay: 2, text: 'Ночью второго дня на столе Венанция Вильгельм находит заметки и тайнопись; книгу у него из-под носа уносит неизвестный, исчезают и очки Вильгельма.' },
      { revealDay: 7, critical: true, text: 'По итоговому объяснению, Венанций начал читать отравленную книгу именно за своим столом в скриптории.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },

  // ───────────── Эдифиций: третий этаж ─────────────
  {
    id: 'library',
    name: 'Библиотека-лабиринт',
    type: 'library',
    plan: { view: 'library' },
    parentId: 'aedificium',
    description:
      'Лабиринт из множества смежных комнат, заставленных книгами. У комнат нет привычных номеров: над проходами написаны стихи из Апокалипсиса, а их начальные буквы складываются в названия стран мира. Попасть сюда может только библиотекарь.',
    significance: [
      { revealDay: 2, text: 'Во вторую ночь Вильгельм и Адсон впервые проникают в лабиринт и едва находят выход: их пугают зеркало и дурманящий дым.' },
      { revealDay: 4, text: 'Вильгельм составляет план лабиринта и выясняет, что одна комната недоступна: её место пусто.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel', 'novel-plans'],
  },
  {
    id: 'library-entrance',
    name: 'Вход в библиотеку (восточная башня)',
    type: 'library',
    plan: { view: 'library', hotspot: 'lib-E-tower-center' },
    parentId: 'library',
    description: 'Башня, через которую лестница из скриптория выходит в лабиринт. Отсюда начинается любая попытка понять устройство библиотеки.',
    significance: [
      { revealDay: 2, text: 'Точка входа следователей в лабиринт.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
  {
    id: 'mirror-room',
    revealDay: 2,
    name: 'Комната с зеркалом',
    type: 'library',
    plan: { view: 'library', hotspot: 'lib-S-arm-right' },
    parentId: 'library',
    description: 'Комната с кривым зеркалом, искажающим отражение. Ночью оно кажется чудовищем.',
    significance: [
      { revealDay: 2, text: 'В первую вылазку Адсон принимает собственное отражение за чудовище.' },
      { revealDay: 6, critical: true, text: 'Над зеркалом — надпись со словами «четыре» (quatuor). Нажатие на первую и седьмую её буквы открывает проход в Finis Africae.' },
    ],
    certainty: 'confirmed',
    sourceIds: ['novel'],
  },
  {
    id: 'finis-africae',
    revealDay: 2,
    name: 'Finis Africae',
    latin: 'Finis Africae — «предел Африки»',
    type: 'library',
    plan: { view: 'library', hotspot: 'lib-S-tower-center' },
    parentId: 'library',
    description: 'Замурованная комната лабиринта, куда нет видимого входа. О ней шепчутся монахи.',
    significance: [
      { revealDay: 2, text: 'Выражение «предел Африки» всплывает в разговорах как название чего-то запретного.' },
      { revealDay: 4, text: 'По плану лабиринта Вильгельм вычисляет, где должна быть эта комната.' },
      { revealDay: 7, critical: true, text: 'Здесь хранится единственный список второй книги «Поэтики» Аристотеля — о комедии. Здесь Хорхе ждёт Вильгельма в последнюю ночь.' },
    ],
    certainty: 'interpretation',
    sourceIds: ['novel'],
  },
];

export const locationById = new Map(locations.map((l) => [l.id, l]));
