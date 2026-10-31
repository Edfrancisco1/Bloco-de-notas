import type { Route } from 'next';
import Link from 'next/link';
import { Amount } from '@/components/common/amount';
import { Section } from '@/components/common/section';
import { TypeMonogram } from '@/components/common/type-monogram';
import { formatDate } from '@/lib/formatters/dates';
import type { DashboardView } from '@/lib/services/views';

/**
 * Atividade recente como um livro-razão: data · investimento · movimento · valor, em colunas
 * alinhadas (a partir de 1280px). Abaixo disso cada linha passa a duas: nome e valor; data e
 * movimento por baixo.
 */
const row = [
  'grid items-center gap-x-3.5 gap-y-0.5 py-3 transition-colors hover:bg-paper-sunken/60',
  'grid-cols-[auto_minmax(0,1fr)_auto] [grid-template-areas:"m_n_a"_"m_x_x"]',
  'xl:-mx-2 xl:px-2 xl:grid-cols-[6.5rem_auto_minmax(0,1fr)_minmax(0,13rem)_10rem] xl:[grid-template-areas:"d_m_n_l_a"]',
].join(' ');

export function RecentActivity({ view, className }: { view: DashboardView; className?: string }) {
  return (
    <Section id="atividade" title="Atividade recente" className={className}>
      {view.activity.length === 0 ? (
        <p className="py-5 text-ink-3">Ainda não há movimentos registados.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {view.activity.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <Link href={`/app/investimentos/${item.investmentId}` as Route} className={row}>
                <TypeMonogram type={item.investmentType} size="sm" className="[grid-area:m]" />
                <span className="line-clamp-2 text-[0.9375rem] text-ink [grid-area:n] xl:line-clamp-1">
                  {item.investmentName}
                </span>
                <span className="flex min-w-0 gap-1 text-sm text-ink-3 [grid-area:x] xl:contents">
                  <span className="shrink-0 figures-table xl:[grid-area:d]">
                    {formatDate(item.date)}
                  </span>
                  <span aria-hidden className="xl:hidden">
                    ·
                  </span>
                  <span className="truncate xl:text-[0.9375rem] xl:text-ink-2 xl:[grid-area:l]">
                    {item.label}
                  </span>
                </span>
                <Amount
                  value={item.amount}
                  sign={item.flow === 'in' ? 'always' : undefined}
                  className="text-right text-[0.9375rem] text-ink [grid-area:a]"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
