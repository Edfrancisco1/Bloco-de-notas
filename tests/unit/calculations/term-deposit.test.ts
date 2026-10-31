import { describe, expect, it } from 'vitest';
import { estimateTermDeposit } from '@/lib/calculations/term-deposit';
import { toDecimalString } from '@/lib/calculations/decimal';
import type { DecimalString } from '@/lib/domain/types';

const ds = (v: string) => v as DecimalString;
const base = {
  principal: ds('5000000'),
  annualRate: ds('14.5'),
  startDate: '2026-01-01',
  maturityDate: '2027-01-01',
  interestMethod: 'simple' as const,
  compoundingFrequency: 'at_maturity' as const,
  dayCountBasis: 'act_365' as const,
};

describe('estimateTermDeposit', () => {
  it('juros simples ACT/365 num ano exato', () => {
    const e = estimateTermDeposit(base);
    expect(e.days).toBe(365);
    expect(e.yearDays).toBe(365);
    expect(toDecimalString(e.grossInterest, 2)).toBe('725000');
    expect(toDecimalString(e.maturityValue, 2)).toBe('5725000');
    expect(e.tax).toBeNull();
  });

  it('juros simples ACT/360 rendem mais no mesmo período', () => {
    const e = estimateTermDeposit({ ...base, dayCountBasis: 'act_360' });
    // 5 000 000 × 0,145 × 365/360
    expect(toDecimalString(e.grossInterest, 2)).toBe('735069.44');
  });

  it('capitalização mensal', () => {
    const e = estimateTermDeposit({
      ...base,
      principal: ds('1000000'),
      annualRate: ds('12'),
      interestMethod: 'compound',
      compoundingFrequency: 'monthly',
    });
    // 1 000 000 × (1,01^12 − 1)
    expect(e.periodsPerYear).toBe(12);
    expect(toDecimalString(e.grossInterest, 2)).toBe('126825.03');
  });

  it('capitalização "no vencimento" equivale a juros simples', () => {
    const e = estimateTermDeposit({ ...base, interestMethod: 'compound' });
    expect(e.method).toBe('simple');
    expect(toDecimalString(e.grossInterest, 2)).toBe('725000');
  });

  it('aplica a retenção estimada indicada pelo utilizador', () => {
    const e = estimateTermDeposit({ ...base, estimatedTaxRate: ds('10') });
    expect(toDecimalString(e.tax!, 2)).toBe('72500');
    expect(toDecimalString(e.netInterest, 2)).toBe('652500');
  });

  it('convenção personalizada exige dias por ano', () => {
    expect(() => estimateTermDeposit({ ...base, dayCountBasis: 'custom' })).toThrow(RangeError);
    const e = estimateTermDeposit({ ...base, dayCountBasis: 'custom', customDayCount: 366 });
    expect(e.yearDays).toBe(366);
  });

  it('nunca devolve dias negativos', () => {
    const e = estimateTermDeposit({ ...base, maturityDate: '2025-12-01' });
    expect(e.days).toBe(0);
    expect(toDecimalString(e.grossInterest, 2)).toBe('0');
  });
});
