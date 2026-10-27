import { AlertTriangle, ArrowRight, MapPinned } from 'lucide-react';
import { ABBEY_LEGEND, type PlanHotspot } from '../data/plans';
import { locationById, plans } from '../data';
import type { MapView } from '../data/types';
import { useSpoiler } from '../state/spoiler';
import { CertaintyBadge, LocChip, Withheld } from './ui';

/** Видимые тексты зоны с учётом режима раскрытия сюжета. */
export function hotspotTexts(h: PlanHotspot, known: boolean) {
  return {
    name: known ? h.name : h.safeName ?? h.name,
    description: known ? h.description : h.safeDescription ?? (h.zone ? `${h.zone}.` : ''),
    note: known ? h.note : undefined,
    en: known ? h.en : undefined,
  };
}

/** Сведения с эталонного плана: буква и легенда дословно, описание, оговорки. */
export function PlanFacts({ h, asPartOf, onOpenPlan }: { h: PlanHotspot; asPartOf?: string; onOpenPlan?: (v: MapView) => void }) {
  const { visible } = useSpoiler();
  const t = hotspotTexts(h, !h.revealDay || visible({ revealDay: h.revealDay }));
  const plan = plans[h.plan];
  return (
    <section className="plan-facts" aria-label="Сведения с плана">
      <p className="plan-facts-kicker"><MapPinned size={13} aria-hidden="true" /> На плане · <span lang="it">{plan.titleIt}</span></p>
      {asPartOf && <p className="small">Отдельно на плане не нарисовано, показано в составе: <strong>{asPartOf}</strong>.</p>}
      <p className="plan-facts-name">
        {h.printed && <span className={`plan-letter${h.red ? ' is-red' : ''}`} title="Буква, напечатанная на плане" lang="la">{h.printed}</span>}
        <span>{t.name}</span>
      </p>
      {h.legend && (
        <p className={`plan-legend-line${h.legendConflict ? ' is-conflict' : ''}`}>
          Легенда плана: <span lang="it">{h.printed} — {h.legend}</span>
          {h.legendConflict && <> <span className="legend-mismatch"><AlertTriangle size={13} aria-hidden="true" /> не совпадает с рисунком</span></>}
        </p>
      )}
      {h.plan === 'abbey' && h.printed && !h.legend && <p className="plan-legend-line">Этой буквы нет в легенде.</p>}
      <p>{t.description}</p>
      {t.note && <p className="plan-note"><CertaintyBadge c={h.certainty} /> {t.note}</p>}
      {!t.note && h.certainty !== 'confirmed' && <p className="plan-note"><CertaintyBadge c={h.certainty} /></p>}
      {t.en && (
        <details className="plan-en">
          <summary>По-английски</summary>
          <div lang="en">
            <p><strong>{t.en.name}.</strong> {t.en.description}</p>
            {t.en.note && <p className="small">{t.en.note}</p>}
          </div>
        </details>
      )}
      {h.opensPlan && onOpenPlan && (
        <button type="button" className="btn btn-small btn-accent" onClick={() => onOpenPlan(h.opensPlan!)}>
          Открыть {h.opensPlan === 'library' ? 'план библиотеки' : 'план аббатства'} <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

/** Карточка зоны, не связанной с местом атласа (или связанной, но ещё не раскрытой). */
export function HotspotCard({ h, onOpenPlan, onPickLocation }: { h: PlanHotspot; onOpenPlan: (v: MapView) => void; onPickLocation: (id: string) => void }) {
  const { visible } = useSpoiler();
  const t = hotspotTexts(h, !h.revealDay || visible({ revealDay: h.revealDay }));
  const loc = h.locationId ? locationById.get(h.locationId) : undefined;
  const locKnown = loc && visible({ revealDay: loc.revealDay ?? 0 });
  return (
    <article className="card stagger">
      <p className="card-kicker">{plans[h.plan].titleRu}</p>
      <h2 className="card-title">{t.name}</h2>
      <PlanFacts h={h} onOpenPlan={onOpenPlan} />
      {loc && (locKnown
        ? <div className="chip-block"><h4>Место в атласе</h4><div className="chips"><LocChip id={loc.id} onPick={onPickLocation} /></div></div>
        : <Withheld>Связь этой комнаты с событиями романа откроется позже по ходу чтения.</Withheld>)}
      {!loc && <p className="small muted">Атлас не связывает эту зону ни с одним местом романа: план её показывает, но текст не позволяет надёжно её опознать.</p>}
    </article>
  );
}

export function AbbeyLegend() {
  const conflicts = ABBEY_LEGEND.filter((l) => l.conflict && l.onPlan);
  const doubles = ABBEY_LEGEND.filter((l) => !l.conflict && l.onPlan).map((l) => l.letter);
  return (
    <div className="plan-legend">
      <p className="legend-title">Легенда плана · <span lang="it">L'Abbazia</span></p>
      {/* сама легенда — как на плане: буква, итальянская подпись, перевод */}
      <dl>
        {ABBEY_LEGEND.map((l) => (
          <div key={l.letter} className={l.conflict ? 'is-conflict' : undefined}>
            <dt lang="la">{l.letter}{l.conflict && <span className="legend-mark" aria-label="не совпадает с рисунком">*</span>}</dt>
            <dd><span lang="it">{l.it}</span> · <span className="muted">{l.ru}</span></dd>
          </div>
        ))}
      </dl>
      <details className="legend-why">
        <summary>* Почему эти буквы не совпадают с рисунком</summary>
        <p>Легенда напечатана на самом плане, но четыре буквы стоят не на тех постройках, что в ней названы:</p>
        <ul>
          {conflicts.map((l) => <li key={l.letter}><strong lang="la">{l.letter}</strong> — {l.onPlan!.replace(/^на плане \S+ стоит /, '')}.</li>)}
        </ul>
        <p>Атлас называет постройки по рисунку и роману, а буквы показывает как есть. Буквы {doubles.join(', ')} напечатаны дважды; буквы K в легенде нет.</p>
      </details>
    </div>
  );
}
