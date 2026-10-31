import type { Route } from 'next';
import Link from 'next/link';
import { Amount, Delta } from '@/components/common/amount';
import { DeadlineBadge, FreshnessBadge, InvestmentStatusBadge } from '@/components/common/status';
import { TypeMonogram } from '@/components/common/type-monogram';
import { ValuationDialog } from '@/components/investments/valuation-dialog';
import { formatUpdatedAgo } from '@/lib/formatters/dates';
import { formatMoney, formatPercent } from '@/lib/formatters/money';
import type { InvestmentGroup, InvestmentRow } from '@/lib/services/investments';

function valueNote(row: InvestmentRow) {
  if (row.status === 'closed') return 'Encerrado';
  if (row.freshness.state === 'missing') return 'Sem avaliação';
  return formatUpdatedAgo(row.freshness.ageDays);
}

function Row({ row, today }: { row: InvestmentRow; today: string }) {
  const href = `/app/investimentos/${row.id}` as Route;
  const meta = [row.institutionName, row.portfolioName].filter(Boolean).join(' · ');
  return (
    <li className="group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3.5 gap-y-1 py-3.5 md:grid-cols-[auto_minmax(0,1fr)_11rem_10rem_8.5rem] md:items-center md:gap-y-0.5">
      <TypeMonogram type={row.type} className="row-span-3 mt-0.5 md:row-span-2 md:mt-0" />
      {/* No telemóvel o nome ocupa a largura toda; os valores vão para a linha de baixo. */}
      <Link
        href={href}
        className="col-span-2 line-clamp-2 font-medium text-ink underline-offset-4 after:absolute after:inset-0 hover:underline md:col-span-1 md:self-end md:after:content-none"
      >
        {row.name}
        {row.symbol ? (
          <span className="ml-2 text-sm font-normal text-ink-3">{row.symbol}</span>
        ) : null}
      </Link>
      {/* Desktop: meta e selos na mesma linha. Telemóvel: os selos descem para uma linha própria. */}
      <div className="contents md:col-start-2 md:row-start-2 md:flex md:min-w-0 md:flex-wrap md:items-center md:gap-x-2 md:gap-y-1 md:self-start">
        {meta ? (
          <span className="min-w-0 truncate text-sm text-ink-3 max-md:col-start-2 max-md:row-start-2">
            {meta}
          </span>
        ) : null}
        <div className="flex flex-wrap items-center gap-1.5 empty:hidden max-md:col-span-2 max-md:col-start-2 max-md:row-start-3 max-md:mt-0.5">
          <InvestmentStatusBadge status={row.status} />
          {row.isOpen ? <FreshnessBadge freshness={row.freshness} /> : null}
          <DeadlineBadge deadline={row.deadline} />
        </div>
      </div>

      {/* Valor atual */}
      <div className="col-start-3 row-start-2 text-right md:row-span-2 md:row-start-1 md:self-center">
        {row.status === 'closed' ? (
          <span className="text-sm text-ink-3">Encerrado</span>
        ) : (
          <Amount value={row.currentValue} className="text-[0.9375rem] text-ink" />
        )}
        <p className="mt-0.5 hidden text-[0.8125rem] text-ink-3 md:block">{valueNote(row)}</p>
        {row.result !== null ? (
          <div className="mt-0.5 text-[0.8125rem] md:hidden">
            <Delta value={row.result} percent={row.simpleReturn} showIcon={false} />
          </div>
        ) : null}
      </div>

      {/* Resultado (desktop) */}
      <div className="hidden text-right md:col-start-4 md:row-span-2 md:row-start-1 md:block md:self-center">
        <Delta value={row.result} showIcon={false} className="text-[0.9375rem]" />
        {row.simpleReturn ? (
          <p className="mt-0.5 text-[0.8125rem] text-ink-3">
            {formatPercent(row.simpleReturn, { sign: 'always' })}
          </p>
        ) : null}
      </div>

      {/* Ação rápida (desktop), como no Kubera */}
      <div className="relative z-10 hidden justify-end md:col-start-5 md:row-span-2 md:row-start-1 md:flex md:self-center">
        {row.isOpen ? <ValuationDialog target={row.target} today={today} /> : null}
      </div>
    </li>
  );
}

/** Lista tipo balanço: grupos por tipo, com subtotal, e linhas alinhadas à direita. */
export function InvestmentGroups({ groups, today }: { groups: InvestmentGroup[]; today: string }) {
  return (
    <div className="flex flex-col gap-12">
      {groups.map((group) => (
        <section key={group.type} aria-labelledby={`grupo-${group.type}`}>
          <header className="flex items-baseline justify-between gap-4 border-b border-ink/80 pb-2.5">
            <h2 id={`grupo-${group.type}`} className="font-serif text-title text-ink">
              {group.label}
              <span className="ml-2 font-sans text-sm text-ink-3">{group.rows.length}</span>
            </h2>
            <p className="text-right text-sm text-ink-2">
              <span className="sr-only">Subtotal: </span>
              <span className="font-medium text-ink figures-table">
                {formatMoney(group.subtotalValue)}
              </span>
              {group.unvalued > 0 ? (
                <span className="ml-1.5 text-ink-3">+ {group.unvalued} sem valor</span>
              ) : null}
            </p>
          </header>
          <div
            aria-hidden
            className="hidden grid-cols-[auto_minmax(0,1fr)_11rem_10rem_8.5rem] gap-x-3.5 border-b border-rule py-2 text-right md:grid"
          >
            <span className="col-span-2" />
            <span className="eyebrow">Valor atual</span>
            <span className="eyebrow">Resultado</span>
            <span />
          </div>
          <ul className="divide-y divide-rule">
            {group.rows.map((row) => (
              <Row key={row.id} row={row} today={today} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
