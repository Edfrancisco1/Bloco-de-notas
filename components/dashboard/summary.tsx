import { DisplayAmount } from '@/components/common/amount';
import { LedgerMetric, ResultFigure } from '@/components/common/ledger';
import { MetricDefinition } from '@/components/common/metric-definition';
import type { DashboardView } from '@/lib/services/views';

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

export function DashboardSummary({ view }: { view: DashboardView }) {
  const { totals } = view;
  const missing = totals.coverage.open - totals.coverage.valued;

  return (
    <section aria-labelledby="resumo-titulo" className="mt-10 lg:mt-12">
      <h2 id="resumo-titulo" className="sr-only">
        Resumo da carteira
      </h2>

      <div className="flex items-center gap-1">
        <p className="eyebrow">Valor atual conhecido</p>
        <MetricDefinition
          label="Valor atual conhecido"
          formula="Soma da avaliação mais recente de cada investimento aberto com valor registado."
        >
          O valor dos seus investimentos abertos, segundo as últimas avaliações que registou.
          Investimentos sem avaliação não entram na soma — aparecem em «Precisa de atenção».
        </MetricDefinition>
      </div>
      <div className="mt-2">
        <DisplayAmount value={totals.currentValue} />
      </div>
      <p className="mt-3 text-sm text-ink-2">
        {totals.coverage.valued} de{' '}
        {plural(totals.coverage.open, 'investimento aberto', 'investimentos abertos')} com valor
        registado
        {missing > 0 ? (
          <>
            {' · '}
            <a
              href="#atencao"
              className="text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
            >
              {missing} sem valor atual
            </a>
          </>
        ) : null}
      </p>

      <dl className="mt-8 grid divide-y divide-rule border-y border-ink/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <LedgerMetric
          label="Capital líquido investido"
          definition="O dinheiro que ainda tem aplicado: o que investiu menos o capital que já recuperou em vendas, resgates e levantamentos."
          formula="Entradas de capital − capital devolvido"
        >
          <DisplayAmount value={totals.netInvested} size="large" />
        </LedgerMetric>
        <LedgerMetric
          label="Resultado indicativo"
          definition="Quanto ganhou ou perdeu até agora, com base nos valores que registou. É indicativo: depende de manter as avaliações atualizadas."
          formula="Valor atual + recebido em vendas e resgates + rendimentos − entradas de capital − custos"
          note={
            totals.closedPositions > 0
              ? `Sobre ${totals.coverage.valued} com valor atual e ${plural(totals.closedPositions, 'encerrado', 'encerrados')}`
              : `Sobre ${plural(totals.coverage.valued, 'investimento', 'investimentos')} com valor atual`
          }
        >
          <ResultFigure value={totals.result} simpleReturn={totals.simpleReturn} />
        </LedgerMetric>
        <LedgerMetric
          label="Rendimentos recebidos"
          definition="Juros, dividendos, rendas e outros rendimentos que registou como movimentos."
          formula="Juros + dividendos + outros rendimentos"
          note="Juros, dividendos e rendas"
        >
          <DisplayAmount value={totals.income} size="large" />
        </LedgerMetric>
      </dl>
    </section>
  );
}
