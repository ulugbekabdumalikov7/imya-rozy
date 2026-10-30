/**
 * Модель данных атласа.
 *
 * Раскрытие сюжета описывается двумя полями у каждой сущности или фрагмента:
 *  - revealDay: день повествования (1–7), начиная с которого сведения известны читателю;
 *    0 — общие сведения о завязке, доступные всегда.
 *  - critical: сведения раскрывают разгадку (виновника, механизм смертей, финал).
 *    Они видны только в режиме «Полное расследование» либо в режиме «По ходу»
 *    при выбранном седьмом дне.
 */

export type Certainty = 'confirmed' | 'interpretation' | 'uncertain';

export interface Gate {
  revealDay: number;
  critical?: boolean;
}

/** Фрагмент текста со своим уровнем раскрытия. */
export interface GatedText extends Gate {
  text: string;
  certainty?: Certainty;
}

export interface SourceReference {
  id: string;
  title: string;
  author?: string;
  kind: 'novel' | 'author-commentary' | 'study' | 'reference' | 'history';
  /** Язык названия, если оно не русское (для корректного произношения экранными чтецами). */
  lang?: 'en' | 'la' | 'it';
  note: string;
  /** Сам источник раскрывает разгадку — показывается только при открытой разгадке. */
  critical?: boolean;
  url?: string;
}

export type CharacterGroup = 'investigators' | 'library' | 'abbey' | 'franciscans' | 'papal' | 'outside';

export interface DossierSection extends Gate {
  heading: string;
  text: string;
  certainty: Certainty;
}

export interface Character extends Gate {
  id: string;
  name: string;
  /** Короткая форма для подписей на графе и карте. */
  short: string;
  alternativeNames: string[];
  originalName: string;
  role: string;
  affiliation: string;
  group: CharacterGroup;
  importance: 'major' | 'secondary' | 'episodic';
  /** Грамматический род для согласования подписей (по умолчанию мужской). */
  gender?: 'm' | 'f';
  libraryRelation: 'keeper' | 'worker' | 'reader' | 'outsider';
  age?: string;
  appearance?: string;
  /** Описание, безопасное с самого начала. */
  summary: string;
  personality: string[];
  /** Мотивы и отношение к идеям — могут раскрывать сюжет, поэтому разбиты по дням. */
  dossier: DossierSection[];
  fate: GatedText[];
  /** Символ для эмблемы вместо выдуманного портрета. */
  emblem:
    | 'lens'
    | 'quill'
    | 'key'
    | 'eye'
    | 'book'
    | 'herb'
    | 'scale'
    | 'cross'
    | 'flame'
    | 'tower'
    | 'bowl'
    | 'seal'
    | 'crown'
    | 'rose'
    | 'hammer'
    | 'glass';
  certainty: Certainty;
  sourceIds: string[];
}

export type LocationType =
  'church' | 'aedificium' | 'library' | 'service' | 'residence' | 'garden' | 'medical' | 'outer' | 'passage';

/** Вид карты: общий план аббатства либо план библиотеки (каждый в своей системе координат). */
export type MapView = 'abbey' | 'library';

export interface Location {
  id: string;
  /** День, с которого помещение известно читателю (по умолчанию 0). */
  revealDay?: number;
  name: string;
  latin?: string;
  type: LocationType;
  /**
   * Где место показано на эталонных планах. hotspot — зона плана (см. data/plans.ts);
   * без hotspot место занимает весь план (например, библиотека целиком).
   * Если поля нет, место на планах не нарисовано и показывается через parentId либо в списке «нет на плане».
   */
  plan?: { view: MapView; hotspot?: string };
  /** Почему места нет на планах (если plan и parentId не помогают). */
  offPlan?: string;
  description: string;
  significance: GatedText[];
  /** Если помещение — часть другого (например, кухня → Эдифиций). */
  parentId?: string;
  certainty: Certainty;
  sourceIds: string[];
}

export type CanonicalHour =
  'matins' | 'lauds' | 'prime' | 'terce' | 'sext' | 'nones' | 'vespers' | 'compline' | 'night' | 'unknown';

export type EventKind =
  'arrival' | 'death' | 'discovery' | 'clue' | 'meeting' | 'library' | 'political' | 'trial' | 'finale' | 'epilogue';

