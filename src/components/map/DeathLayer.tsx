import { characterById, dayLabel } from '../../data';
import { DeathGlyph } from './DeathGlyph';
import type { DeathMarker } from './useMapMarkers';

const KIND_LABELS = { unresolved: 'обстоятельства не выяснены', murder: 'убийство', other: 'иная смерть' } as const;

interface Props {
  markers: DeathMarker[];
  unit: number;
  /** Слой «Расследование»: смерти пронумерованы и связаны нитью по порядку дней. */
  numbered: boolean;
  selectedEventId?: string;
  /** Обёртка, которая не пропускает нажатие после перетаскивания плана. */
  click: (fn: () => void) => () => void;
  onPickEvent: (id: string) => void;
}

/** Знаки смертей: где нашли тело, и пунктиром — где человек умер, если это другое место. */
export function DeathLayer({ markers, unit, numbered, selectedEventId, click, onPickEvent }: Props) {
  return (
    <>
      {numbered && markers.length > 1 && (
        <polyline
          className="investigation-thread"
          points={markers.map((m) => `${m.x},${m.y}`).join(' ')}
          style={{ strokeWidth: 1.4 * unit, strokeDasharray: `${5 * unit} ${5 * unit}` }}
        />
      )}

      <g className={`layer-deaths${numbered ? ' show-death-labels' : ''}`}>
        {markers.map((m, idx) => {
          const victim = characterById.get(m.v.death.characterId)!;
          const sel = selectedEventId === m.v.death.eventId;
          const kindLabel = KIND_LABELS[m.v.marker];
          return (
            <g key={m.v.death.id}>
              {m.site && (
                <>
                  <line
                    x1={m.x}
                    y1={m.y}
                    x2={m.site.x}
                    y2={m.site.y}
                    className="death-link"
                    style={{ strokeWidth: unit, strokeDasharray: `${3 * unit} ${4 * unit}` }}
                  />
                  <g
                    transform={`translate(${m.site.x} ${m.site.y})`}
                    className="marker marker-death-site"
                    onClick={click(() => onPickEvent(m.v.death.eventId))}
                  >
                    <title>{`${victim.short}: место смерти`}</title>
                    <circle
                      r={8 * unit}
                      style={{ strokeWidth: 1.2 * unit, strokeDasharray: `${2.5 * unit} ${2 * unit}` }}
                    />
                    <circle r={2.5 * unit} className="dot" />
                  </g>
                </>
              )}
              <g
                transform={`translate(${m.x} ${m.y})`}
                className={`marker marker-death marker-${m.v.marker}${sel ? ' is-selected' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`${victim.short}: ${kindLabel}, ${dayLabel(m.v.death.day).toLowerCase()}`}
                onClick={click(() => onPickEvent(m.v.death.eventId))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onPickEvent(m.v.death.eventId);
                }}
                style={{ ['--pd' as string]: `${idx * 0.9}s` }}
              >
                <circle r={14 * unit} className="hit" />
                <circle r={7 * unit} className="pulse" style={{ strokeWidth: unit }} />
                <circle r={13 * unit} className="halo" style={{ strokeWidth: unit }} />
                <g className="death-core">
                  <DeathGlyph kind={m.v.marker} u={unit} />
                </g>
                <text
                  x={16 * unit}
                  y={0}
                  style={{ fontSize: 11.5 * unit }}
                  dominantBaseline="middle"
                  className="marker-label"
                >
                  {numbered ? `${idx + 1}. ` : ''}
                  {victim.short}
                  <tspan className="ml-day"> · {m.v.death.day === 0 ? 'до прибытия' : `д. ${m.v.death.day}`}</tspan>
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </>
  );
}
