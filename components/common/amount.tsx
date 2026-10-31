import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { dec } from '@/lib/calculations/decimal';
import type { DecimalString } from '@/lib/domain/types';
import { type SignMode, formatMoney, formatPercent, moneyParts } from '@/lib/formatters/money';
import { cn } from '@/lib/utils';

/** Valor monetário em algarismos tabulares. `null` mostra um travessão acessível. */
export function Amount({
  value,
  sign,
  decimals,
  className,
}: {
  value: DecimalString | null;
  sign?: SignMode;
  decimals?: number;
  className?: string;
}) {
  if (value === null) {
    return (
      <span className={cn('text-ink-3', className)}>
        <span aria-hidden>—</span>
        <span className="sr-only">sem valor</span>
      </span>
    );
  }
  return (
    <span className={cn('whitespace-nowrap figures-table', className)}>
      {formatMoney(value, { sign, decimals })}
    </span>
  );
}

/**
 * Número de destaque em serifa, com o "Kz" mais pequeno. Algarismos proporcionais
 * (tabulares só em colunas). Reduz o corpo em valores muito longos para caber a 360px.
 */
export function DisplayAmount({
  value,
  size = 'hero',
  className,
}: {
  value: DecimalString;
  size?: 'hero' | 'large' | 'medium';
  className?: string;
}) {
  const { number, currency } = moneyParts(value);
  const long = number.length > 15;
  const sizeClass =
    size === 'hero'
      ? long
        ? 'text-[clamp(2rem,1.5rem+2vw,3.25rem)] leading-[1.05]'
        : 'text-hero'
      : size === 'large'
        ? 'text-[clamp(1.5rem,1.3rem+0.8vw,1.875rem)] leading-tight'
        : 'text-[1.25rem] leading-tight';
  return (
    <span
      className={cn('inline-flex items-baseline figures-display text-ink', sizeClass, className)}
    >
      <span className="whitespace-nowrap">{number}</span>
      <span className="ml-[0.28em] font-sans text-[0.36em] font-medium tracking-normal text-ink-3">
        {currency}
      </span>
    </span>
  );
}

/** Variação com sinal, seta e cor — nunca só a cor (PLANO_MVP §14). */
export function Delta({
  value,
  percent,
  className,
  showIcon = true,
}: {
  value: DecimalString | null;
  percent?: DecimalString | null;
  className?: string;
  showIcon?: boolean;
}) {
  if (value === null) return <Amount value={null} className={className} />;
  const amount = dec(value);
  const direction = amount.isZero() ? 'flat' : amount.isNegative() ? 'down' : 'up';
  const Icon = direction === 'down' ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap figures-table',
        direction === 'up' && 'text-positive',
        direction === 'down' && 'text-negative',
        direction === 'flat' && 'text-ink-2',
        className,
      )}
    >
      {showIcon && direction !== 'flat' ? (
        <Icon aria-hidden className="size-[1em] shrink-0" strokeWidth={2} />
      ) : null}
      <span className="sr-only">
        {direction === 'up' ? 'ganho de' : direction === 'down' ? 'perda de' : ''}
      </span>
      {formatMoney(value, { sign: 'always' })}
      {percent ? (
        <span className="text-[0.92em] opacity-90">
          ({formatPercent(percent, { sign: 'always' })})
        </span>
      ) : null}
    </span>
  );
}
