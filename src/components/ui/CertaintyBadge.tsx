import type { Certainty } from '../../data/types';

const CERTAINTY: Record<Certainty, { label: string; hint: string }> = {
  confirmed: { label: 'по тексту', hint: 'Прямо следует из текста романа.' },
  interpretation: { label: 'толкование', hint: 'Вывод из текста или реконструкция по косвенным данным.' },
  uncertain: { label: 'не установлено', hint: 'Роман не даёт однозначного ответа или сведения расходятся.' },
};

export function CertaintyBadge({ c }: { c?: Certainty }) {
  if (!c) return null;
  const v = CERTAINTY[c];
  return (
    <span className={`certainty certainty-${c}`} title={v.hint}>
      <span className="sr-only">Достоверность: </span>
      {v.label}
    </span>
  );
}
