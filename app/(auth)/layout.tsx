import Link from 'next/link';
import { Wordmark } from '@/components/common/wordmark';

const SAMPLE_ROWS = [
  ['Depósito a prazo 12 meses', '5 387 328,77 Kz'],
  ['Obrigações do Tesouro 2029', '3 060 000,00 Kz'],
  ['Bitcoin', '2 123 000,00 Kz'],
] as const;

/** Entrada: coluna editorial (desktop) + formulário estreito. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="hidden flex-col justify-between border-r border-rule bg-paper-sunken/40 p-12 lg:flex">
        <Link href="/" aria-label="InvestNote — página inicial" className="self-start">
          <Wordmark />
        </Link>
        <div>
          <p className="max-w-md font-serif text-[2rem] leading-tight text-balance text-ink">
            Quanto investiu, onde está, quanto vale e o que vence a seguir — numa só página.
          </p>
          <ul aria-hidden className="mt-10 max-w-md border-t border-ink/80">
            {SAMPLE_ROWS.map(([name, value]) => (
              <li
                key={name}
                className="flex justify-between gap-4 border-b border-rule py-3 text-[0.9375rem]"
              >
                <span className="text-ink-2">{name}</span>
                <span className="text-ink figures-table">{value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">Exemplo com valores fictícios.</p>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-ink-3">
          O InvestNote organiza a informação que regista. Não liga a bancos, não pede credenciais e
          não presta aconselhamento financeiro, fiscal ou jurídico.
        </p>
      </aside>
      <main className="flex flex-col px-6 py-10 sm:px-12 lg:justify-center">
        <Link
          href="/"
          aria-label="InvestNote — página inicial"
          className="mb-12 self-start lg:hidden"
        >
          <Wordmark />
        </Link>
        <div className="mx-auto w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
