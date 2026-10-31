import type { CurrencyCode, ExchangeRate, Investment } from '@/lib/domain/types';
import { type Dec, ZERO, dec } from './decimal';
import type { InvestmentMetrics } from './metrics';

/**
 * Consolidação de uma carteira (PLANO_MVP §7, "Moedas").
 * - Só soma valores na moeda base ou com taxa de câmbio manual definida.
 * - Valores sem conversão ficam em `unconverted` — nunca são ignorados em silêncio.
 * - O valor atual e o resultado só incluem posições com valor conhecido; a cobertura diz quantas.
 */
export interface Position {
  investment: Investment;
  metrics: InvestmentMetrics;
}

export interface UnconvertedBucket {
  currency: CurrencyCode;
  count: number;
  netInvested: Dec;
  currentValue: Dec;
}

export interface PortfolioTotals {
  netInvested: Dec;
  capitalInflows: Dec;
  income: Dec;
  costs: Dec;
  /** Soma das posições abertas com avaliação. */
  currentValue: Dec;
  /** Resultado das posições com valor conhecido (abertas avaliadas + encerradas). */
  result: Dec;
  /** Entradas de capital dessas mesmas posições (base do retorno simples). */
  resultInflows: Dec;
  simpleReturn: Dec | null;
  coverage: { valued: number; open: number };
  unconverted: UnconvertedBucket[];
  /** Taxas usadas, para que o cálculo seja reprodutível. */
  ratesUsed: ExchangeRate[];
}

export type RateLookup = (from: CurrencyCode, to: CurrencyCode) => ExchangeRate | null;

const noRates: RateLookup = () => null;

function isOpen(position: Position): boolean {
  return position.investment.status === 'active' || position.investment.status === 'matured';
}

export function aggregatePositions(
  positions: readonly Position[],
  baseCurrency: CurrencyCode,
  lookupRate: RateLookup = noRates,
): PortfolioTotals {
  let netInvested = ZERO;
  let capitalInflows = ZERO;
  let income = ZERO;
  let costs = ZERO;
  let currentValue = ZERO;
  let result = ZERO;
  let resultInflows = ZERO;
  let valued = 0;
  let open = 0;
  const unconverted = new Map<CurrencyCode, UnconvertedBucket>();
  const ratesUsed = new Map<string, ExchangeRate>();

  for (const position of positions) {
    const { investment, metrics } = position;
    if (investment.status === 'archived') continue;

    let factor: Dec | null = null;
    if (investment.currency === baseCurrency) {
      factor = dec('1');
    } else {
      const rate = lookupRate(investment.currency, baseCurrency);
      if (rate) {
        factor = dec(rate.rate);
        ratesUsed.set(`${rate.fromCurrency}:${rate.toCurrency}:${rate.rateDate}`, rate);
      }
    }

    if (factor === null) {
      const bucket = unconverted.get(investment.currency) ?? {
        currency: investment.currency,
        count: 0,
        netInvested: ZERO,
        currentValue: ZERO,
      };
      bucket.count += 1;
      bucket.netInvested = bucket.netInvested.plus(metrics.netInvested);
      bucket.currentValue = bucket.currentValue.plus(metrics.currentValue ?? ZERO);
      unconverted.set(investment.currency, bucket);
      continue;
    }

    netInvested = netInvested.plus(metrics.netInvested.times(factor));
    capitalInflows = capitalInflows.plus(metrics.capitalInflows.times(factor));
    income = income.plus(metrics.income.times(factor));
    costs = costs.plus(metrics.costs.times(factor));

    if (isOpen(position)) {
      open += 1;
      if (metrics.currentValue !== null) {
        valued += 1;
        currentValue = currentValue.plus(metrics.currentValue.times(factor));
      }
    }
    if (metrics.result !== null) {
      result = result.plus(metrics.result.times(factor));
      resultInflows = resultInflows.plus(metrics.capitalInflows.times(factor));
    }
  }

  return {
    netInvested,
    capitalInflows,
    income,
    costs,
    currentValue,
    result,
    resultInflows,
    simpleReturn: resultInflows.greaterThan(0) ? result.dividedBy(resultInflows) : null,
    coverage: { valued, open },
    unconverted: [...unconverted.values()],
    ratesUsed: [...ratesUsed.values()],
  };
}

export interface AllocationSlice<K extends string> {
  key: K;
  value: Dec;
  /** Fração do total (0–1). */
  share: Dec;
  count: number;
}

/**
 * Distribuição do valor atual conhecido por uma chave (tipo, instituição…).
 * Só posições abertas, na moeda base, com avaliação.
 */
export function allocateBy<K extends string>(
  positions: readonly Position[],
  baseCurrency: CurrencyCode,
  keyOf: (position: Position) => K,
): AllocationSlice<K>[] {
  const totals = new Map<K, { value: Dec; count: number }>();
  let grandTotal = ZERO;

  for (const position of positions) {
    if (!isOpen(position)) continue;
    if (position.investment.currency !== baseCurrency) continue;
    const value = position.metrics.currentValue;
    if (value === null || value.lessThanOrEqualTo(0)) continue;
    const key = keyOf(position);
    const entry = totals.get(key) ?? { value: ZERO, count: 0 };
    entry.value = entry.value.plus(value);
    entry.count += 1;
    totals.set(key, entry);
    grandTotal = grandTotal.plus(value);
  }

  return [...totals.entries()]
    .map(([key, { value, count }]) => ({
      key,
      value,
      count,
      share: grandTotal.greaterThan(0) ? value.dividedBy(grandTotal) : ZERO,
    }))
    .sort((a, b) => b.value.comparedTo(a.value));
}