export interface StoryEvent extends Gate {
  id: string;
  title: string;
  /** Название, безопасное до раскрытия (если основное название — спойлер). */
  safeTitle?: string;
  description: string;
  /** Дополнительные сведения, открывающиеся позже. */
  later?: GatedText[];
  significance: string;
  day: number; // 1–7; 0 — предыстория; 8 — эпилог
  hour: CanonicalHour;
  /** Порядок внутри всей хронологии. */
  sequence: number;
  kinds: EventKind[];
  locationId?: string;
  characterIds: string[];
  clueIds: string[];
  relatedEventIds: string[];
  certainty: Certainty;
  sourceIds: string[];
}

export type DeathKind = 'suicide' | 'poison' | 'killed' | 'trapped' | 'fire';

export interface DeathCase extends Gate {
  id: string;
  characterId: string;
  /** Событие обнаружения или гибели. */
  eventId: string;
  foundLocationId: string;
  /** Тело не найдено (foundLocationId тогда — место гибели). */
  bodyNotFound?: boolean;
  /** Место фактической смерти, если известно и отличается. */
  deathLocationId?: GatedText & { locationId: string };
  day: number;
  circumstances: string;
  initialVersion: GatedText;
  revealedLater: GatedText[];
  finalExplanation: GatedText;
  /** Итоговая природа смерти — показывается только вместе с finalExplanation. */
  finalKind: DeathKind;
  clueIds: string[];
  relatedCharacterIds: string[];
  certainty: Certainty;
  sourceIds: string[];
}

export type RelationType =
  | 'mentor'
  | 'superior'
  | 'trust'
  | 'conflict'
  | 'ideological'
  | 'dependence'
  | 'suspicion'
  | 'cooperation'
  | 'complicity'
  | 'secret'
  | 'political'
  | 'attachment'
  | 'shared-interest';

export interface RelationPhase extends Gate {
  type: RelationType;
  note: string;
  certainty: Certainty;
}

export interface CharacterRelationship extends Gate {
  id: string;
  fromCharacterId: string;
  toCharacterId: string;
  directed: boolean;
  /** Смена характера отношения по ходу сюжета. */
  phases: RelationPhase[];
  eventIds: string[];
  strength: 1 | 2 | 3;
  certainty: Certainty;
  sourceIds: string[];
}

export type ClueKind = 'clue' | 'testimony' | 'fact' | 'object';

export interface Clue extends Gate {
  id: string;
  kind: ClueKind;
  title: string;
  description: string;
  /** Кто это утверждает (для свидетельств). */
  speakerId?: string;
  later?: GatedText[];
  locationId?: string;
  eventId: string;
  characterIds: string[];
  certainty: Certainty;
  sourceIds: string[];
}

export type HypothesisStatus = 'confirmed' | 'partial' | 'refuted' | 'open';

export interface HypothesisLink {
  clueId: string;
  relation: 'supports' | 'contradicts' | 'context';
  note: string;
  revealDay: number;
  critical?: boolean;
}

export interface Hypothesis extends Gate {
  id: string;
  title: string;
  holderIds: string[];
  statement: string;
  /** Статус в момент выдвижения — до разгадки. */
  initialStatus: HypothesisStatus;
  finalStatus: HypothesisStatus;
  verdict: GatedText;
  links: HypothesisLink[];
  eventIds: string[];
  sourceIds: string[];
}

export interface RouteStep {
  locationId: string;
  eventId?: string;
  day: number;
  note: string;
  /** confirmed — по тексту; reconstructed — восстановлено по косвенным данным; gap — местонахождение неизвестно. */
  kind: 'confirmed' | 'reconstructed' | 'gap';
  revealDay: number;
  critical?: boolean;
}

export interface Route {
  id: string;
  characterId: string;
  title: string;
  steps: RouteStep[];
}

export interface HistoricalNote {
  id: string;
  title: string;
  short: string;
  detail: string;
  inNovel: string;
  factVsFiction: string;
  /** Версии текста без разгадки — используются, пока разгадка скрыта. */
  safe?: { title?: string; short?: string; detail?: string; inNovel?: string; factVsFiction?: string };
  characterIds: string[];
  eventIds: string[];
  locationIds: string[];
  sourceIds: string[];
}

export interface TimelineDay {
  day: number;
  title: string;
  summary: GatedText[];
}
