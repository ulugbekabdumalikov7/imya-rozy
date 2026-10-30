import { type ReactNode } from 'react';

export function SectionHead({ latin, title, children }: { latin: string; title: string; children?: ReactNode }) {
  return (
    <header className="section-head">
      <p className="rubric" lang="la">
        {latin}
      </p>
      <h1>{title}</h1>
      {children && <div className="section-lede">{children}</div>}
    </header>
  );
}
