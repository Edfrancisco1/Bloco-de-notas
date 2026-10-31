import { describe, expect, it } from 'vitest';
import {
  type TransactionDraft,
  previewClosing,
  previewTransaction,
  previewValuation,
  totalFromUnits,
} from '@/lib/calculations/preview';
import type { DecimalString } from '@/lib/domain/types';
import { tx, valuation } from '../../support/builders';

const ds = (v: string) => v as DecimalString;

describe('previewValuation', () => {
  it('calcula o novo resultado e a variação face ao último valor', () => {
    // Entradas 1 970 000; saídas 736 000; custos 27 060 → base = 736 000 − 1 970 000 − 27 060
    const preview = previewValuation(
      { resultBase: ds('-1261060'), capitalInflows: ds('1970000'), lastValue: ds('2123000') },
      ds('2200000'),
    );
    expect(preview.result).toBe('938940');
    expect(preview.previousResult).toBe('861940');
    expect(preview.change).toBe('77000');
    expect(preview.simpleReturn).toBe('0.476619');
  });

  it('sem avaliação anterior não inventa variação', () => {
    const preview = previewValuation(
      { resultBase: ds('-1500000'), capitalInflows: ds('1500000'), lastValue: null },
      ds('1520000'),
    );
    expect(preview.result).toBe('20000');
    expect(preview.previousResult).toBeNull();
    expect(preview.change).toBeNull();
  });
});

describe('totalFromUnits', () => {
  it('multiplica quantidade por preço e arredonda às casas do Kwanza', () => {
    expect(totalFromUnits(ds('0.022'), ds('96500000'))).toBe('2123000');
    expect(totalFromUnits(ds('3'), ds('1061.405'))).toBe('3184.22');
  });
});

describe('previewTransaction', () => {
  const draft = (overrides: Partial<TransactionDraft> = {}): TransactionDraft => ({
    type: 'redemption',
    occurredOn: '2026-10-01',
    currency: 'AOA',
    amount: ds('600000'),
    quantity: ds('0.005'),
    unitPrice: null,
    feeAmount: ds('0'),
    taxAmount: ds('0'),
    capitalComponent: null,
    isReinvested: false,
    adjustmentDirection: null,
    notes: null,
    ...overrides,
  });
  const buys = [
    tx('initial', '2026-01-01', '1000000', { quantity: '0.02' }),
    tx('contribution', '2026-03-01', '500000', { quantity: '0.01' }),
  ];

  it('mostra o capital e a quantidade antes e depois de uma venda parcial', () => {
    const { before, after } = previewTransaction({
      status: 'active',
      transactions: buys,
      latestValuation: valuation('2026-09-30', '1800000'),
      draft: draft(),
    });
    expect(before.netInvested).toBe('1500000');
    expect(before.quantity).toBe('0.03');
    // Custo médio 50 000 000/unidade → 0,005 × 50 000 000 = 250 000 de capital devolvido.
    expect(after.netInvested).toBe('1250000');
    expect(after.quantity).toBe('0.025');
    expect(after.averageCost).toBe(before.averageCost);
  });

  it('ao editar, substitui o movimento original em vez de o somar', () => {
    const dividend = tx('dividend', '2026-05-01', '10000');
    const { before, after } = previewTransaction({
      status: 'active',
      transactions: [...buys, dividend],
      latestValuation: null,
      draft: draft({ type: 'dividend', amount: ds('15000'), quantity: null }),
      replaceId: dividend.id,
    });
    expect(before.income).toBe('10000');
    expect(after.income).toBe('15000');
  });
});

describe('previewClosing', () => {
  it('dá o resultado realizado de um depósito resgatado com juros e imposto', () => {
    const summary = previewClosing({
      transactions: [tx('initial', '2026-01-01', '1000000')],
      draft: {
        type: 'redemption',
        occurredOn: '2026-07-01',
        currency: 'AOA',
        amount: ds('1060000'),
        quantity: null,
        unitPrice: null,
        feeAmount: ds('0'),
        taxAmount: ds('6000'),
        capitalComponent: ds('1000000'),
        isReinvested: false,
        adjustmentDirection: null,
        notes: null,
      },
    });
    expect(summary.result).toBe('54000');
    expect(summary.netInvested).toBe('0');
  });

  it('sem movimento final, encerra com valor zero (perda do capital não recuperado)', () => {
    const summary = previewClosing({
      transactions: [tx('initial', '2026-01-01', '500000')],
      draft: null,
    });
    expect(summary.result).toBe('-500000');
  });
});
