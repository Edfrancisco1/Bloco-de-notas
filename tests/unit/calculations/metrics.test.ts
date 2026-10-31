import { describe, expect, it } from 'vitest';
import {
  computeInvestmentMetrics,
  latestValuation,
  sortTransactions,
} from '@/lib/calculations/metrics';
import { toDecimalString } from '@/lib/calculations/decimal';
import { tx, valuation } from '../../support/builders';

const s = (value: Parameters<typeof toDecimalString>[0] | null, dp = 2) =>
  value === null ? null : toDecimalString(value, dp);

describe('computeInvestmentMetrics', () => {
  it('calcula capital, valor e resultado de um investimento simples', () => {
    const m = computeInvestmentMetrics({
      status: 'active',
      transactions: [tx('initial', '2026-01-10', '1000000')],
      latestValuation: valuation('2026-10-01', '1050000'),
    });
    expect(s(m.capitalInflows)).toBe('1000000');
    expect(s(m.netInvested)).toBe('1000000');
    expect(s(m.currentValue)).toBe('1050000');
    expect(s(m.result)).toBe('50000');
    expect(s(m.simpleReturn, 4)).toBe('0.05');
    expect(m.valuedOn).toBe('2026-10-01');
  });

  it('sem avaliação não inventa valor atual nem resultado', () => {
    const m = computeInvestmentMetrics({
      status: 'active',
      transactions: [tx('initial', '2026-01-10', '1500000')],
      latestValuation: null,
    });
    expect(m.currentValue).toBeNull();
    expect(m.result).toBeNull();
    expect(m.simpleReturn).toBeNull();
    expect(s(m.netInvested)).toBe('1500000');
  });

  it('posição encerrada: valor zero e resultado realizado com componente de capital', () => {
    const m = computeInvestmentMetrics({
      status: 'closed',
      closedOn: '2025-12-20',
      transactions: [
        tx('initial', '2025-09-20', '1500000'),
        tx('redemption', '2025-12-20', '1545000', { capital: '1500000', tax: '4500' }),
      ],
      latestValuation: valuation('2025-11-01', '1520000'),
    });
    expect(s(m.currentValue)).toBe('0');
    expect(m.valuedOn).toBe('2025-12-20');
    expect(s(m.netInvested)).toBe('0');
    expect(s(m.realizedGain)).toBe('45000');
    expect(s(m.costs)).toBe('4500');
    expect(s(m.result)).toBe('40500');
  });

  it('resgate sem componente de capital: devolve no máximo o capital ainda investido', () => {
    const m = computeInvestmentMetrics({
      status: 'closed',
      transactions: [
        tx('initial', '2025-01-01', '1500000'),
        tx('redemption', '2025-07-01', '1545000'),
      ],
      latestValuation: null,
    });
    expect(s(m.capitalReturned)).toBe('1500000');
    expect(s(m.realizedGain)).toBe('45000');
    expect(s(m.result)).toBe('45000');
  });

  it('custo médio ponderado com compras, comissões e venda parcial de cripto', () => {
    const m = computeInvestmentMetrics({
      status: 'active',
      transactions: [
        tx('initial', '2025-12-01', '1160000', { quantity: '0.02', fee: '11600' }),
        tx('contribution', '2026-06-02', '810000', { quantity: '0.01', fee: '8100' }),
        tx('redemption', '2026-09-20', '736000', { quantity: '0.008', fee: '7360' }),
      ],
      latestValuation: valuation('2026-10-29', '2123000'),
    });
    expect(s(m.quantity, 8)).toBe('0.022');
    // 1 970 000 / 0,03 = 65 666 666,67 por unidade; a venda não altera o custo médio.
    expect(s(m.averageCost)).toBe('65666666.67');
    expect(s(m.capitalReturned)).toBe('525333.33');
    expect(s(m.netInvested)).toBe('1444666.67');
    expect(s(m.exitProceeds)).toBe('736000');
    expect(s(m.costs)).toBe('27060');
    expect(s(m.result)).toBe('861940');
    expect(s(m.simpleReturn, 6)).toBe('0.437533');
  });

  it('inclui comissões de compra no custo médio quando pedido', () => {
    const m = computeInvestmentMetrics({
      status: 'active',
      includeFeesInCost: true,
      transactions: [tx('initial', '2026-01-01', '1000', { quantity: '10', fee: '20' })],
      latestValuation: null,
    });
    expect(s(m.averageCost)).toBe('102');
  });

  it('juros reinvestidos contam como rendimento e entrada (não há dupla contagem)', () => {
    const m = computeInvestmentMetrics({
      status: 'active',
      transactions: [
        tx('initial', '2026-01-01', '1000'),
        tx('interest', '2026-06-30', '100', { isReinvested: true }),
      ],
      latestValuation: valuation('2026-07-01', '1100'),
    });
    expect(s(m.capitalInflows)).toBe('1100');
    expect(s(m.income)).toBe('100');
    expect(s(m.reinvestedIncome)).toBe('100');
    expect(s(m.result)).toBe('100');
  });

  it('rendimentos pagos e custos autónomos entram no resultado', () => {
    const m = computeInvestmentMetrics({
      status: 'active',
      transactions: [
        tx('initial', '2026-01-01', '2000000', { quantity: '400', fee: '10000' }),
        tx('dividend', '2026-08-01', '90000', { tax: '9000' }),
        tx('fee', '2026-09-01', '2500'),
        tx('tax', '2026-09-02', '1500'),
      ],
      latestValuation: valuation('2026-10-01', '2100000'),
    });
    expect(s(m.income)).toBe('90000');
    expect(s(m.costs)).toBe('23000');
    // 2 100 000 + 90 000 − 2 000 000 − 23 000
    expect(s(m.result)).toBe('167000');
  });

  it('ajustes aumentam ou diminuem o capital investido', () => {
    const m = computeInvestmentMetrics({
      status: 'active',
      transactions: [
        tx('initial', '2026-01-01', '1000'),
        tx('adjustment', '2026-02-01', '200', { adjustmentDirection: 'increase' }),
        tx('adjustment', '2026-03-01', '50', { adjustmentDirection: 'decrease' }),
      ],
      latestValuation: null,
    });
    expect(s(m.capitalInflows)).toBe('1150');
    expect(s(m.netInvested)).toBe('1150');
  });
});

describe('ordenação e avaliação mais recente', () => {
  it('ordena por data e, no mesmo dia, pela ordem de registo', () => {
    const a = tx('initial', '2026-02-01', '1', { createdAt: '2026-02-01T10:00:00.000Z' });
    const b = tx('fee', '2026-02-01', '1', { createdAt: '2026-02-01T09:00:00.000Z' });
    const c = tx('fee', '2026-01-15', '1');
    expect(sortTransactions([a, b, c]).map((t) => t.id)).toEqual([c.id, b.id, a.id]);
  });

  it('escolhe a avaliação mais recente', () => {
    const older = valuation('2026-09-01', '100');
    const sameDayEarly = valuation('2026-10-01', '110', '2026-10-01T08:00:00.000Z');
    const sameDayLate = valuation('2026-10-01', '120', '2026-10-01T18:00:00.000Z');
    expect(latestValuation([older, sameDayLate, sameDayEarly])?.id).toBe(sameDayLate.id);
    expect(latestValuation([])).toBeNull();
  });
});
