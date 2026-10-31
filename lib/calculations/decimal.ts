import Decimal from 'decimal.js';
import type { DecimalString } from '@/lib/domain/types';

/**
 * Aritmética decimal exata. Toda a matemática de dinheiro passa por aqui.
 * Precisão alargada para cálculos intermédios; o arredondamento acontece só na apresentação.
 */
export const D = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export type Dec = InstanceType<typeof D>;

export const ZERO: Dec = new D(0);

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

export function isDecimalString(value: unknown): value is DecimalString {
  return typeof value === 'string' && DECIMAL_PATTERN.test(value);
}

/** Valida e marca uma string decimal canónica. Lança erro se o formato for inválido. */
export function asDecimalString(value: string): DecimalString {
  if (!isDecimalString(value)) {
    throw new TypeError(`Valor decimal inválido: "${value}"`);
  }
  return value;
}

/** Converte para Decimal. Aceita apenas strings decimais ou Decimals — nunca `number`. */
export function dec(value: DecimalString | Dec | string): Dec {
  if (value instanceof D) return value;
  if (typeof value === 'string' && isDecimalString(value)) return new D(value);
  throw new TypeError(`Valor decimal inválido: "${String(value)}"`);
}

/** Decimal → texto canónico sem notação exponencial, com até `decimals` casas. */
export function toDecimalString(value: Dec, decimals = 8): DecimalString {
  const fixed = value.toDecimalPlaces(decimals).toFixed();
  return (fixed === '-0' ? '0' : fixed) as DecimalString;
}

export function sum(values: Iterable<Dec>): Dec {
  let total = ZERO;
  for (const value of values) total = total.plus(value);
  return total;
}

export function minDec(a: Dec, b: Dec): Dec {
  return a.lessThan(b) ? a : b;
}

export function maxDec(a: Dec, b: Dec): Dec {
  return a.greaterThan(b) ? a : b;
}
