import { createContext, useContext } from 'react';

import { anchorIn as planAnchorIn, hotspotAnchor, hotspotIn } from '../../data';
import { BUILDINGS, CLIFF } from '../../data/abbeyModel';
import type { PlanHotspot } from '../../data/plans';
import type { MapView } from '../../data/types';
import type { Projector } from '../../lib/model3d';

/**
 * Где на экране стоят знаки слоёв карты. На плоском плане — прямо в точке привязки зоны;
 * на объёмном макете аббатства — над крышей здания, с учётом поворота и наклона камеры.
 * Слои (люди, улики, смерти, маршрут, «Час за часом», встреча) берут координаты только отсюда.
 */
export interface MapGeometry {
  anchor: (h: PlanHotspot) => [number, number];
  anchorIn: (view: MapView, locationId: string) => [number, number] | null;
}

export const FLAT_GEOMETRY: MapGeometry = { anchor: hotspotAnchor, anchorIn: planAnchorIn };

const ProjectionContext = createContext<MapGeometry>(FLAT_GEOMETRY);
export const ProjectionProvider = ProjectionContext.Provider;
export const useMapGeometry = () => useContext(ProjectionContext);

/** Высота «булавки» над зоной: над крышей здания или у земли для открытых мест. */
export const pinHeight = (h: PlanHotspot) =>
  h.id === 'ab-cliff' ? -CLIFF.drop * 0.45 : (BUILDINGS[h.id.replace(/^ab-/, '')]?.pin ?? 2);

export function modelGeometry(proj: Projector, grow = 1): MapGeometry {
  const anchor = (h: PlanHotspot): [number, number] => {
    const a = hotspotAnchor(h);
    return proj.pt(a[0], a[1], pinHeight(h) * grow);
  };
  return {
    anchor,
    anchorIn: (view, locationId) => {
      if (view !== 'abbey') return planAnchorIn(view, locationId);
      const h = hotspotIn('abbey', locationId);
      return h ? anchor(h) : null;
    },
  };
}
