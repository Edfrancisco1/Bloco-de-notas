import { describe, expect, it } from 'vitest';
import { aggregatePositions, allocateBy, type Position } from '@/lib/calculations/aggregate';
import { toDecimalString } from '@/lib/calculations/decimal';
import { computeInvestmentMetrics } from '@/lib/calculations/metrics';
import type { DecimalString, Investment } from '@/lib/domain/types';
import { investment, tx, valuation } from '../../support/builders';

function position(inv: Partial<Investment>, initial: string, value: string | null): Position {
  const i = investment(inv);
  return {
    investment: i,
    metrics: computeInvestmentMetrics({
      status: i.status,
      transactions: [tx('initial', '2026-01-01', initial)],
      latestValuation: value === null ? null : valuation('2026-10-01', value),
    }),
  };
}

const s = (v: Parameters<typeof toDecimalString>[0]) => toDecimalString(v, 2);

describe('aggregatePositions', () => {
  it('soma na moeda base e reporta a cobertura das avaliações', () => {
    const totals = aggregatePositions(
      [
        position({ type: 'term_deposit' }, '1000', '1100'),
        position({ type: 'crypto' }, '500', '400'),
        position({ type: 'other' }, '300', null),
      ],
      'AOA',
    );
    expect(s(totals.netInvested)).toBe('1800');
    expect(s(totals.currentValue)).toBe('1500');
    // Resultado só das posições com valor conhecido: (1100 − 1000) + (400 − 500)
    expect(s(totals.result)).toBe('0');
    expect(s(totals.resultInflows)).toBe('1500');
    expect(totals.coverage).toEqual({ valued: 2, open: 3 });
    expect(totals.unconverted).toEqual([]);
  });

  it('nunca soma moedas diferentes sem taxa: separa em "por converter"', () => {
    const totals = aggregatePositions(
      [position({}, '1000', '1000'), position({ currency: 'USD' }, '200', '210')],
      'AOA',
    );
    expect(s(totals.currentValue)).toBe('1000');
    expect(totals.unconverted).toHaveLength(1);
    expect(totals.unconverted[0]?.currency).toBe('USD');
    expect(s(totals.unconverted[0]!.currentValue)).toBe('210');
  });

  it('converte com taxa manual e guarda a taxa usada', () => {
    const rate = {
      rateDate: '2026-10-01',
      fromCurrency: 'USD',
      toCurrency: 'AOA',
      rate: '920' as DecimalString,
    };
    const totals = aggregatePositions(
      [position({ currency: 'USD' }, '100', '110')],
      'AOA',
      () => rate,
    );
    expect(s(totals.currentValue)).toBe('101200');
    expect(totals.ratesUsed).toEqual([rate]);
  });

  it('ignora arquivados e conta encerrados no resultado, não no valor', () => {
    const closed: Position = {
      investment: investment({ status: 'closed' }),
      metrics: computeInvestmentMetrics({
        status: 'closed',
        transactions: [
          tx('initial', '2025-01-01', '1000'),
          tx('redemption', '2025-06-01', '1100', { capital: '1000' }),
        ],
        latestValuation: null,
      }),
    };
    const totals = aggregatePositions(
      [closed, position({ status: 'archived' }, '9999', '9999')],
      'AOA',
    );
    expect(s(totals.currentValue)).toBe('0');
    expect(s(totals.result)).toBe('100');
    expect(totals.coverage).toEqual({ valued: 0, open: 0 });
  });
});

describe('allocateBy', () => {
  it('distribui o valor conhecido e ordena do maior para o menor', () => {
    const slices = allocateBy(
      [
        position({ type: 'term_deposit' }, '1', '3000'),
        position({ type: 'crypto' }, '1', '1000'),
        position({ type: 'term_deposit' }, '1', '1000'),
        position({ type: 'other' }, '1', null),
      ],
      'AOA',
      (p) => p.investment.type,
    );
    expect(slices.map((x) => x.key)).toEqual(['term_deposit', 'crypto']);
    expect(s(slices[0]!.share)).toBe('0.8');
    expect(slices[0]!.count).toBe(2);
  });
});
