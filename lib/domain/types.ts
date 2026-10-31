/**
 * Tipos do domínio. Espelham o modelo de dados do PLANO_MVP §10, com duas adaptações:
 * - ids são strings (o Supabase devolve bigint como texto quando lido em segurança);
 * - datas de movimentos, avaliações e lembretes são datas de calendário (IsoDate).
 */

/** Valor decimal exato em texto canónico (ex.: "1234567.89"). Nunca usar `number` para dinheiro. */
export type DecimalString = string & { readonly __brand: 'DecimalString' };

/** Data de calendário ISO (AAAA-MM-DD), sem fuso. */
export type IsoDate = string;

/** Instante ISO 8601 (ex.: 2026-10-30T09:00:00.000Z). */
export type IsoDateTime = string;

/** Código de moeda ISO 4217 (ex.: AOA). */
export type CurrencyCode = string;

export const INVESTMENT_TYPES = [
  'term_deposit',
  'bond',
  'security',
  'crypto',
  'alternative',
  'other',
] as const;
export type InvestmentType = (typeof INVESTMENT_TYPES)[number];

export const INVESTMENT_STATUSES = ['active', 'matured', 'closed', 'archived'] as const;
export type InvestmentStatus = (typeof INVESTMENT_STATUSES)[number];

export const INSTITUTION_KINDS = [
  'bank',
  'broker',
  'exchange',
  'wallet',
  'platform',
  'other',
] as const;
export type InstitutionKind = (typeof INSTITUTION_KINDS)[number];

export const TRANSACTION_TYPES = [
  'initial',
  'contribution',
  'redemption',
  'withdrawal',
  'interest',
  'dividend',
  'fee',
  'tax',
  'adjustment',
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const ADJUSTMENT_DIRECTIONS = ['increase', 'decrease'] as const;
export type AdjustmentDirection = (typeof ADJUSTMENT_DIRECTIONS)[number];

export const SECURITY_ASSET_CLASSES = ['stock', 'etf', 'fund'] as const;
export type SecurityAssetClass = (typeof SECURITY_ASSET_CLASSES)[number];

export const ALTERNATIVE_SUBTYPES = ['p2p', 'crowdfunding', 'real_estate'] as const;
export type AlternativeSubtype = (typeof ALTERNATIVE_SUBTYPES)[number];

export const RATE_TYPES = ['fixed', 'variable'] as const;
export type RateType = (typeof RATE_TYPES)[number];

export const INTEREST_METHODS = ['simple', 'compound'] as const;
export type InterestMethod = (typeof INTEREST_METHODS)[number];

export const PAYMENT_FREQUENCIES = [
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
  'at_maturity',
] as const;
export type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number];

export const DAY_COUNT_BASES = ['act_365', 'act_360', 'custom'] as const;
export type DayCountBasis = (typeof DAY_COUNT_BASES)[number];

export const REMINDER_STATUSES = ['pending', 'done', 'snoozed', 'cancelled'] as const;
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];

export interface Profile {
  userId: string;
  email: string;
  displayName: string | null;
  baseCurrency: CurrencyCode;
  timezone: string;
  onboardedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Portfolio {
  id: string;
  name: string;
  baseCurrency: CurrencyCode;
  isDefault: boolean;
  archivedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Institution {
  id: string;
  name: string;
  kind: InstitutionKind;
  countryCode: string | null;
  notes: string | null;
  archivedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface TermDepositDetails {
  kind: 'term_deposit';
  principal: DecimalString;
  /** Taxa anual nominal em percentagem (ex.: "14.5" = 14,5 %). */
  annualRate: DecimalString;
  rateType: RateType;
  interestMethod: InterestMethod;
  compoundingFrequency: PaymentFrequency;
  dayCountBasis: DayCountBasis;
  /** Dias por ano quando `dayCountBasis` é `custom`. */
  customDayCount: number | null;
  autoRenew: boolean;
  /** Retenção estimada em percentagem, indicada pelo utilizador. Nunca pré-preenchida. */
  estimatedTaxRate: DecimalString | null;
}

export interface SecurityDetails {
  kind: 'security';
  assetClass: SecurityAssetClass;
  market: string | null;
}

export interface CryptoDetails {
  kind: 'crypto';
  network: string | null;
}

export interface BondDetails {
  kind: 'bond';
  issuer: string | null;
  nominalValue: DecimalString | null;
  couponRate: DecimalString | null;
  couponFrequency: PaymentFrequency | null;
}

export interface AlternativeDetails {
  kind: 'alternative';
  subtype: AlternativeSubtype;
  platformOrProject: string | null;
  expectedRate: DecimalString | null;
  expectedExitDate: IsoDate | null;
}

export interface OtherDetails {
  kind: 'other';
}

export type InvestmentDetails =
  | TermDepositDetails
  | SecurityDetails
  | CryptoDetails
  | BondDetails
  | AlternativeDetails
  | OtherDetails;

export interface CustomField {
  key: string;
  value: string;
}

export interface Investment {
  id: string;
  portfolioId: string;
  institutionId: string | null;
  name: string;
  type: InvestmentType;
  symbol: string | null;
  isin: string | null;
  currency: CurrencyCode;
  status: InvestmentStatus;
  startDate: IsoDate;
  maturityDate: IsoDate | null;
  closedAt: IsoDateTime | null;
  details: InvestmentDetails;
  tags: string[];
  customFields: CustomField[];
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Transaction {
  id: string;
  investmentId: string;
  type: TransactionType;
  occurredOn: IsoDate;
  currency: CurrencyCode;
  /** Valor principal, sempre positivo; o tipo define a direção. */
  amount: DecimalString;
  quantity: DecimalString | null;
  unitPrice: DecimalString | null;
  feeAmount: DecimalString;
  taxAmount: DecimalString;
  /** Parte de capital de uma venda/resgate/levantamento, quando indicada. */
  capitalComponent: DecimalString | null;
  isReinvested: boolean;
  /** Só para ajustes: aumenta ou diminui o capital (e a quantidade, se indicada). */
  adjustmentDirection: AdjustmentDirection | null;
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Valuation {
  id: string;
  investmentId: string;
  valuedOn: IsoDate;
  currency: CurrencyCode;
  quantity: DecimalString | null;
  unitPrice: DecimalString | null;
  totalValue: DecimalString;
  source: 'manual';
  notes: string | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface Reminder {
  id: string;
  investmentId: string | null;
  title: string;
  dueOn: IsoDate;
  status: ReminderStatus;
  completedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface ExchangeRate {
  rateDate: IsoDate;
  fromCurrency: CurrencyCode;
  toCurrency: CurrencyCode;
  rate: DecimalString;
}

export type AuditAction =
  'create' | 'update' | 'delete' | 'archive' | 'close' | 'reopen' | 'status';

export interface AuditEvent {
  id: string;
  entityType:
    | 'profile'
    | 'portfolio'
    | 'institution'
    | 'investment'
    | 'transaction'
    | 'valuation'
    | 'reminder';
  entityId: string;
  action: AuditAction;
  /** Só os nomes dos campos alterados — nunca valores. */
  changedFields: string[] | null;
  createdAt: IsoDateTime;
}
