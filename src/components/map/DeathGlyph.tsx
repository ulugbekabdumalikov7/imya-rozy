import { type DeathView } from '../../lib/visible';

export function DeathGlyph({ kind, u }: { kind: DeathView['marker']; u: number }) {
  const r = 7 * u;
  if (kind === 'murder')
    return (
      <>
        <circle r={r} className="glyph-bg" style={{ strokeWidth: 1.2 * u }} />
        <path
          d={`M${-r * 0.42},${-r * 0.42} L${r * 0.42},${r * 0.42} M${r * 0.42},${-r * 0.42} L${-r * 0.42},${r * 0.42}`}
          className="glyph-fg"
          style={{ strokeWidth: 1.5 * u }}
        />
      </>
    );
  if (kind === 'other')
    return (
      <>
        <circle r={r} className="glyph-bg" style={{ strokeWidth: 1.4 * u }} />
        <path
          d={`M0,${-r * 0.55} L0,${r * 0.55} M${-r * 0.34},${-r * 0.15} L${r * 0.34},${-r * 0.15}`}
          className="glyph-fg"
          style={{ strokeWidth: 1.3 * u }}
        />
      </>
    );
  return (
    <>
      <circle r={r} className="glyph-bg" style={{ strokeWidth: 1.4 * u }} />
      <text style={{ fontSize: 10 * u }} textAnchor="middle" dominantBaseline="central" className="glyph-text">
        ?
      </text>
    </>
  );
}
