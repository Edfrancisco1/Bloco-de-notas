import { DisplayAmount } from '@/components/common/amount';
import { LedgerMetric, ResultFigure } from '@/components/common/ledger';
import { FreshnessBadge } from '@/components/common/status';
import { formatDate, formatUpdatedAgo } from '@/lib/formatters/dates';
import { formatMoney, formatQuantity } from '@/lib/formatters/money';
import type { InvestmentDetailView } from '@/lib/services/investment-detail';

/** Métricas do investimento, com definição e fórmula de cada uma (PLANO_MVP §7). */
export function InvestmentMetrics({ view }: { view: InvestmentDetailView }) {
  const { metrics, freshness, investment } = view;
  const closed = investment.status === 'closed';

  return (
    <section aria-labelledby="metricas-titulo">
      <h2 id="metricas-titulo" className="sr-only">
        Métricas
      </h2>
      <dl className="grid divide-y divide-rule border-y border-ink/80 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        <LedgerMetric
          label="Valor atual"
          definition="A avaliação mais recente que registou. Num investimento encerrado é zero: o dinheiro já saiu."
          formula="Última avaliação manual"
          note={
            closed ? (
              `Encerrado em ${formatDate(metrics.valuedOn ?? investment.startDate)}`
            ) : freshness.state === 'missing' ? (
              <FreshnessBadge freshness={freshness} />
            ) : (
              <span className="inline-flex flex-wrap items-center gap-2">
                {formatUpdatedAgo(freshness.ageDays)}
                <FreshnessBadge freshness={freshness} />
              </span>
            )
          }
        >
          {metrics.currentValue !== null ? (
            <DisplayAmount value={metrics.currentValue} size="large" />
          ) : (
            <p className="font-serif text-[1.375rem] text-ink-3">Valor atual não registado</p>
          )}
        </LedgerMetric>
        <LedgerMetric
          label="Capital líquido investido"
          definition="O que investiu menos o capital que já recuperou em vendas, resgates e levantamentos."
          formula="Entradas de capital − capital devolvido"
          note={`Entradas ${formatMoney(metrics.capitalInflows)} · devolvido ${formatMoney(metrics.capitalReturned)}`}
        >
          <DisplayAmount value={metrics.netInvested} size="large" />
        </LedgerMetric>
        <LedgerMetric
          label="Resultado indicativo"
          definition="Quanto ganhou ou perdeu, com base nos valores registados. Depende de manter a avaliação atualizada."
          formula="Valor atual + recebido em vendas e resgates + rendimentos − entradas de capital − custos"
          note={metrics.result === null ? 'Registe o valor atual para calcular.' : undefined}
        >
          {metrics.result !== null ? (
            <ResultFigure value={metrics.result} simpleReturn={metrics.simpleReturn} />
          ) : (
            <p className="font-serif text-[1.375rem] text-ink-3">—</p>
          )}
        </LedgerMetric>
        <LedgerMetric
          label="Rendimentos e custos"
          definition="Juros, dividendos e rendas recebidos; comissões e impostos pagos (autónomos ou nos movimentos)."
          formula="Rendimentos = juros + dividendos + outros · Custos = comissões + impostos"
          note={
            <>
              Custos {formatMoney(metrics.costs)}
              {metrics.reinvestedIncome !== '0' ? (
                <> · inclui {formatMoney(metrics.reinvestedIncome)} reinvestido</>
              ) : null}
            </>
          }
        >
          <DisplayAmount value={metrics.income} size="large" />
        </LedgerMetric>
      </dl>
      {metrics.quantity !== null ? (
        <p className="mt-3 text-sm text-ink-2">
          Em carteira:{' '}
          <span className="font-medium text-ink figures-table">
            {formatQuantity(metrics.quantity)}
          </span>
          {metrics.averageCost ? (
            <>
              {' '}
              · custo médio{' '}
              <span className="font-medium text-ink figures-table">
                {formatMoney(metrics.averageCost)}
              </span>{' '}
              <span className="text-ink-3">
                (média ponderada das compras, sem comissões; as vendas não alteram o custo médio)
              </span>
            </>
          ) : null}
        </p>
      ) : null}
    </section>
  );
}
