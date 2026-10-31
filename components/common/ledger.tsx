import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { dec } from '@/lib/calculations/decimal';
import type { DecimalString } from '@/lib/domain/types';
import { formatPercent, moneyParts } from '@/lib/formatters/money';
import { cn } from '@/lib/utils';
import { MetricDefinition } from './metric-definition';

/** Uma métrica da linha tipo livro-razão: etiqueta + definição + valor + nota. */
export function LedgerMetric({
  label,
  definition,
  formula,
  children,
  note,
  className,
}: {
  label: string;
  definition: React.ReactNode;
  formula: React.ReactNode;
  children: React.ReactNode;
  note?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0', className)}>
      <dt>
        <span className="eyebrow">{label}</span>{' '}
        <span className="inline-block align-middle">
          <MetricDefinition label={label} formula={formula}>
            {definition}
          </MetricDefinition>
        </span>
      </dt>
      <dd>
        {children}
        {note ? <div className="mt-1 text-[0.8125rem] text-ink-3">{note}</div> : null}
      </dd>
    </div>
  );
}

/** Resultado em destaque: sinal, seta e percentagem — nunca só a cor. */
export function ResultFigure({
  value,
  simpleReturn,
}: {
  value: DecimalString;
  simpleReturn: DecimalString | null;
}) {
  const amount = dec(value);
  const direction = amount.isZero() ? 'flat' : amount.isNegative() ? 'down' : 'up';
  const { number, currency } = moneyParts(value, { sign: 'always' });
  const Icon = direction === 'down' ? ArrowDownRight : ArrowUpRight;
  const tone =
    direction === 'up' ? 'text-positive' : direction === 'down' ? 'text-negative' : 'text-ink';
  return (
    <div>
      <span
        className={cn(
          'inline-flex items-baseline figures-display text-[clamp(1.5rem,1.3rem+0.8vw,1.875rem)] leading-tight',
          tone,
        )}
      >
        <span className="sr-only">
          {direction === 'down' ? 'Perda de' : direction === 'up' ? 'Ganho de' : ''}
        </span>
        <span className="whitespace-nowrap">{number}</span>
        <span className="ml-[0.28em] font-sans text-[0.4em] font-medium tracking-normal text-ink-3">
          {currency}
        </span>
      </span>
      {simpleReturn ? (
        <p className={cn('mt-1 text-sm font-medium', tone)}>
          {direction !== 'flat' ? (
            <Icon aria-hidden className="mr-1 inline size-4 align-[-3px]" strokeWidth={2} />
          ) : null}
          {formatPercent(simpleReturn, { sign: 'always' })}{' '}
          <span className="font-normal text-ink-3">sobre o capital aplicado</span>
        </p>
      ) : null}
    </div>
  );
}
