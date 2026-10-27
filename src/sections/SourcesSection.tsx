import { useEffect } from 'react';
import { sources } from '../data';
import type { Route as AppRoute } from '../lib/router';
import { CertaintyBadge, SectionHead, Withheld } from '../components/ui';
import { useSpoiler } from '../state/spoiler';
import { count, SOURCES } from '../lib/ru';

const kindLabels = { novel: 'Роман', 'author-commentary': 'Комментарий автора', study: 'Исследование', reference: 'Справочный пересказ', history: 'Исторический источник' } as const;

export function SourcesSection({ route }: { route: AppRoute }) {
  const focus = route.params.get('s');
  const { critical } = useSpoiler();
  const shown = sources.filter((s) => !s.critical || critical);
  useEffect(() => {
    if (focus) document.getElementById(`src-${focus}`)?.scrollIntoView({ block: 'center' });
  }, [focus]);
  return (
    <div className="page">
      <SectionHead latin="Fontes" title="Источники и достоверность">
        <p>Содержание атласа — пересказ, а не цитирование романа. У каждого факта есть пометка о достоверности.</p>
      </SectionHead>
      <ul className="certainty-legend">
        <li><CertaintyBadge c="confirmed" /> прямо следует из текста романа;</li>
        <li><CertaintyBadge c="interpretation" /> вывод из текста или реконструкция по косвенным данным;</li>
        <li><CertaintyBadge c="uncertain" /> роман не даёт однозначного ответа или сведения расходятся.</li>
      </ul>
      <div className="prose">
        <h2>Что важно знать о реконструкции</h2>
        <ul>
          <li>Карты построены на двух эталонных планах: общем плане аббатства из русского издания и плане библиотеки. Изображения не перерисованы; поверх них лежат выровненные зоны, обведённые по стенам. Буквы и легенда переданы дословно. Где роман называет место иначе, чем легенда, в карточке есть оговорка.</li>
          <li>Этажи Эдифиция ниже библиотеки (кухня, трапезная, скрипторий) в книге не начерчены и на картах отдельно не показываются.</li>
          <li>Маршруты отмечают только эпизоды, где местонахождение героя следует из текста. Остальное помечено как реконструкция или пропуск.</li>
          <li>Канонические часы указаны там, где роман привязывает эпизод к главе-часу. Где час неясен, он не придумывается.</li>
          <li>Имена даны по переводу Е. Костюкович; варианты из других переводов и пересказов указаны в досье.</li>
        </ul>
      </div>
      <ol className="source-list">
        {shown.map((s) => (
          <li key={s.id} id={`src-${s.id}`} className={focus === s.id ? 'is-focus' : ''}>
            <p className="card-kicker">{kindLabels[s.kind]}</p>
            <h3 lang={s.lang}>{s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a> : s.title}</h3>
            {s.author && <p className="small muted">{s.author}</p>}
            <p>{s.note}</p>
          </li>
        ))}
      </ol>
      {shown.length < sources.length && <Withheld>Ещё {count(sources.length - shown.length, SOURCES)} вместе с разгадкой: названия сами раскрывают сюжет.</Withheld>}
    </div>
  );
}
