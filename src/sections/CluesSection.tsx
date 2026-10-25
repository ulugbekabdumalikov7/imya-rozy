import { useLayoutEffect, useRef, useState } from 'react';
import { Check, CircleHelp, Quote, Search, X as XIcon, Scale } from 'lucide-react';
import { characterById, clueById, clues, eventById, hypotheses } from '../data';
import type { ClueKind, Hypothesis, HypothesisStatus } from '../data/types';
import { patchParams, type Route as AppRoute } from '../lib/router';
import { visibleTexts } from '../lib/visible';
import { useSpoiler } from '../state/spoiler';
import { CertaintyBadge, CharChip, ChipRow, DetailPanel, EventChip, LocChip, SectionHead, Withheld } from '../components/ui';
import { Sources } from '../components/cards';

const kindLabels: Record<ClueKind, string> = { clue: 'Улика', object: 'Предмет', testimony: 'Свидетельство', fact: 'Установленный факт' };
const columns: { kinds: ClueKind[]; title: string; latin: string }[] = [
  { kinds: ['clue', 'object'], title: 'Улики и предметы', latin: 'Signa' },
  { kinds: ['testimony'], title: 'Свидетельства', latin: 'Testimonia' },
  { kinds: ['fact'], title: 'Установленные факты', latin: 'Facta' },
];
const statusLabels: Record<HypothesisStatus, string> = { confirmed: 'подтверждена', partial: 'верна отчасти', refuted: 'опровергнута', open: 'не проверена' };
const relLabels = { supports: 'подтверждает', contradicts: 'опровергает', context: 'контекст' } as const;

function useStatus() {
  const { visible } = useSpoiler();
  return (h: Hypothesis): HypothesisStatus => (visible(h.verdict) ? h.finalStatus : h.initialStatus);
}

