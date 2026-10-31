import Link from 'next/link';
import { Wordmark } from './wordmark';

/** Página legal provisória: avisa claramente que o texto ainda será validado. */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:py-16">
      <Link href="/" aria-label="InvestNote — página inicial">
        <Wordmark />
      </Link>
      <main className="mt-14">
        <p className="eyebrow">Versão provisória · {updated}</p>
        <h1 className="mt-3 font-serif text-display text-ink">{title}</h1>
        <p className="mt-4 rounded-md bg-marker-soft px-4 py-3 text-sm text-marker-ink">
          Texto provisório para a fase de testes. Será revisto juridicamente antes do lançamento,
          incluindo a conformidade com a Lei n.º 22/11 (Proteção de Dados Pessoais) de Angola.
        </p>
        <div className="mt-10 flex flex-col gap-8 text-[1.0625rem] leading-relaxed text-ink-2 [&_h2]:font-serif [&_h2]:text-title [&_h2]:text-ink [&_li]:mt-1.5 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  );
}
