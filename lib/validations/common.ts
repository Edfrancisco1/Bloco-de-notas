import { z } from 'zod';
import { dec, isDecimalString } from '@/lib/calculations/decimal';
import { isIsoDate } from '@/lib/calculations/dates';
import { MARKET } from '@/lib/domain/market';
import type { DecimalString } from '@/lib/domain/types';

/** Blocos reutilizáveis dos schemas. Mensagens em português, prontas a mostrar junto ao campo. */

export const isoDate = z
  .string({ error: 'Indique uma data.' })
  .refine(isIsoDate, { error: 'Data inválida.' });

export const optionalIsoDate = z
  .string()
  .nullable()
  .transform((value) => (value ? value : null))
  .refine((value) => value === null || isIsoDate(value), { error: 'Data inválida.' });

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, { error: `Máximo de ${max} caracteres.` })
    .nullable()
    .transform((value) => (value ? value : null));

function decimalWithin(maxDecimals: number) {
  return z
    .string({ error: 'Indique um valor.' })
    .trim()
    .refine(isDecimalString, { error: 'Valor inválido.' })
    .refine((value) => (value.split('.')[1]?.length ?? 0) <= maxDecimals, {
      error: 'Demasiadas casas decimais.',
    })
    .transform((value) => value as DecimalString);
}

/** Valor monetário ≥ 0 (casas decimais da moeda). */
export const money = decimalWithin(MARKET.moneyDecimals).refine((v) => !dec(v).isNegative(), {
  error: 'O valor não pode ser negativo.',
});

/** Valor monetário > 0. */
export const positiveMoney = decimalWithin(MARKET.moneyDecimals).refine(
  (v) => dec(v).greaterThan(0),
  { error: 'O valor tem de ser maior do que zero.' },
);

/** Preço unitário (até 8 casas, para cripto cotada em Kz). */
export const unitPrice = decimalWithin(8).refine((v) => !dec(v).isNegative(), {
  error: 'O valor não pode ser negativo.',
});

export const quantity = decimalWithin(MARKET.quantityDecimals).refine(
  (v) => dec(v).greaterThan(0),
  { error: 'A quantidade tem de ser maior do que zero.' },
);

/** Taxa em percentagem (0 a 100, até 4 casas). */
export const ratePct = decimalWithin(4).refine(
  (v) => dec(v).greaterThanOrEqualTo(0) && dec(v).lessThanOrEqualTo(100),
  { error: 'A taxa tem de estar entre 0% e 100%.' },
);

export const nullable = <T extends z.ZodType>(schema: T) =>
  z.union([schema, z.null(), z.literal('').transform(() => null)]);

export const currency = z.enum(MARKET.activeCurrencies, { error: 'Moeda não suportada.' });

export const entityId = z
  .string({ error: 'Campo obrigatório.' })
  .min(1, { error: 'Campo obrigatório.' });

export function isValidTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}
