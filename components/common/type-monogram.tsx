import { investmentTypeLabel, investmentTypeMonogram } from '@/lib/domain/labels';
import type { InvestmentType } from '@/lib/domain/types';
import { cn } from '@/lib/utils';

const tone: Record<InvestmentType, string> = {
  term_deposit: 'bg-type-term-deposit-soft',
  bond: 'bg-type-bond-soft',
  security: 'bg-type-security-soft',
  crypto: 'bg-type-crypto-soft',
  alternative: 'bg-type-alternative-soft',
  other: 'bg-type-other-soft',
};

export const typeSwatch: Record<InvestmentType, string> = {
  term_deposit: 'bg-type-term-deposit',
  bond: 'bg-type-bond',
  security: 'bg-type-security',
  crypto: 'bg-type-crypto',
  alternative: 'bg-type-alternative',
  other: 'bg-type-other',
};

/**
 * Monograma do tipo (DP, OB, AC, CR, AL, OU) em vez de ícones coloridos.
 * As letras levam a identidade; o tom suave só ajuda a percorrer listas.
 */
export function TypeMonogram({
  type,
  size = 'md',
  className,
}: {
  type: InvestmentType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <span
      title={investmentTypeLabel[type]}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-semibold tracking-[0.04em] text-ink-2',
        tone[type],
        size === 'sm' && 'size-7 text-[0.625rem]',
        size === 'md' && 'size-9 text-[0.6875rem]',
        size === 'lg' && 'size-12 text-[0.8125rem]',
        className,
      )}
    >
      <span aria-hidden>{investmentTypeMonogram[type]}</span>
      <span className="sr-only">{investmentTypeLabel[type]}</span>
    </span>
  );
}
