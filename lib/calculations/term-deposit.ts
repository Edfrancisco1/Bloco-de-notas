import type {
  DayCountBasis,
  DecimalString,
  InterestMethod,
  IsoDate,
  PaymentFrequency,
} from '@/lib/domain/types';
import { type Dec, D, ZERO, dec, toDecimalString } from './decimal';
import { daysBetween } from './dates';

/**
 * Estimativa de juros de um depósito a prazo. É sempre uma ESTIMATIVA: o valor confirmado
 * vem de um movimento ou de uma avaliação manual (PLANO_MVP §6).
 */
export interface TermDepositEstimateInput {
  principal: DecimalString;
  /** Taxa anual nominal em percentagem (ex.: "14.5"). */
  annualRate: DecimalString;
  startDate: IsoDate;
  maturityDate: IsoDate;
  interestMethod: InterestMethod;
  compoundingFrequency: PaymentFrequency;
  dayCountBasis: DayCountBasis;
  customDayCount?: number | null;
  /** Retenção estimada em percentagem, se o utilizador a indicar. */
  estimatedTaxRate?: DecimalString | null;
}

export interface TermDepositEstimate {
  days: number;
  /** Dias por ano usados (365, 360 ou personalizado). */
  yearDays: number;
  yearFraction: Dec;
  /** Capitalizações por ano (0 = juros simples). */
  periodsPerYear: number;
  method: InterestMethod;
  grossInterest: Dec;
  tax: Dec | null;
  netInterest: Dec;
  maturityValue: Dec;
}

const PERIODS_PER_YEAR: Record<PaymentFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  semiannual: 2,
  annual: 1,
  at_maturity: 0,
};

export function yearDaysFor(basis: DayCountBasis, customDayCount?: number | null): number {
  if (basis === 'act_360') return 360;
  if (basis === 'custom') {
    if (!customDayCount || customDayCount <= 0) {
      throw new RangeError('A convenção personalizada precisa de um número de dias por ano.');
    }
    return customDayCount;
  }
  return 365;
}

export function estimateTermDeposit(input: TermDepositEstimateInput): TermDepositEstimate {
  const principal = dec(input.principal);
  const rate = dec(input.annualRate).dividedBy(100);
  const days = Math.max(daysBetween(input.startDate, input.maturityDate), 0);
  const yearDays = yearDaysFor(input.dayCountBasis, input.customDayCount);
  const yearFraction = new D(days).dividedBy(yearDays);

  const periodsPerYear =
    input.interestMethod === 'compound' ? PERIODS_PER_YEAR[input.compoundingFrequency] : 0;

  let grossInterest: Dec;
  if (periodsPerYear > 0) {
    // P × ((1 + r/m)^(m·t) − 1)
    const growth = rate.dividedBy(periodsPerYear).plus(1).pow(yearFraction.times(periodsPerYear));
    grossInterest = principal.times(growth.minus(1));
  } else {
    // P × r × t
    grossInterest = principal.times(rate).times(yearFraction);
  }

  const tax = input.estimatedTaxRate
    ? grossInterest.times(dec(input.estimatedTaxRate)).dividedBy(100)
    : null;
  const netInterest = grossInterest.minus(tax ?? ZERO);

  return {
    days,
    yearDays,
    yearFraction,
    periodsPerYear,
    method: periodsPerYear > 0 ? 'compound' : 'simple',
    grossInterest,
    tax,
    netInterest,
    maturityValue: principal.plus(netInterest),
  };
}

/** Estimativa serializável (strings decimais), igual no servidor e no cliente. */
export interface TermDepositSummary {
  principal: DecimalString;
  annualRate: DecimalString;
  startDate: IsoDate;
  maturityDate: IsoDate;
  days: number;
  yearDays: number;
  dayCountBasis: DayCountBasis;
  method: InterestMethod;
  periodsPerYear: number;
  grossInterest: DecimalString;
  taxRate: DecimalString | null;
  tax: DecimalString | null;
  netInterest: DecimalString;
  maturityValue: DecimalString;
}

export function summarizeTermDeposit(input: TermDepositEstimateInput): TermDepositSummary {
  const estimate = estimateTermDeposit(input);
  return {
    principal: input.principal,
    annualRate: input.annualRate,
    startDate: input.startDate,
    maturityDate: input.maturityDate,
    days: estimate.days,
    yearDays: estimate.yearDays,
    dayCountBasis: input.dayCountBasis,
    method: estimate.method,
    periodsPerYear: estimate.periodsPerYear,
    grossInterest: toDecimalString(estimate.grossInterest, 2),
    taxRate: input.estimatedTaxRate ?? null,
    tax: estimate.tax ? toDecimalString(estimate.tax, 2) : null,
    netInterest: toDecimalString(estimate.netInterest, 2),
    maturityValue: toDecimalString(estimate.maturityValue, 2),
  };
}
