'use client';

import { useState } from 'react';
import { MARKET } from '@/lib/domain/market';
import type { DecimalString } from '@/lib/domain/types';
import { formatNumber, formatQuantity } from '@/lib/formatters/money';
import { type ParseFailure, parseDecimalInput } from '@/lib/formatters/parse';
import { cn } from '@/lib/utils';
import { controlClasses } from './field';

type Mode = 'money' | 'quantity' | 'rate';

function display(value: string, mode: Mode): string {
  if (!value) return '';
  const canonical = value as DecimalString;
  if (mode === 'quantity') return formatQuantity(canonical);
  if (mode === 'rate') return formatNumber(canonical, { decimals: 4, minDecimals: 0 });
  return formatNumber(canonical, { decimals: MARKET.moneyDecimals });
}

export interface MoneyInputProps extends Omit<
  React.ComponentProps<'input'>,
  'value' | 'onChange' | 'type' | 'inputMode'
> {
  /** Valor canónico ("1234567.89") ou '' quando vazio/inválido. */
  value: string;
  onValueChange: (value: string, failure: ParseFailure | null) => void;
  mode?: Mode;
  /** Sufixo visível (Kz, %, BTC…). */
  suffix?: string;
}

/**
 * Campo de valor com formato pt-AO. Enquanto se escreve, mostra o texto tal como foi
 * escrito; ao sair do campo, reformata ("1 234 567,89"). Aceita "1.500", "1 500,50", "1500.5".
 * Um texto inválido fica visível (para ser corrigido) em vez de desaparecer.
 */
export function MoneyInput({
  value,
  onValueChange,
  mode = 'money',
  suffix = mode === 'rate' ? '%' : mode === 'money' ? MARKET.currencySymbol : undefined,
  className,
  onBlur,
  onFocus,
  ...props
}: MoneyInputProps) {
  // `draft` só existe enquanto se edita (ou se o texto escrito for inválido).
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? display(value, mode);

  return (
    <div className="relative">
      <input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={shown}
        className={cn(controlClasses, 'text-right figures-table', suffix && 'pr-12', className)}
        onFocus={(event) => {
          setDraft(shown);
          onFocus?.(event);
        }}
        onChange={(event) => {
          const raw = event.target.value;
          setDraft(raw);
          const parsed = parseDecimalInput(raw, { mode });
          if (parsed.ok) onValueChange(parsed.value, null);
          else onValueChange('', parsed.reason);
        }}
        onBlur={(event) => {
          const parsed = parseDecimalInput(draft ?? '', { mode });
          if (parsed.ok || parsed.reason === 'empty') setDraft(null);
          onBlur?.(event);
        }}
      />
      {suffix ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-ink-3"
        >
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
