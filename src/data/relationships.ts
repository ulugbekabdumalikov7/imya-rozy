import type { CharacterRelationship, RelationType } from './types';

export const relationLabels: Record<RelationType, string> = {
  mentor: 'учитель и ученик',
  superior: 'подчинение',
  trust: 'доверие',
  conflict: 'конфликт',
  ideological: 'идейное противостояние',
  dependence: 'скрытая зависимость',
  suspicion: 'подозрение',
  cooperation: 'сотрудничество',
  complicity: 'соучастие',
  secret: 'общая тайна',
  political: 'политическое противостояние',
  attachment: 'личная привязанность',
  'shared-interest': 'общий интерес',
};

const R = (
  id: string, from: string, to: string, directed: boolean, strength: 1 | 2 | 3,
  phases: CharacterRelationship['phases'], eventIds: string[],
  revealDay = 0, critical = false, certainty: CharacterRelationship['certainty'] = 'confirmed',
): CharacterRelationship => ({
  id, fromCharacterId: from, toCharacterId: to, directed, strength, phases, eventIds,
  revealDay, critical, certainty, sourceIds: ['novel'],
});

export const relationships: CharacterRelationship[] = [
  R('r-william-adso', 'william', 'adso', true, 3, [
    { revealDay: 0, type: 'mentor', note: 'Вильгельм учит Адсона видеть знаки; Адсон записывает и не всегда понимает.', certainty: 'confirmed' },
    { revealDay: 3, type: 'attachment', note: 'После ночи с девушкой Адсон исповедуется учителю; их связь становится глубже ученичества.', certainty: 'confirmed' },
    { revealDay: 7, critical: true, type: 'attachment', note: 'Расставаясь в Мюнхене, Вильгельм дарит Адсону очки, сделанные Николаем, и обнимает его по-отечески.', certainty: 'confirmed' },
  ], ['e-arrival', 'e-night-scriptorium', 'e-adso-girl', 'e-finis-africae', 'e-epilogue']),

  R('r-william-abbo', 'william', 'abbo', false, 3, [
    { revealDay: 0, type: 'cooperation', note: 'Аббат поручает расследование, но ограничивает доступ к библиотеке.', certainty: 'confirmed' },
    { revealDay: 4, type: 'suspicion', note: 'Аббат всё больше видит в Вильгельме угрозу репутации обители.', certainty: 'interpretation' },
    { revealDay: 6, type: 'conflict', note: 'Аббат отстраняет Вильгельма и требует его отъезда.', certainty: 'confirmed' },
  ], ['e-abbot-commission', 'e-abbot-dismisses']),

  R('r-william-jorge', 'william', 'jorge', false, 3, [
    { revealDay: 0, type: 'ideological', note: 'Спор о смехе: знание, которое освобождает, против знания, которое охраняют.', certainty: 'confirmed' },
    { revealDay: 6, type: 'suspicion', note: 'Записи каталога наводят Вильгельма на тайного хранителя библиотеки.', certainty: 'confirmed' },
    { revealDay: 7, critical: true, type: 'conflict', note: 'Последняя ночь: следователь и убийца лицом к лицу.', certainty: 'confirmed' },
  ], ['e-scriptorium-laughter', 'e-jorge-sermon', 'e-finis-africae']),

  R('r-william-ubertino', 'william', 'ubertino', false, 2, [
    { revealDay: 0, type: 'trust', note: 'Старые друзья по ордену, при этом спорящие о мистике и разуме.', certainty: 'confirmed' },
    { revealDay: 5, type: 'cooperation', note: 'Вильгельм советует Убертину бежать, пока Бернард Ги его не схватил.', certainty: 'confirmed' },
  ], ['e-ubertino-church', 'e-ubertino-flees']),

  R('r-william-severinus', 'william', 'severinus', false, 2, [
    { revealDay: 0, type: 'cooperation', note: 'Два знатока трав: Северин — главный союзник следствия.', certainty: 'confirmed' },
    { revealDay: 5, type: 'trust', note: 'Именно Вильгельму Северин сообщает о найденной книге.', certainty: 'confirmed' },
  ], ['e-severinus-garden', 'e-venantius-exam', 'e-severinus-strange-book']),

  R('r-william-bernard', 'william', 'bernard', false, 3, [
    { revealDay: 4, type: 'ideological', note: 'Два инквизитора: один ищет истину по уликам, другой — виновного по прошлому.', certainty: 'confirmed' },
    { revealDay: 5, type: 'political', note: 'На диспуте Бернард предлагает Вильгельму изложить свои взгляды папе в Авиньоне; на суде Вильгельм бессилен против его метода.', certainty: 'confirmed' },
  ], ['e-legations-arrive', 'e-disputation', 'e-trial'], 4),

  R('r-william-nicholas', 'william', 'nicholas', false, 1, [
    { revealDay: 0, type: 'shared-interest', note: 'Интерес к стёклам и ремеслу.', certainty: 'confirmed' },
    { revealDay: 6, type: 'cooperation', note: 'Николай-келарь рассказывает историю библиотекарей.', certainty: 'confirmed' },
  ], ['e-nicholas-glass', 'e-new-lenses', 'e-lenses-returned', 'e-nicholas-librarians']),

  R('r-william-malachi', 'malachi', 'william', true, 2, [
    { revealDay: 0, type: 'suspicion', note: 'Библиотекарь не доверяет чужаку и следит за ним в скриптории.', certainty: 'confirmed' },
  ], ['e-scriptorium-laughter', 'e-remigio-pressed']),

  R('r-william-benno', 'benno', 'william', true, 1, [
    { revealDay: 2, type: 'cooperation', note: 'Бенций охотно делится сведениями.', certainty: 'confirmed' },
    { revealDay: 5, type: 'conflict', note: 'Бенций перехватывает книгу и отдаёт её библиотеке.', certainty: 'confirmed' },
  ], ['e-benno-testimony', 'e-benno-tale', 'e-benno-book'], 2),

  R('r-william-michael', 'william', 'michael', false, 2, [
    { revealDay: 4, type: 'cooperation', note: 'Вильгельм — советник францисканской стороны.', certainty: 'confirmed' },
  ], ['e-minorites-arrive', 'e-disputation'], 4),

  R('r-abbo-malachi', 'abbo', 'malachi', true, 2, [
    { revealDay: 0, type: 'superior', note: 'Аббат — формальный глава библиотеки, Малахия — его библиотекарь; за ужином он сидит за столом аббата.', certainty: 'confirmed' },
  ], ['e-abbot-dinner']),

  R('r-jorge-malachi', 'jorge', 'malachi', true, 3, [
    { revealDay: 6, type: 'dependence', note: 'Из хроники назначений видно, что библиотекаря выбирал не аббат.', certainty: 'interpretation' },
    { revealDay: 7, critical: true, type: 'complicity', note: 'Малахия — орудие Хорхе: он хранит тайну и по его наущению убивает Северина.', certainty: 'confirmed' },
  ], ['e-nicholas-librarians', 'e-jorge-confession'], 6),

  R('r-jorge-abbo', 'jorge', 'abbo', false, 2, [
    { revealDay: 0, type: 'cooperation', note: 'Аббат почитает Хорхе как духовный авторитет: слепой старец сидит за его столом.', certainty: 'interpretation' },
    { revealDay: 7, critical: true, type: 'conflict', note: 'Хорхе запирает аббата на лестнице в стене и отказывается его освободить.', certainty: 'interpretation' },
  ], ['e-abbot-dinner', 'e-abbot-trapped', 'e-jorge-confession']),

  R('r-jorge-alinardo', 'jorge', 'alinardo', true, 1, [
    { revealDay: 4, type: 'conflict', note: 'Алинард считает, что его обошли при выборе библиотекаря, отдав должность чужеземцу.', certainty: 'interpretation' },
    { revealDay: 7, critical: true, type: 'conflict', note: 'За выбором библиотекарей все эти десятилетия стоял Хорхе.', certainty: 'interpretation' },
  ], ['e-alinardo-trumpets', 'e-nicholas-librarians', 'e-catalogue', 'e-jorge-confession'], 4, false, 'interpretation'),

  R('r-jorge-venantius', 'jorge', 'venantius', false, 2, [
    { revealDay: 0, type: 'ideological', note: 'В скриптории Венанций вспоминает прежний спор о смехе и Аристотеле; Хорхе отрицает, что помнит его.', certainty: 'confirmed' },
    { revealDay: 7, critical: true, type: 'secret', note: 'Венанций добрался до книги, которую Хорхе охранял.', certainty: 'confirmed' },
  ], ['e-scriptorium-laughter', 'e-benno-testimony', 'e-venantius-dies']),

  R('r-jorge-adelmo', 'jorge', 'adelmo', false, 1, [
    { revealDay: 0, type: 'ideological', note: 'Смешные рисунки Адельма — то, против чего проповедует Хорхе.', certainty: 'confirmed' },
    { revealDay: 2, type: 'secret', note: 'Перед гибелью Адельм исповедался Хорхе; после исповеди он говорил Беренгару, что проклят.', certainty: 'interpretation' },
  ], ['e-scriptorium-laughter', 'e-benno-tale']),

  R('r-malachi-berengar', 'malachi', 'berengar', false, 3, [
    { revealDay: 0, type: 'superior', note: 'Библиотекарь и помощник.', certainty: 'confirmed' },
    { revealDay: 7, critical: true, type: 'attachment', note: 'Их связывала многолетняя близость; на ревности Малахии сыграл Хорхе.', certainty: 'confirmed' },
  ], ['e-scriptorium-laughter', 'e-jorge-confession']),

  R('r-berengar-adelmo', 'berengar', 'adelmo', true, 3, [
    { revealDay: 2, type: 'attachment', note: 'Беренгар вожделел Адельма; на кладбище тот назвал его «прекрасным учителем».', certainty: 'confirmed' },
    { revealDay: 2, type: 'secret', note: 'Сделка: близость в обмен на доступ к запретной книге.', certainty: 'confirmed' },
  ], ['e-adelmo-bargain', 'e-berengar-ghost', 'e-benno-tale'], 2),

  R('r-adelmo-venantius', 'adelmo', 'venantius', false, 2, [
    { revealDay: 0, type: 'shared-interest', note: 'Товарищи по скрипторию.', certainty: 'confirmed' },
    { revealDay: 2, type: 'secret', note: 'После исповеди Адельм рассказал Венанцию о запретной книге.', certainty: 'confirmed' },
  ], ['e-scriptorium-laughter', 'e-benno-tale']),

  R('r-berengar-venantius', 'berengar', 'venantius', false, 2, [
    { revealDay: 0, type: 'shared-interest', note: 'Оба при библиотеке.', certainty: 'confirmed' },
    { revealDay: 7, critical: true, type: 'complicity', note: 'Беренгар прячет тело Венанция и забирает книгу.', certainty: 'confirmed' },
  ], ['e-venantius-dies', 'e-venantius-found']),

  R('r-benno-malachi', 'benno', 'malachi', true, 2, [
    { revealDay: 5, type: 'complicity', note: 'Бенций отдаёт книгу Малахии и получает должность помощника.', certainty: 'confirmed' },
  ], ['e-benno-book'], 5),

  R('r-benno-berengar', 'benno', 'berengar', false, 1, [
    { revealDay: 2, type: 'suspicion', note: 'Бенций раскрывает следствию сделку Беренгара с Адельмом.', certainty: 'confirmed' },
  ], ['e-benno-testimony', 'e-benno-tale'], 2),

  R('r-malachi-severinus', 'malachi', 'severinus', true, 2, [
    { revealDay: 5, type: 'suspicion', note: 'Бенций видел, как Малахия прятался в лечебнице до прихода Ремигия.', certainty: 'confirmed' },
    { revealDay: 7, critical: true, type: 'conflict', note: 'Малахия убивает Северина, поверив Хорхе, что тот был любовником Беренгара.', certainty: 'confirmed' },
  ], ['e-severinus-killed', 'e-jorge-confession'], 5),

  R('r-severinus-berengar', 'severinus', 'berengar', false, 1, [
    { revealDay: 7, critical: true, type: 'secret', note: 'Книга, которую нашёл Северин, — та, что Беренгар перед смертью спрятал в лечебнице. Хорхе ложно выдал их за любовников.', certainty: 'interpretation' },
  ], ['e-berengar-dies', 'e-severinus-killed', 'e-jorge-confession'], 7, true, 'interpretation'),

  R('r-remigio-salvatore', 'remigio', 'salvatore', false, 3, [
    { revealDay: 1, type: 'trust', note: 'Сальватор следует за келарем, как когда-то по дорогам.', certainty: 'confirmed' },
    { revealDay: 3, type: 'secret', note: 'Общее прошлое среди дольчинистов.', certainty: 'confirmed' },
    { revealDay: 4, type: 'complicity', note: 'Сальватор приводит девушек для келаря.', certainty: 'confirmed' },
  ], ['e-aymaro-allusions', 'e-salvatore-story', 'e-remigio-pressed', 'e-trial'], 1),

  R('r-remigio-malachi', 'remigio', 'malachi', false, 1, [
    { revealDay: 4, type: 'secret', note: 'Ремигий говорит, что обязан Малахии.', certainty: 'confirmed' },
    { revealDay: 5, type: 'secret', note: 'На суде выясняется: келарь отдал Малахии на хранение письма Дольчино; Малахия это подтверждает.', certainty: 'confirmed' },
  ], ['e-remigio-pressed', 'e-trial'], 4),

  R('r-bernard-remigio', 'bernard', 'remigio', true, 3, [
    { revealDay: 5, type: 'political', note: 'Инквизитор превращает прошлое келаря в доказательство вины.', certainty: 'confirmed' },
  ], ['e-trial'], 5),

  R('r-bernard-salvatore', 'bernard', 'salvatore', true, 2, [
    { revealDay: 4, type: 'political', note: 'Арест и суд за колдовство и ересь.', certainty: 'confirmed' },
  ], ['e-salvatore-arrest', 'e-trial'], 4),

  R('r-bernard-girl', 'bernard', 'girl', true, 2, [
    { revealDay: 4, type: 'political', note: 'Девушку объявляют ведьмой.', certainty: 'confirmed' },
  ], ['e-salvatore-arrest', 'e-trial'], 4),

  R('r-adso-girl', 'adso', 'girl', false, 3, [
    { revealDay: 3, type: 'attachment', note: 'Единственная любовь Адсона.', certainty: 'confirmed' },
    { revealDay: 4, type: 'attachment', note: 'Адсон бессилен помешать её аресту и обвинению в колдовстве.', certainty: 'confirmed' },
  ], ['e-adso-girl', 'e-salvatore-arrest'], 3),

  R('r-adso-salvatore', 'salvatore', 'adso', true, 1, [
    { revealDay: 3, type: 'shared-interest', note: 'Сальватор рассказывает Адсону о своих скитаниях.', certainty: 'confirmed' },
  ], ['e-ubertino-church', 'e-salvatore-story'], 3),

  R('r-adso-ubertino', 'ubertino', 'adso', true, 1, [
    { revealDay: 3, type: 'mentor', note: 'Убертин наставляет Адсона и рассказывает о Дольчино.', certainty: 'confirmed' },
  ], ['e-dolcino-story'], 3),

  R('r-ubertino-bernard', 'ubertino', 'bernard', false, 2, [
    { revealDay: 5, type: 'political', note: 'Убертин — следующая намеченная жертва инквизитора; он бежит.', certainty: 'confirmed' },
  ], ['e-disputation', 'e-ubertino-flees'], 5),

  R('r-michael-bertrand', 'michael', 'bertrand', false, 3, [
    { revealDay: 4, type: 'political', note: 'Главы двух посольств: орден против папской власти.', certainty: 'confirmed' },
  ], ['e-disputation'], 4),

  R('r-michael-ubertino', 'michael', 'ubertino', false, 1, [
    { revealDay: 4, type: 'cooperation', note: 'Оба защищают бедность ордена, хотя и по-разному.', certainty: 'interpretation' },
  ], ['e-minorites-arrive', 'e-disputation'], 4, false, 'interpretation'),

  R('r-jerome-michael', 'jerome', 'michael', false, 1, [
    { revealDay: 4, type: 'cooperation', note: 'Иероним приезжает с Михаилом, вместе с ним совещается с Вильгельмом и Убертином и на диспуте выступает на стороне ордена.', certainty: 'confirmed' },
  ], ['e-minorites-arrive', 'e-disputation'], 4),

  R('r-bernard-bertrand', 'bernard', 'bertrand', false, 1, [
    { revealDay: 4, type: 'cooperation', note: 'Члены одного посольства: кардинал возглавляет его, инквизитор едет с ним.', certainty: 'confirmed' },
  ], ['e-legations-arrive'], 4),

  R('r-aymaro-malachi', 'aymaro', 'malachi', true, 1, [
    { revealDay: 2, type: 'conflict', note: 'Аймаро жалуется, что аббатством заправляют иностранцы, — а библиотекарь Малахия «немец». Прямой ссоры между ними роман не показывает.', certainty: 'interpretation' },
  ], ['e-scriptorium-laughter', 'e-aymaro-allusions'], 2, false, 'interpretation'),

  R('r-abbo-remigio', 'abbo', 'remigio', true, 1, [
    { revealDay: 0, type: 'superior', note: 'Келарь отвечает перед аббатом за хозяйство.', certainty: 'confirmed' },
    { revealDay: 5, type: 'conflict', note: 'Аббат отдаёт келаря в руки инквизитора.', certainty: 'interpretation' },
  ], ['e-arrival', 'e-trial']),
];

export const relationshipById = new Map(relationships.map((r) => [r.id, r]));
