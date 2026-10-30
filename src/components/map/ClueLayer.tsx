import { hotspotAnchor } from '../../data';
import type { PlanHotspot } from '../../data/plans';

interface Props {
  /** Число видимых улик по зонам плана. */
  counts: Map<string, number>;
  hotspots: PlanHotspot[];
  unit: number;
  click: (fn: () => void) => () => void;
  onPick: (h: PlanHotspot) => void;
}

/** Ромбики с числом улик в зоне. */
export function ClueLayer({ counts, hotspots, unit, click, onPick }: Props) {
  return (
    <g className="layer-clues">
      {[...counts.entries()].map(([id, n]) => {
        const h = hotspots.find((x) => x.id === id);
        if (!h) return null;
        const a = hotspotAnchor(h);
        const s = 8 * unit;
        return (
          <g
            key={id}
            transform={`translate(${a[0] + 8 * unit} ${a[1] + 16 * unit})`}
            onClick={click(() => onPick(h))}
            className="marker marker-clue"
          >
            <title>{`Улики и предметы: ${n}`}</title>
            <rect x={-s} y={-s} width={2 * s} height={2 * s} transform="rotate(45)" />
            <text style={{ fontSize: 9.5 * unit }} textAnchor="middle" dominantBaseline="central">
              {n}
            </text>
          </g>
        );
      })}
    </g>
  );
}
