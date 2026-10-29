import type { DeathCase } from './types';

/**
 * Дела о смертях. Разделяются:
 *  — место обнаружения тела (foundLocationId);
 *  — место фактической смерти, если оно известно и отличается (deathLocationId, со своим уровнем раскрытия);
 *  — первоначальная версия, сведения по ходу дела и итоговое объяснение.
 */
export const deaths: DeathCase[] = [
  {
    id: 'd-adelmo', characterId: 'adelmo', eventId: 'e-adelmo-death', foundLocationId: 'ravine', day: 0,
    circumstances: 'Тело найдено после метели в обрыве под Эдифицием, между северной и восточной башнями, присыпанное снегом и осыпью.',
    initialVersion: { revealDay: 0, text: 'Аббат не знает, упал ли Адельм, бросился сам или его выбросили из окна Эдифиция, и боится, что это убийство.', certainty: 'confirmed' },
    revealedLater: [
      { revealDay: 1, text: 'Вильгельм считает убийство маловероятным: чтобы выбросить тело из окна, его пришлось бы поднять наверх. Проще предположить, что Адельм бросился сам.', certainty: 'interpretation' },
      { revealDay: 2, text: 'Беренгар видел Адельма в ту ночь на кладбище в отчаянии; Бенций рассказывает о сделке с Беренгаром и исповеди у Хорхе.', certainty: 'confirmed' },
    ],
    finalExplanation: { revealDay: 2, text: 'Самоубийство. После сделки с Беренгаром и исповеди Адельм ушёл с кладбища к ограде и бросился в обрыв ещё до бури; осыпь потом принесла тело к подножию Эдифиция. Убийцы у этой смерти нет.', certainty: 'confirmed' },
    deathLocationId: { revealDay: 2, locationId: 'ravine', text: 'По выводу Вильгельма — с ограды за конюшнями, а не из окна Эдифиция.', certainty: 'interpretation' },
    finalKind: 'suicide',
    clueIds: ['c-adelmo-fall', 't-berengar-ghost', 'f-adelmo-suicide'],
    relatedCharacterIds: ['berengar', 'abbo', 'william'],
    revealDay: 0, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'd-venantius', characterId: 'venantius', eventId: 'e-venantius-found', foundLocationId: 'pigsty', day: 2,
    circumstances: 'Утром после утрени тело торчит вниз головой из большого сосуда со свиной кровью у свинарника.',
    initialVersion: { revealDay: 2, text: 'Убийство, связанное со смертью Адельма; жуткая постановка заставляет думать о злом умысле.', certainty: 'confirmed' },
    revealedLater: [
      { revealDay: 2, text: 'На теле нет ран; к сосуду тянется след от Эдифиция. Похоже, Венанций был мёртв до того, как попал в кровь.', certainty: 'interpretation' },
      { revealDay: 4, text: 'У Беренгара после смерти те же почерневшие пальцы и язык — признак общего яда.', certainty: 'confirmed' },
      { revealDay: 4, text: 'Ремигий признаётся, что ночью видел тело Венанция в кухне Эдифиция рядом с разбитой чашей и промолчал.', certainty: 'confirmed' },
    ],
    finalExplanation: { revealDay: 7, critical: true, text: 'Венанций умер от яда, читая книгу из Finis Africae. Беренгар нашёл тело и, боясь разоблачения, бросил его в сосуд с кровью.', certainty: 'confirmed' },
    deathLocationId: { revealDay: 4, locationId: 'kitchen', text: 'По словам Ремигия, ночью тело лежало в кухне Эдифиция; к свинарнику его перенесли позже.', certainty: 'interpretation' },
    finalKind: 'poison',
    clueIds: ['c-snow-trail', 'c-black-fingers', 't-remigio-kitchen', 'f-berengar-moved', 'f-poison-book'],
    relatedCharacterIds: ['berengar', 'jorge', 'severinus'],
    revealDay: 2, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'd-berengar', characterId: 'berengar', eventId: 'e-berengar-found', foundLocationId: 'balneary', day: 3,
    circumstances: 'Ночью третьего дня, после исповеди Адсона, Вильгельм и Адсон находят пропавшего Беренгара утонувшим в ванне купальни.',
    initialVersion: { revealDay: 3, text: 'Утопленник — похоже на продолжение серии; кто-то, возможно, утопил его.', certainty: 'interpretation' },
    revealedLater: [
      { revealDay: 4, text: 'Утром Северин замечает почерневшие язык и пальцы, узнаёт признаки отравления и вспоминает о пропавшем у него яде.', certainty: 'confirmed' },
      { revealDay: 4, text: 'В одежде Беренгара Северин находит украденные очки Вильгельма.', certainty: 'confirmed' },
    ],
    finalExplanation: { revealDay: 7, critical: true, text: 'Беренгар унёс книгу и прочёл её. Отравленный, он пошёл в купальню облегчить жжение и умер в воде. Никто его не топил.', certainty: 'interpretation' },
    finalKind: 'poison',
    clueIds: ['c-black-tongue', 'c-bloody-cloth', 't-severinus-poison', 'f-poison-book'],
    relatedCharacterIds: ['severinus', 'malachi', 'jorge', 'william', 'adso'],
    revealDay: 3, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'd-severinus', characterId: 'severinus', eventId: 'e-severinus-killed', foundLocationId: 'hospital', day: 5,
    circumstances: 'Травник лежит в своей лаборатории с разбитой головой; рядом армиллярная сфера. В лаборатории схвачен келарь Ремигий. Книги, о которой говорил Северин, нет.',
    initialVersion: { revealDay: 5, text: 'Бернард Ги объявляет убийцей Ремигия, застигнутого на месте.', certainty: 'confirmed' },
    revealedLater: [
      { revealDay: 5, text: 'Бенций видел, как до прихода Ремигия в лечебнице прятался Малахия.', certainty: 'confirmed' },
      { revealDay: 5, text: 'Книгу ещё до прихода Вильгельма унёс Бенций и отдал Малахии.', certainty: 'confirmed' },
      { revealDay: 6, text: 'Смерть Малахии при арестованном Ремигии опровергает обвинение.', certainty: 'confirmed' },
    ],
    finalExplanation: { revealDay: 7, critical: true, text: 'Убийство. Малахия ударил Северина армиллярной сферой. Хорхе, хотевший вернуть книгу, внушил ему, что Беренгар и Северин были любовниками, и ревность толкнула Малахию на убийство.', certainty: 'confirmed' },
    finalKind: 'killed',
    clueIds: ['c-armillary', 'c-strange-book', 't-benno-malachi', 't-benno-book', 'f-malachi-killed'],
    relatedCharacterIds: ['malachi', 'jorge', 'remigio', 'benno', 'bernard'],
    revealDay: 5, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'd-malachi', characterId: 'malachi', eventId: 'e-malachi-death', foundLocationId: 'church', day: 6,
    circumstances: 'Во время утрени библиотекарь падает на хорах и умирает, бормоча о скорпионах. Пальцы у него чёрные.',
    initialVersion: { revealDay: 6, text: 'Очередная смерть с признаками яда; дело Бернарда Ги рассыпается.', certainty: 'confirmed' },
    revealedLater: [
      { revealDay: 6, text: 'Перед смертью Малахия говорит, что его предупреждали.', certainty: 'confirmed' },
    ],
    finalExplanation: { revealDay: 7, critical: true, text: 'Малахия получил книгу от Бенция и, не послушав запрета Хорхе, раскрыл её. Яд со страниц убил его.', certainty: 'confirmed' },
    finalKind: 'poison',
    clueIds: ['c-malachi-words', 'c-black-fingers', 'f-poison-book'],
    relatedCharacterIds: ['jorge', 'benno', 'abbo'],
    revealDay: 6, certainty: 'confirmed', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'd-abbo', characterId: 'abbo', eventId: 'e-abbot-trapped', foundLocationId: 'finis-africae', bodyNotFound: true, day: 6,
    circumstances: 'После повечерия шестого дня аббат один входит в Эдифиций и не возвращается.',
    initialVersion: { revealDay: 6, text: 'Никто не знает, куда пропал аббат.', certainty: 'confirmed' },
    revealedLater: [],
    finalExplanation: { revealDay: 7, critical: true, text: 'Хорхе запер его на узкой лестнице в стене, ведущей к Finis Africae, и отказался освободить; аббат задохнулся. Тела никто не находит: потом начинается пожар.', certainty: 'interpretation' },
    finalKind: 'trapped',
    clueIds: [],
    relatedCharacterIds: ['jorge', 'william'],
    revealDay: 7, critical: true, certainty: 'interpretation', sourceIds: ['novel', 'wiki-novel'],
  },
  {
    id: 'd-jorge', characterId: 'jorge', eventId: 'e-fire', foundLocationId: 'library', bodyNotFound: true, day: 7,
    circumstances: 'Последняя ночь, библиотека.',
    initialVersion: { revealDay: 7, critical: true, text: 'Хорхе ест отравленные страницы, чтобы книга не досталась Вильгельму.', certainty: 'confirmed' },
    revealedLater: [],
    finalExplanation: { revealDay: 7, critical: true, text: 'Хорхе гибнет в пожаре, начавшемся, когда в погоне на пол попал светильник Адсона. Его смерть — сознательный выбор, который совпадает с гибелью библиотеки.', certainty: 'confirmed' },
    finalKind: 'fire',
    clueIds: ['c-poetics'],
    relatedCharacterIds: ['william', 'adso'],
    revealDay: 7, critical: true, certainty: 'confirmed', sourceIds: ['novel'],
  },
];

export const deathByCharacter = new Map(deaths.map((d) => [d.characterId, d]));
export const deathById = new Map(deaths.map((d) => [d.id, d]));
