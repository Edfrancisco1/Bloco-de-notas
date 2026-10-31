import { MARKET } from '@/lib/domain/market';
import type { CurrencyCode, DecimalString } from '@/lib/domain/types';
import { type Dec, D, dec } from '@/lib/calculations/decimal';

/**
 * Formatação de valores (pt-AO). Os valores entram como string decimal e são formatados pelo
 * Intl a partir da string — sem passar por `number`, para não perder precisão.
 */

const MINUS = '−';
const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = JSON.stringify(options);
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(MARKET.locale, options);
    formatters.set(key, formatter);
  }
  return formatter;
}

type Numeric = DecimalString | Dec;

function literal(value: Numeric): Intl.StringNumericLiteral {
  return (typeof value === 'string' ? value : value.toFixed()) as Intl.StringNumericLiteral;
}

/** Sinal tipográfico (−) em vez do hífen. */
function typographicMinus(text: string): string {
  return text.replace('-', MINUS);
}

export type SignMode = 'negative' | 'always';

export interface MoneyFormatOptions {
  currency?: CurrencyCode;
  /** `always` mostra + nos positivos (para variações). */
  sign?: SignMode;
  decimals?: number;
}

export function formatMoney(value: Numeric, options: MoneyFormatOptions = {}): string {
  const {
    currency = MARKET.baseCurrency,
    sign = 'negative',
    decimals = MARKET.moneyDecimals,
  } = options;
  const formatter = getFormatter({
    style: 'currency',
    currency,
    signDisplay: sign === 'always' ? 'exceptZero' : 'negative',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return typographicMinus(formatter.format(literal(value)));
}

/** Número sem moeda (ex.: para separar o valor do sufixo "Kz" em tipografia de destaque). */
export function formatNumber(
  value: Numeric,
  options: { decimals?: number; minDecimals?: number; sign?: SignMode } = {},
): string {
  const { decimals = MARKET.moneyDecimals, minDecimals = decimals, sign = 'negative' } = options;
  const formatter = getFormatter({
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: decimals,
    signDisplay: sign === 'always' ? 'exceptZero' : 'negative',
  });
  return typographicMinus(formatter.format(literal(value)));
}

const MILLION = new D('1e6');
const BILLION = new D('1e9');

/**
 * Formato compacto, só para etiquetas de gráficos. Usa "M Kz" (milhões) e "mil M Kz"
 * (mil milhões) em vez do "mM" do Intl, que é ambíguo.
 */
export function formatMoneyCompact(value: Numeric, currencySymbol: string = MARKET.currencySymbol) {
  const amount = typeof value === 'string' ? dec(value) : value;
  const abs = amount.abs();
  const nbsp = '\u00a0';
  if (abs.greaterThanOrEqualTo(BILLION)) {
    const scaled = formatNumber(amount.dividedBy(BILLION), { decimals: 2, minDecimals: 0 });
    return `${scaled}${nbsp}mil${nbsp}M${nbsp}${currencySymbol}`;
  }
  if (abs.greaterThanOrEqualTo(MILLION)) {
    const scaled = formatNumber(amount.dividedBy(MILLION), { decimals: 1, minDecimals: 0 });
    return `${scaled}${nbsp}M${nbsp}${currencySymbol}`;
  }
  return `${formatNumber(amount, { decimals: 0 })}${nbsp}${currencySymbol}`;
}

export function formatQuantity(value: Numeric, maxDecimals: number = MARKET.quantityDecimals) {
  return formatNumber(value, { decimals: maxDecimals, minDecimals: 0 });
}

/** Fração → percentagem (0,1375 → "13,8%"). */
export function formatPercent(
  fraction: Numeric,
  options: { decimals?: number; sign?: SignMode } = {},
): string {
  const { decimals = 1, sign = 'negative' } = options;
  const formatter = getFormatter({
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: sign === 'always' ? 'exceptZero' : 'negative',
  });
  return typographicMinus(formatter.format(literal(fraction)));
}

/** Taxa guardada em percentagem ("14.5") → "14,50%". */
export function formatRate(ratePct: Numeric): string {
  return `${formatNumber(ratePct, { decimals: 4, minDecimals: 2 })}%`;
}

/** Partes de um valor monetário para tipografia de destaque (número grande + sufixo pequeno). */
export function moneyParts(value: Numeric, options: MoneyFormatOptions = {}) {
  const decimals = options.decimals ?? MARKET.moneyDecimals;
  const number = formatNumber(value, { decimals, sign: options.sign ?? 'negative' });
  return { number, currency: MARKET.currencySymbol };
}
