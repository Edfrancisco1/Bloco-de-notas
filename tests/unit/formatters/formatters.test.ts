import { describe, expect, it } from 'vitest';
import {
  formatMoney,
  formatMoneyCompact,
  formatNumber,
  formatPercent,
  formatQuantity,
  formatRate,
} from '@/lib/formatters/money';
import {
  formatDate,
  formatDayMonth,
  formatDueIn,
  formatMonthYear,
  formatRelativeDays,
  formatUpdatedAgo,
} from '@/lib/formatters/dates';
import { parseDecimalInput } from '@/lib/formatters/parse';
import { D } from '@/lib/calculations/decimal';
import type { DecimalString } from '@/lib/domain/types';
import { nb } from '../../support/builders';

const ds = (v: string) => v as DecimalString;

describe('formatMoney (pt-AO, Kwanza)', () => {
  it('formata com espaço de milhares, vírgula decimal e sufixo Kz', () => {
    expect(formatMoney(ds('1234567.89'))).toBe(nb('1 234 567,89 Kz'));
    expect(formatMoney(ds('5000000'))).toBe(nb('5 000 000,00 Kz'));
  });

  it('não perde precisão em valores muito grandes', () => {
    expect(formatMoney(ds('12345678901234.56'))).toBe(nb('12 345 678 901 234,56 Kz'));
  });

  it('usa o sinal tipográfico e mostra + quando pedido', () => {
    expect(formatMoney(ds('-1234.5'))).toBe(nb('−1 234,50 Kz'));
    expect(formatMoney(ds('1234.5'), { sign: 'always' })).toBe(nb('+1 234,50 Kz'));
    expect(formatMoney(ds('0'), { sign: 'always' })).toBe(nb('0,00 Kz'));
  });

  it('não mostra "−0,00" para valores que arredondam a zero', () => {
    expect(formatMoney(new D('-0.001'))).toBe(nb('0,00 Kz'));
  });

  it('formato compacto para etiquetas de gráficos', () => {
    expect(formatMoneyCompact(ds('125400000'))).toBe(nb('125,4 M Kz'));
    expect(formatMoneyCompact(ds('1254000000'))).toBe(nb('1,25 mil M Kz'));
    expect(formatMoneyCompact(ds('850000'))).toBe(nb('850 000 Kz'));
  });

  it('quantidades, percentagens e taxas', () => {
    expect(formatQuantity(ds('0.02200000'))).toBe('0,022');
    expect(formatPercent(ds('0.1375'))).toBe('13,8%');
    expect(formatPercent(ds('-0.0425'), { sign: 'always' })).toBe('−4,3%');
    expect(formatRate(ds('14.5'))).toBe('14,50%');
    expect(formatNumber(ds('2500000'), { decimals: 0 })).toBe(nb('2 500 000'));
  });
});

describe('datas pt-AO', () => {
  it('formatos curto, médio e longo', () => {
    expect(formatDate('2026-10-30', 'short')).toBe('30/10/2026');
    expect(formatDate('2026-10-30')).toBe('30 out. 2026');
    expect(formatDate('2026-10-30', 'long')).toBe('30 de outubro de 2026');
    expect(formatDayMonth('2026-05-03')).toBe('3 mai.');
    expect(formatMonthYear('2026-10-30')).toBe('Outubro de 2026');
  });

  it('tempo relativo', () => {
    expect(formatRelativeDays(0)).toBe('hoje');
    expect(formatRelativeDays(-1)).toBe('ontem');
    expect(formatRelativeDays(7)).toBe('dentro de 7 dias');
    expect(formatRelativeDays(-45)).toBe('há 45 dias');
    expect(formatRelativeDays(-75)).toBe('há 3 meses');
    expect(formatUpdatedAgo(0)).toBe('Atualizado hoje');
    expect(formatUpdatedAgo(12)).toBe('Atualizado há 12 dias');
    expect(formatDueIn(7)).toBe('Vence dentro de 7 dias');
    expect(formatDueIn(-2)).toBe('Venceu anteontem');
  });
});

describe('parseDecimalInput', () => {
  const money = (raw: string) => parseDecimalInput(raw);
  const ok = (value: string) => ({ ok: true, value });

  it('aceita o formato angolano e variantes comuns', () => {
    expect(money('1 234 567,89')).toEqual(ok('1234567.89'));
    expect(money('1\u00a0234\u00a0567,89 Kz')).toEqual(ok('1234567.89'));
    expect(money('1.234.567,89')).toEqual(ok('1234567.89'));
    expect(money('1234567.89')).toEqual(ok('1234567.89'));
    expect(money('1,234,567')).toEqual(ok('1234567'));
    expect(money('5000000,00')).toEqual(ok('5000000'));
    expect(money(',5')).toEqual(ok('0.5'));
  });

  it('num valor monetário, "1.500" são mil e quinhentos', () => {
    expect(money('1.500')).toEqual(ok('1500'));
    expect(money('100.000')).toEqual(ok('100000'));
    expect(money('10.50')).toEqual(ok('10.5'));
  });

  it('em quantidades o ponto é decimal e aceita até 8 casas', () => {
    expect(parseDecimalInput('0.015', { mode: 'quantity' })).toEqual(ok('0.015'));
    expect(parseDecimalInput('0,00000001', { mode: 'quantity' })).toEqual(ok('0.00000001'));
    expect(parseDecimalInput('0,000000001', { mode: 'quantity' })).toEqual({
      ok: false,
      reason: 'too_many_decimals',
    });
  });

  it('rejeita valores vazios, inválidos, negativos e com casas a mais', () => {
    expect(money('  ')).toEqual({ ok: false, reason: 'empty' });
    expect(money('abc')).toEqual({ ok: false, reason: 'invalid' });
    expect(money('1,2,3.4.5')).toEqual({ ok: false, reason: 'invalid' });
    expect(money('-5')).toEqual({ ok: false, reason: 'negative' });
    expect(money('5,999')).toEqual({ ok: false, reason: 'too_many_decimals' });
    expect(parseDecimalInput('-5', { allowNegative: true })).toEqual(ok('-5'));
  });
});
