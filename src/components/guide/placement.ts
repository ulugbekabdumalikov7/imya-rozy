import type { Rect } from './useSpotlight';

export type Side = 'below' | 'above' | 'right' | 'left' | 'center' | 'dock';

export interface Placement {
  x: number;
  y: number;
  side: Side;
  /** Нить от карточки к цели: точка на краю карточки и точка у цели. Нет нити — null. */
  thread: { from: [number, number]; to: [number, number]; vertical: boolean } | null;
}

const MARGIN = 16;
const GAP = 22;
/** До этой ширины экрана карточка занимает всю ширину и стоит над целью или под ней. */
export const NARROW = 640;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Где поставить карточку шага: рядом с целью и не поверх неё. Сначала под целью, потом над ней,
 * на широком экране — сбоку; если места нет нигде — у нижнего края (на телефоне) или в центре.
 */
export function placeCard(
  target: Rect | undefined,
  card: { w: number; h: number },
  vp: { w: number; h: number },
): Placement {
  const center = { x: (vp.w - card.w) / 2, y: (vp.h - card.h) / 2 };
  if (!target) return { ...center, side: 'center', thread: null };

  const narrow = vp.w <= NARROW;
  const tcx = target.x + target.w / 2;
  const tcy = target.y + target.h / 2;
  const alignX = clamp(tcx - card.w / 2, MARGIN, vp.w - card.w - MARGIN);
  const alignY = clamp(tcy - card.h / 2, MARGIN, vp.h - card.h - MARGIN);
  const fitsY = (y: number) => y >= MARGIN && y + card.h <= vp.h - MARGIN;
  const fitsX = (x: number) => x >= MARGIN && x + card.w <= vp.w - MARGIN;
  const edgeX = (x: number) => clamp(tcx, x + 24, x + card.w - 24);
  const edgeY = (y: number) => clamp(tcy, y + 24, y + card.h - 24);

  const below = target.y + target.h + GAP;
  if (fitsY(below)) {
    return {
      x: alignX,
      y: below,
      side: 'below',
      thread: { from: [edgeX(alignX), below], to: [tcx, target.y + target.h], vertical: true },
    };
  }
  const above = target.y - GAP - card.h;
  if (fitsY(above)) {
    const y = above + card.h;
    return {
      x: alignX,
      y: above,
      side: 'above',
      thread: { from: [edgeX(alignX), y], to: [tcx, target.y], vertical: true },
    };
  }
  if (!narrow) {
    const right = target.x + target.w + GAP;
    if (fitsX(right)) {
      return {
        x: right,
        y: alignY,
        side: 'right',
        thread: { from: [right, edgeY(alignY)], to: [target.x + target.w, tcy], vertical: false },
      };
    }
    const left = target.x - GAP - card.w;
    if (fitsX(left)) {
      const x = left + card.w;
      return {
        x: left,
        y: alignY,
        side: 'left',
        thread: { from: [x, edgeY(alignY)], to: [target.x, tcy], vertical: false },
      };
    }
    return { ...center, side: 'center', thread: null };
  }
  // телефон: у нижнего края; нить — если цель видна над карточкой
  const y = vp.h - card.h - MARGIN;
  const thread =
    target.y + target.h < y - 8
      ? {
          from: [edgeX(MARGIN), y] as [number, number],
          to: [tcx, target.y + target.h] as [number, number],
          vertical: true,
        }
      : null;
  return { x: MARGIN, y, side: 'dock', thread };
}

/** Плавная кривая нити: выходит из карточки перпендикулярно её краю. */
export function threadPath(t: NonNullable<Placement['thread']>): string {
  const [ax, ay] = t.from;
  const [bx, by] = t.to;
  if (t.vertical) {
    const my = (ay + by) / 2;
    return `M${ax},${ay} C${ax},${my} ${bx},${my} ${bx},${by}`;
  }
  const mx = (ax + bx) / 2;
  return `M${ax},${ay} C${mx},${ay} ${mx},${by} ${bx},${by}`;
}
