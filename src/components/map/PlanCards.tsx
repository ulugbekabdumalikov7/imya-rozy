import { ArrowRight, MapPinned } from 'lucide-react';

import { locationById, plans } from '../../data';
import { ABBEY_LEGEND, type PlanHotspot } from '../../data/plans';
import type { MapView } from '../../data/types';
import { useSpoiler } from '../../state/spoiler';
import { CertaintyBadge, LocChip, Withheld } from '../ui';

/** Видимые тексты зоны с учётом режима раскрытия сюжета. */
export function hotspotTexts(h: PlanHotspot, known: boolean) {
  return {
    name: known ? h.name : (h.safeName ?? h.name),
    description: known ? h.description : (h.safeDescription ?? (h.zone ? `${h.zone}.` : '')),
    note: known ? h.note : undefined,
    en: known ? h.en : undefined,
  };
}

/** Сведения с эталонного плана: буква и название по легенде, описание, оговорки. */
export function PlanFacts({
  h,
  asPartOf,
  onOpenPlan,
}: {
  h: PlanHotspot;
  asPartOf?: string;
  onOpenPlan?: (v: MapView) => void;
}) {
  const { visible } = useSpoiler();
  const t = hotspotTexts(h, !h.revealDay || visible({ revealDay: h.revealDay }));
  const plan = plans[h.plan];
  return (
    <section className="plan-facts" aria-label="Сведения с плана">
      <p className="plan-facts-kicker">
        <MapPinned size={13} aria-hidden="true" /> На плане · <span lang={plan.titleLang}>{plan.titleOrig}</span>
      </p>
      {asPartOf && (
        <p className="small">
          Отдельно на плане не нарисовано, показано в составе: <strong>{asPartOf}</strong>.
        </p>
      )}
      <p className="plan-facts-name">
        {h.printed && (
          <span className={`plan-letter${h.red ? ' is-red' : ''}`} title="Буква, напечатанная на плане" lang="la">
            {h.printed}
          </span>
        )}
        <span>{t.name}</span>
      </p>
      {h.legend &&
        (() => {
          const it = ABBEY_LEGEND.find((l) => l.letter === h.printed)?.it;
          return (
            <p className="plan-legend-line">
              Название — по легенде плана
              {it && (
                <>
                  ; в итальянском издании — <span lang="it">{it}</span>
                </>
              )}
              .
            </p>
          );
        })()}
      <p>{t.description}</p>
      {t.note && (
        <p className="plan-note">
          <CertaintyBadge c={h.certainty} /> {t.note}
        </p>
      )}
      {!t.note && h.certainty !== 'confirmed' && (
        <p className="plan-note">
          <CertaintyBadge c={h.certainty} />
        </p>
      )}
      {t.en && (
        <details className="plan-en">
          <summary>По-английски</summary>
          <div lang="en">
            <p>
              <strong>{t.en.name}.</strong> {t.en.description}
            </p>
            {t.en.note && <p className="small">{t.en.note}</p>}
          </div>
        </details>
      )}
      {h.opensPlan && onOpenPlan && (
        <button type="button" className="btn btn-small btn-accent" onClick={() => onOpenPlan(h.opensPlan!)}>
          Открыть {h.opensPlan === 'library' ? 'план библиотеки' : 'план аббатства'}{' '}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
    </section>
  );
}

/** Карточка зоны, не связанной с местом атласа (или связанной, но ещё не раскрытой). */
export function HotspotCard({
  h,
  onOpenPlan,
  onPickLocation,
}: {
  h: PlanHotspot;
  onOpenPlan: (v: MapView) => void;
  onPickLocation: (id: string) => void;
}) {
  const { visible } = useSpoiler();
  const t = hotspotTexts(h, !h.revealDay || visible({ revealDay: h.revealDay }));
  const loc = h.locationId ? locationById.get(h.locationId) : undefined;
  const locKnown = loc && visible({ revealDay: loc.revealDay ?? 0 });
  return (
    <article className="card stagger">
      <p className="card-kicker">{plans[h.plan].titleRu}</p>
      <h2 className="card-title">{t.name}</h2>
      <PlanFacts h={h} onOpenPlan={onOpenPlan} />
      {loc &&
        (locKnown ? (
          <div className="chip-block">
            <h4>Место в атласе</h4>
            <div className="chips">
              <LocChip id={loc.id} onPick={onPickLocation} />
            </div>
          </div>
        ) : (
          <Withheld>Связь этой комнаты с событиями романа откроется позже по ходу чтения.</Withheld>
        ))}
      {!loc && (
        <p className="small muted">
          Атлас не связывает эту зону ни с одним местом романа: план её показывает, но текст не позволяет надёжно её
          опознать.
        </p>
      )}
    </article>
  );
}

export function AbbeyLegend() {
  return (
    <div className="plan-legend">
      <p className="legend-title">Легенда плана · Аббатство</p>
      {/* как на плане русского издания: буква и подпись; рядом — подпись итальянского оригинала */}
      <dl>
        {ABBEY_LEGEND.map((l) => (
          <div key={l.letter}>
            <dt lang="la">{l.letter}</dt>
            <dd>
              {l.ru}{' '}
              <span className="muted">
                · <span lang="it">{l.it}</span>
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
