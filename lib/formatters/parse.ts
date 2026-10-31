import type { DecimalString } from '@/lib/domain/types';
import { MARKET } from '@/lib/domain/market';

/**
 * Interpreta o que o utilizador escreve num campo de valor e devolve uma string decimal canónica.
 *
 * Aceita o formato angolano/português ("1 234 567,89") e variantes comuns ("1.234.567,89",
 * "1234567.89", "1 234 567,89 Kz"). Regras para separadores:
 * - com vírgula e ponto, o último que aparece é o separador decimal;
 * - vários separadores iguais são separadores de milhares;
 * - num valor monetário, um único ponto seguido de exatamente 3 dígitos (com 1–3 dígitos antes)
 *   é tratado como separador de milhares ("1.500" = 1500). Em quantidades é decimal ("0.015").
 */
export type ParseFailure = 'empty' | 'invalid' | 'negative' | 'too_many_decimals';

export type ParseResult = { ok: true; value: DecimalString } | { ok: false; reason: ParseFailure };

export interface ParseOptions {
  mode?: 'money' | 'quantity' | 'rate';
  maxDecimals?: number;
  allowNegative?: boolean;
}

const STRIP = /[\s\u00a0\u202f']|kz|aoa|%/gi;

export function parseDecimalInput(raw: string, options: ParseOptions = {}): ParseResult {
  const mode = options.mode ?? 'money';
  const maxDecimals =
    options.maxDecimals ??
    (mode === 'quantity' ? MARKET.quantityDecimals : mode === 'rate' ? 4 : MARKET.moneyDecimals);

  let text = raw.trim();
  if (text === '') return { ok: false, reason: 'empty' };

  text = text.replace(/−/g, '-').replace(STRIP, '');
  let negative = false;
  if (text.startsWith('-')) {
    negative = true;
    text = text.slice(1);
  }
  if (text === '' || /[^\d.,]/.test(text)) return { ok: false, reason: 'invalid' };

  const lastComma = text.lastIndexOf(',');
  const lastDot = text.lastIndexOf('.');
  let integerPart: string;
  let fractionPart = '';

  if (lastComma !== -1 && lastDot !== -1) {
    const decimalSep = lastComma > lastDot ? ',' : '.';
    const groupSep = decimalSep === ',' ? '.' : ',';
    const [intRaw = '', frac = '', ...rest] = text.split(decimalSep);
    if (rest.length > 0) return { ok: false, reason: 'invalid' };
    integerPart = intRaw.split(groupSep).join('');
    fractionPart = frac;
  } else if (lastComma !== -1 || lastDot !== -1) {
    const sep = lastComma !== -1 ? ',' : '.';
    const pieces = text.split(sep);
    if (pieces.length > 2) {
      integerPart = pieces.join('');
    } else {
      const [intRaw = '', frac = ''] = pieces;
      const looksLikeThousands =
        sep === '.' &&
        mode === 'money' &&
        frac.length === 3 &&
        intRaw.length >= 1 &&
        intRaw.length <= 3;
      if (looksLikeThousands) {
        integerPart = intRaw + frac;
      } else {
        integerPart = intRaw;
        fractionPart = frac;
      }
    }
  } else {
    integerPart = text;
  }

  if (integerPart === '') integerPart = '0';
  if (!/^\d+$/.test(integerPart) || (fractionPart !== '' && !/^\d+$/.test(fractionPart))) {
    return { ok: false, reason: 'invalid' };
  }
  if (negative && !options.allowNegative) return { ok: false, reason: 'negative' };

  fractionPart = fractionPart.replace(/0+$/, '');
  if (fractionPart.length > maxDecimals) return { ok: false, reason: 'too_many_decimals' };

  integerPart = integerPart.replace(/^0+(?=\d)/, '');
  const canonical = `${negative && (integerPart !== '0' || fractionPart) ? '-' : ''}${integerPart}${
    fractionPart ? `.${fractionPart}` : ''
  }`;
  return { ok: true, value: canonical as DecimalString };
}

export const parseFailureMessage: Record<ParseFailure, string> = {
  empty: 'Indique um valor.',
  invalid: 'Valor inválido. Use, por exemplo, 1 250 000,50.',
  negative: 'O valor não pode ser negativo.',
  too_many_decimals: 'Demasiadas casas decimais.',
};