export function CluesSection({ route }: { route: AppRoute }) {
  const { visible } = useSpoiler();
  const status = useStatus();
  const hid = route.params.get('h');
  const item = route.params.get('item');
  const set = (patch: Record<string, string | null>) => patchParams(route, patch);

  const hyps = hypotheses.filter((h) => visible(h));
  const sel = hid ? hyps.find((h) => h.id === hid) : undefined;
  const linkMap = new Map((sel?.links ?? []).filter((l) => visible(l)).map((l) => [l.clueId, l]));
  const visibleClues = clues.filter((c) => visible(c));

  // Тонкие линии от выбранной версии к уликам: прорисовываются при выборе.
  const boardRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ id: string; d: string; rel: string }[]>([]);
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board || !sel) { setLines([]); return; }
    const measure = () => {
      const b = board.getBoundingClientRect();
      const hEl = board.querySelector(`[data-hyp="${sel.id}"]`);
      if (!hEl) return setLines([]);
      const h = hEl.getBoundingClientRect();
      const x1 = h.right - b.left;
      const y1 = h.top + h.height / 2 - b.top;
      const out: { id: string; d: string; rel: string }[] = [];
      linkMap.forEach((l, clueId) => {
        const el = board.querySelector(`[data-clue="${clueId}"]`);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x2 = r.left - b.left;
        const y2 = r.top + r.height / 2 - b.top;
        const mx = x1 + Math.max(30, (x2 - x1) * 0.45);
        out.push({ id: clueId, rel: l.relation, d: `M${x1},${y1} C${mx},${y1} ${x2 - 30},${y2} ${x2},${y2}` });
      });
      setLines(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.id, visibleClues.length]);

  return (
    <div className="page page-wide">
      <SectionHead latin="Indicia" title="Улики и версии">
        <p>Доска расследования. Слева — версии, которые выдвигали герои. Выберите версию, чтобы увидеть, какие улики и свидетельства её поддерживают, а какие ей противоречат. Свидетельство — это слова персонажа, а не доказанный факт.</p>
      </SectionHead>

      <div className="board" ref={boardRef}>
        <svg className="board-lines" aria-hidden="true">
          {lines.map((l, i) => <path key={`${sel?.id}-${l.id}`} d={l.d} pathLength={1} className={`bl-${l.rel}`} style={{ ['--i' as string]: i }} />)}
        </svg>
        <div className="board-hyps">
          <h2 className="board-col-title"><span className="rubric" lang="la">Opiniones</span> Версии</h2>
          <ul>
            {hyps.map((h) => {
              const st = status(h);
              return (
                <li key={h.id}>
                  <button type="button" data-hyp={h.id} className={`hyp${sel?.id === h.id ? ' is-active' : ''} hyp-${st}`} aria-pressed={sel?.id === h.id} onClick={() => set({ h: sel?.id === h.id ? null : h.id, item: null })}>
                    <span className="hyp-status"><StatusIcon s={st} /> {statusLabels[st]}</span>
                    <span className="hyp-title">{h.title}</span>
                    <span className="hyp-holders">{h.holderIds.map((c) => characterById.get(c)!.short).join(', ')}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {sel && (
            <div className="hyp-detail">
              <p>{sel.statement}</p>
              {visible(sel.verdict) ? <p className="verdict"><Scale size={14} aria-hidden="true" /> {sel.verdict.text}</p> : <Withheld>Проверка этой версии впереди.</Withheld>}
              {sel.eventIds.length > 0 && <ChipRow title="Где возникла">{sel.eventIds.map((e) => eventById.get(e)!).filter((e) => visible(e)).map((e) => <EventChip key={e.id} e={e} />)}</ChipRow>}
            </div>
          )}
        </div>

        <div className="board-cols">
          {columns.map((col) => {
            const items = visibleClues.filter((c) => col.kinds.includes(c.kind)).sort((x, y) => x.revealDay - y.revealDay);
            return (
              <section key={col.title} className="board-col" aria-label={col.title}>
                <h2 className="board-col-title"><span className="rubric" lang="la">{col.latin}</span> {col.title}</h2>
                {items.length === 0 ? <p className="muted small">Пока ничего: эти сведения появятся позже.</p> : (
                  <ul>
                    {items.map((c) => {
                      const link = linkMap.get(c.id);
                      const dim = sel && !link;
                      return (
                        <li key={c.id}>
                          <button type="button" data-clue={c.id} className={`clue-card clue-${c.kind}${dim ? ' is-dim' : ''}${link ? ` link-${link.relation}` : ''}${item === c.id ? ' is-active' : ''}`} onClick={() => set({ item: c.id })} aria-pressed={item === c.id}>
                            <span className="clue-kind">{c.kind === 'testimony' ? <Quote size={12} aria-hidden="true" /> : <Search size={12} aria-hidden="true" />} {kindLabels[c.kind]} · день {Math.max(1, c.revealDay)}</span>
                            <span className="clue-title">{c.title}</span>
                            {c.speakerId && <span className="clue-speaker">говорит: {characterById.get(c.speakerId)!.short}</span>}
                            {link && <span className={`clue-rel rel-${link.relation}`}>{relLabels[link.relation]}: {link.note}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>

      <DetailPanel open={!!item} onClose={() => set({ item: null })} label="Улика">
        {item && <ClueDetail key={item} id={item} onHyp={(h) => set({ h })} />}
      </DetailPanel>
    </div>
  );
}

function StatusIcon({ s }: { s: HypothesisStatus }) {
  if (s === 'confirmed') return <Check size={13} aria-hidden="true" />;
  if (s === 'refuted') return <XIcon size={13} aria-hidden="true" />;
  if (s === 'partial') return <Scale size={13} aria-hidden="true" />;
  return <CircleHelp size={13} aria-hidden="true" />;
}

function ClueDetail({ id, onHyp }: { id: string; onHyp: (h: string) => void }) {
  const { spoiler, visible } = useSpoiler();
  const status = useStatus();
  const c = clueById.get(id);
  if (!c) return <p>Улика не найдена.</p>;
  if (!visible(c)) return <Withheld>Эти сведения откроются позже.</Withheld>;
  const later = visibleTexts(c.later, spoiler);
  const ev = eventById.get(c.eventId)!;
  const inHyps = hypotheses.filter((h) => visible(h)).map((h) => ({ h, l: h.links.find((l) => l.clueId === id && visible(l)) })).filter((x) => x.l);
  return (
    <article className="card stagger">
      <p className="card-kicker">{kindLabels[c.kind]} · становится известно: {c.revealDay <= 1 ? 'в первый день' : `на ${c.revealDay}-й день`}</p>
      <h2 className="card-title">{c.title}</h2>
      <CertaintyBadge c={c.certainty} />
      {c.speakerId && <p className="small"><Quote size={13} aria-hidden="true" /> Это утверждение персонажа: <CharChip id={c.speakerId} /></p>}
      <p className="lead">{c.description}</p>
      {later.map((t, i) => <p key={i} className="later"><span className="later-mark">Позже:</span> {t.text}</p>)}
      {(c.later?.length ?? 0) > later.length && <Withheld />}
      <ChipRow title="Исходное событие">{visible(ev) ? [<EventChip key={ev.id} e={ev} />] : []}</ChipRow>
      {c.locationId && <ChipRow title="Место">{[<LocChip key={c.locationId} id={c.locationId} />]}</ChipRow>}
      <ChipRow title="Персонажи">{c.characterIds.filter((x) => visible(characterById.get(x)!)).map((x) => <CharChip key={x} id={x} />)}</ChipRow>
      <div className="chip-block">
        <h4>В каких версиях участвует</h4>
        {inHyps.length ? (
          <ul className="plain-list">
            {inHyps.map(({ h, l }) => (
              <li key={h.id}>
                <button type="button" className="link-btn" onClick={() => onHyp(h.id)}>{h.title}</button>
                <span className="small"> — {relLabels[l!.relation]} ({statusLabels[status(h)]})</span>
              </li>
            ))}
          </ul>
        ) : <p className="muted small">Ни одна видимая версия на неё не опирается.</p>}
      </div>
      <Sources ids={c.sourceIds} />
    </article>
  );
}
