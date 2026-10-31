import { Badge } from '@/components/ui/badge';
import type { TermDepositSummary } from '@/lib/calculations/term-deposit';
import { dayCountBasisLabel } from '@/lib/domain/labels';
import { formatDate } from '@/lib/formatters/dates';
import { formatMoney, formatRate } from '@/lib/formatters/money';
import { cn } from '@/lib/utils';

const PERIOD_LABEL: Record<number, string> = {
  12: 'capitalização mensal',
  4: 'capitalização trimestral',
  2: 'capitalização semestral',
  1: 'capitalização anual',
};

/**
 * Estimativa transparente de um depósito a prazo (PLANO_MVP §6): mostra a fórmula e os
 * parâmetros, e diz sempre que é uma estimativa.
 */
export function TermDepositEstimate({
  estimate,
  className,
}: {
  estimate: TermDepositSummary;
  className?: string;
}) {
  const m = estimate.periodsPerYear;
  const principal = formatMoney(estimate.principal);
  const rate = formatRate(estimate.annualRate);
  const fraction = `${estimate.days}/${estimate.yearDays}`;
  const formula =
    estimate.method === 'compound'
      ? `${principal} × ((1 + ${rate} ÷ ${m})^(${m} × ${fraction}) − 1)`
      : `${principal} × ${rate} × ${fraction}`;
  const method =
    estimate.method === 'compound' ? (PERIOD_LABEL[m] ?? 'capitalização') : 'juros simples';

  return (
    <section
      aria-labelledby="estimativa-titulo"
      className={cn('rounded-lg border border-rule bg-paper-raised px-5 py-4', className)}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="estimativa-titulo" className="font-serif text-[1.1875rem] text-ink">
          Até ao vencimento
        </h3>
        <Badge tone="marker">Estimativa</Badge>
      </div>
      <dl className="mt-3 divide-y divide-rule text-[0.9375rem]">
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-ink-2">Juros brutos estimados</dt>
          <dd className="text-ink figures-table">{formatMoney(estimate.grossInterest)}</dd>
        </div>
        {estimate.tax ? (
          <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-ink-2">
              Retenção estimada{' '}
              {estimate.taxRate ? (
                <span className="text-ink-3">({formatRate(estimate.taxRate)})</span>
              ) : null}
            </dt>
            <dd className="text-ink figures-table">
              {'−'}
              {formatMoney(estimate.tax)}
            </dd>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-ink-2">Valor no vencimento</dt>
          <dd className="font-medium text-ink figures-table">
            {formatMoney(estimate.maturityValue)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-3">
        <span className="font-medium text-ink-2">Como calculamos:</span>{' '}
        <span className="figures-table">{formula}</span> ({method},{' '}
        {dayCountBasisLabel[estimate.dayCountBasis]}, {estimate.days} dias de{' '}
        {formatDate(estimate.startDate)} a {formatDate(estimate.maturityDate)}). O valor confirmado
        vem do extrato do banco: registe-o como movimento ou avaliação.
      </p>
    </section>
  );
}
