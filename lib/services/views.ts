import type { DeadlineLevel, Freshness } from '@/lib/calculations/status';
import type { CurrencyCode, DecimalString, InvestmentType, IsoDate } from '@/lib/domain/types';

/**
 * View models serializáveis (só strings, números e booleanos) que os services entregam aos
 * componentes. Os componentes nunca calculam: apenas apresentam estes valores.
 */

/** Dados para o diálogo "Atualizar valor" e a pré-visualização do impacto. */
export interface ValuationTarget {
  investmentId: string;
  name: string;
  type: InvestmentType;
  currency: CurrencyCode;
  startDate: IsoDate;
  /** Quantidade detida (ativos com unidades). */
  quantity: DecimalString | null;
  lastValue: DecimalString | null;
  lastValuedOn: IsoDate | null;
  lastUnitPrice: DecimalString | null;
  /** Resultado sem o valor atual: saídas + rendimentos − entradas − custos. */
  resultBase: DecimalString;
  capitalInflows: DecimalString;
}

export interface AttentionItem {
  reason: 'missing' | 'stale' | 'matured';
  ageDays: number | null;
  daysOverdue: number | null;
  institutionName: string | null;
  target: ValuationTarget;
}

export interface SliceView {
  key: string;
  label: string;
  value: DecimalString;
  share: DecimalString;
  count: number;
}

export interface UpcomingItem {
  id: string;
  kind: 'maturity' | 'reminder';
  date: IsoDate;
  daysLeft: number;
  level: DeadlineLevel;
  title: string;
  investmentId: string | null;
  investmentName: string | null;
  investmentType: InvestmentType | null;
}

export interface ActivityItem {
  id: string;
  kind: 'transaction' | 'valuation';
  date: IsoDate;
  investmentId: string;
  investmentName: string;
  investmentType: InvestmentType;
  label: string;
  amount: DecimalString;
  /** Efeito para o utilizador: entrada de dinheiro, saída, ou apenas um novo valor. */
  flow: 'in' | 'out' | 'value';
}

export interface DashboardView {
  today: IsoDate;
  displayName: string | null;
  baseCurrency: CurrencyCode;
  portfolios: { id: string; name: string }[];
  portfolioId: string | null;
  lastUpdatedOn: IsoDate | null;
  hasInvestments: boolean;
  totals: {
    currentValue: DecimalString;
    netInvested: DecimalString;
    result: DecimalString;
    simpleReturn: DecimalString | null;
    income: DecimalString;
    costs: DecimalString;
    coverage: { valued: number; open: number };
    /** Posições encerradas que entram no resultado (realizado). */
    closedPositions: number;
  };
  unconverted: { currency: CurrencyCode; count: number }[];
  attention: AttentionItem[];
  allocation: {
    byType: SliceView[];
    byInstitution: SliceView[];
    unvaluedCount: number;
  };
  upcoming: UpcomingItem[];
  activity: ActivityItem[];
}

export type { Freshness };
