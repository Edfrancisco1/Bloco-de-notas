'use client';

import { useState } from 'react';
import { Section } from '@/components/common/section';
import { typeSwatch } from '@/components/common/type-monogram';
import { investmentTypeOrder } from '@/lib/domain/labels';
import type { DecimalString, InvestmentType } from '@/lib/domain/types';
import { formatMoney, formatPercent } from '@/lib/formatters/money';
import type { SliceView } from '@/lib/services/views';
import { cn } from '@/lib/utils';

const pct = (share: string) => formatPercent(share as DecimalString);

/**
 * Distribuição por tipo: uma barra empilhada (parte do todo, ≤ 6 segmentos) + legenda com
 * valores. A ordem dos segmentos é FIXA (ordem dos tipos), não por valor: a cor segue a
 * entidade e a paleta foi validada para esses vizinhos. Separação por 2px de "papel".
 */
export function AllocationByType({
  slices,
  unvaluedCount,
  className,
}: {
  slices: SliceView[];
  unvaluedCount: number;
  className?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const ordered = investmentTypeOrder
    .map((type) => slices.find((s) => s.key === type))
    .filter((s): s is SliceView => Boolean(s));
  const summary = ordered.map((s) => `${s.label} ${pct(s.share)}`).join(', ');
  const active = ordered.find((s) => s.key === hovered) ?? null;

  return (
    <Section id="distribuicao-tipo" title="Distribuição por tipo" className={className}>
      {ordered.length === 0 ? (
        <p className="py-5 text-ink-3">Ainda não há valores atuais para distribuir.</p>
      ) : (
        <>
          <div className="relative pt-9 pb-1">
            {/* Dica ao passar o rato — os valores também estão na legenda abaixo. */}
            <p
              aria-hidden
              className={cn(
                'absolute top-0 left-0 text-[0.8125rem] text-ink-2 transition-opacity',
                active ? 'opacity-100' : 'opacity-0',
              )}
            >
              {active ? (
                <>
                  <span className="font-medium text-ink">{active.label}</span> · {pct(active.share)}{' '}
                  ·{' '}
                  <span className="figures-table">
                    {formatMoney(active.value as DecimalString)}
                  </span>
                </>
              ) : (
                ' '
              )}
            </p>
            <div
              role="img"
              aria-label={`Distribuição do valor atual por tipo: ${summary}.`}
              className="flex h-3.5 w-full gap-[2px]"
            >
              {ordered.map((slice, index) => (
                <div
                  key={slice.key}
                  onMouseEnter={() => setHovered(slice.key)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ flexGrow: Number(slice.share), flexBasis: 0 }}
                  className={cn(
                    'min-w-[3px] transition-opacity duration-150',
                    typeSwatch[slice.key as InvestmentType],
                    index === ordered.length - 1 && 'rounded-r-[4px]',
                    hovered && hovered !== slice.key && 'opacity-35',
                  )}
                />
              ))}
            </div>
          </div>

          <ul className="mt-4 divide-y divide-rule">
            {ordered.map((slice) => (
              <li
                key={slice.key}
                onMouseEnter={() => setHovered(slice.key)}
                onMouseLeave={() => setHovered(null)}
                className={cn(
                  'grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3 py-2.5 transition-opacity',
                  hovered && hovered !== slice.key && 'opacity-55',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'size-2.5 translate-y-[1px] rounded-[2px]',
                    typeSwatch[slice.key as InvestmentType],
                  )}
                />
                <span className="min-w-0 text-[0.9375rem] text-ink">
                  {slice.label}
                  <span className="block text-sm text-ink-3 sm:ml-2 sm:inline">
                    {slice.count} {slice.count === 1 ? 'investimento' : 'investimentos'}
                  </span>
                </span>
                <span className="flex flex-col items-end sm:block sm:text-right">
                  <span className="text-[0.9375rem] text-ink figures-table">
                    {formatMoney(slice.value as DecimalString)}
                  </span>
                  <span className="text-sm text-ink-3 figures-table sm:ml-3 sm:inline-block sm:w-14 sm:text-right">
                    {pct(slice.share)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {unvaluedCount > 0 ? (
            <p className="mt-3 text-[0.8125rem] text-ink-3">
              {unvaluedCount === 1
                ? '1 investimento sem valor atual não entra na distribuição.'
                : `${unvaluedCount} investimentos sem valor atual não entram na distribuição.`}
            </p>
          ) : null}
        </>
      )}
    </Section>
  );
}

/**
 * Distribuição por instituição: barras numa só cor (é uma série única; o comprimento já mostra
 * o valor — colorir por instituição gastaria o canal de identidade sem acrescentar nada).
 */
export function AllocationByInstitution({
  slices,
  className,
}: {
  slices: SliceView[];
  className?: string;
}) {
  const max = slices.reduce((m, s) => Math.max(m, Number(s.share)), 0) || 1;
  return (
    <Section id="distribuicao-instituicao" title="Por instituição" className={className}>
      {slices.length === 0 ? (
        <p className="py-5 text-ink-3">Sem valores atuais por instituição.</p>
      ) : (
        <ul className="mt-1 flex flex-col">
          {slices.map((slice) => (
            <li key={slice.key} className="border-b border-rule py-3 last:border-b-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 text-[0.9375rem] text-ink">{slice.label}</span>
                <span className="shrink-0 text-[0.9375rem] text-ink figures-table">
                  {formatMoney(slice.value as DecimalString)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div aria-hidden className="h-1.5 flex-1 rounded-r-[4px] bg-paper-sunken">
                  <div
                    className="h-full rounded-r-[4px] bg-accent"
                    style={{ width: `${(Number(slice.share) / max) * 100}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-sm text-ink-3 figures-table">
                  {pct(slice.share)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
