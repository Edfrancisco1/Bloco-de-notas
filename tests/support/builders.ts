import type {
  DecimalString,
  Investment,
  Transaction,
  TransactionType,
  Valuation,
} from '@/lib/domain/types';

/** Construtores de dados de teste determinísticos. */

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;
const ds = (value: string) => value as DecimalString;

export function tx(
  type: TransactionType,
  occurredOn: string,
  amount: string,
  extra: Partial<
    Omit<
      Transaction,
      'type' | 'occurredOn' | 'amount' | 'quantity' | 'feeAmount' | 'taxAmount' | 'capitalComponent'
    >
  > & {
    quantity?: string | null;
    fee?: string;
    tax?: string;
    capital?: string | null;
  } = {},
): Transaction {
  const { quantity = null, fee = '0', tax = '0', capital = null, ...rest } = extra;
  const createdAt = rest.createdAt ?? `${occurredOn}T12:00:00.000Z`;
  return {
    id: nextId('tx'),
    investmentId: 'inv',
    type,
    occurredOn,
    currency: 'AOA',
    amount: ds(amount),
    quantity: quantity === null ? null : ds(quantity),
    unitPrice: null,
    feeAmount: ds(fee),
    taxAmount: ds(tax),
    capitalComponent: capital === null ? null : ds(capital),
    isReinvested: false,
    adjustmentDirection: null,
    notes: null,
    updatedAt: createdAt,
    ...rest,
    createdAt,
  };
}

export function valuation(valuedOn: string, totalValue: string, createdAt?: string): Valuation {
  const created = createdAt ?? `${valuedOn}T12:00:00.000Z`;
  return {
    id: nextId('val'),
    investmentId: 'inv',
    valuedOn,
    currency: 'AOA',
    quantity: null,
    unitPrice: null,
    totalValue: ds(totalValue),
    source: 'manual',
    notes: null,
    createdAt: created,
    updatedAt: created,
  };
}

export function investment(overrides: Partial<Investment> = {}): Investment {
  return {
    id: nextId('inv'),
    portfolioId: 'p1',
    institutionId: null,
    name: 'Investimento',
    type: 'other',
    symbol: null,
    isin: null,
    currency: 'AOA',
    status: 'active',
    startDate: '2026-01-01',
    maturityDate: null,
    closedAt: null,
    details: { kind: 'other' },
    tags: [],
    customFields: [],
    notes: null,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

/** Substitui espaços normais por espaços não separáveis, como faz o Intl em pt-AO. */
export const nb = (text: string) => text.replace(/ /g, '\u00a0');
