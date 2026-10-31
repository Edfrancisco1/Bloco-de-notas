import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, PageHeader } from '@/components/common/section';
import { InvestmentFiltersBar } from '@/components/investments/list/filters';
import { InvestmentGroups } from '@/components/investments/list/investment-groups';
import { buttonVariants } from '@/components/ui/button';
import { getOnboardedRepository } from '@/lib/data';
import { formatMoney } from '@/lib/formatters/money';
import { getInvestmentListView, parseInvestmentFilters } from '@/lib/services/investments';

export const metadata: Metadata = { title: 'Investimentos' };

export default async function InvestmentsPage({ searchParams }: PageProps<'/app/investimentos'>) {
  const params = await searchParams;
  const repo = await getOnboardedRepository();
  const view = await getInvestmentListView(repo, parseInvestmentFilters(params));
  const deleted = params.eliminado === '1';

  const addButton = (
    <Link href="/app/investimentos/novo" className={buttonVariants()}>
      <Plus aria-hidden strokeWidth={2} />
      Adicionar investimento
    </Link>
  );

  return (
    <>
      <PageHeader
        title="Investimentos"
        description={
          view.totalCount > 0 ? (
            <>
              {view.shownCount} {view.shownCount === 1 ? 'investimento' : 'investimentos'} · valor
              atual conhecido{' '}
              <span className="text-ink figures-table">
                {formatMoney(view.totals.currentValue)}
              </span>
            </>
          ) : null
        }
        actions={view.totalCount > 0 ? addButton : null}
      />

      {deleted ? (
        <p role="status" className="mt-6 rounded-md bg-paper-sunken px-4 py-3 text-sm text-ink-2">
          O investimento e o seu histórico foram eliminados.
        </p>
      ) : null}

      {view.totalCount === 0 ? (
        <EmptyState
          title="Ainda não registou nenhum investimento."
          action={addButton}
          className="mt-10"
        >
          Comece por um depósito a prazo, obrigações, ações, cripto ou outro. Leva menos de três
          minutos.
        </EmptyState>
      ) : (
        <>
          <div className="mt-8">
            <InvestmentFiltersBar
              filters={view.filters}
              portfolios={view.options.portfolios}
              institutions={view.options.institutions}
            />
          </div>
          <div className="mt-10">
            {view.shownCount === 0 ? (
              <EmptyState title="Nenhum investimento corresponde aos filtros.">
                Experimente outra pesquisa ou limpe os filtros.
              </EmptyState>
            ) : (
              <InvestmentGroups groups={view.groups} today={view.today} />
            )}
          </div>
        </>
      )}
    </>
  );
}
