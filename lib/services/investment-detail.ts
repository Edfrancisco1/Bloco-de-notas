import 'server-only';
import { todayIn } from '@/lib/calculations/dates';
import { toDecimalString as str } from '@/lib/calculations/decimal';
import { type TermDepositSummary, summarizeTermDeposit } from '@/lib/calculations/term-deposit';
import type { Deadline, Freshness } from '@/lib/calculations/status';
import type { UserRepository } from '@/lib/data/repository';
import { investmentTypeLabel, transactionTypeLabel } from '@/lib/domain/labels';
import type {
  DecimalString,
  Investment,
  IsoDate,
  Reminder,
  Transaction,
  TransactionType,
  Valuation,
} from '@/lib/domain/types';
import { toValuationTarget } from './dashboard';
import { loadPortfolioSnapshot } from './snapshot';
import type { ValuationTarget } from './views';

/** Ficha de um investimento (PLANO_MVP §9: resumo, movimentos, avaliações, notas e lembretes). */

export interface TimelineEntry {
  id: string;
  kind: 'transaction' | 'valuation';
  date: IsoDate;
  createdAt: string;
  label: string;
  transactionType: TransactionType | null;
  amount: DecimalString;
  /** Efeito: entrada de dinheiro, saída, custo, rendimento ou só um novo valor. */
  flow: 'in' | 'out' | 'income' | 'cost' | 'value' | 'adjust';
  quantity: DecimalString | null;
  unitPrice: DecimalString | null;
  feeAmount: DecimalString;
  taxAmount: DecimalString;
  capitalComponent: DecimalString | null;
  isReinvested: boolean;
  notes: string | null;
}

export type TermDepositEstimateView = TermDepositSummary;

export interface InvestmentDetailView {
  today: IsoDate;
  investment: Investment;
  typeLabel: string;
  institution: { id: string; name: string } | null;
  portfolio: { id: string; name: string } | null;
  isOpen: boolean;
  metrics: {
    capitalInflows: DecimalString;
    capitalReturned: DecimalString;
    netInvested: DecimalString;
    exitProceeds: DecimalString;
    realizedGain: DecimalString;
    income: DecimalString;
    reinvestedIncome: DecimalString;
    costs: DecimalString;
    currentValue: DecimalString | null;
    valuedOn: IsoDate | null;
    result: DecimalString | null;
    simpleReturn: DecimalString | null;
    quantity: DecimalString | null;
    averageCost: DecimalString | null;
  };
  freshness: Freshness;
  deadline: Deadline | null;
  estimate: TermDepositEstimateView | null;
  valuationSeries: { date: IsoDate; value: DecimalString }[];
  timeline: TimelineEntry[];
  reminders: Reminder[];
  /** Para as pré-visualizações (movimentos) no cliente. */
  transactions: Transaction[];
  latestValuation: Valuation | null;
  valuationTarget: ValuationTarget;
  counts: { transactions: number; valuations: number; reminders: number };
}

const FLOW: Record<TransactionType, TimelineEntry['flow']> = {
  initial: 'out',
  contribution: 'out',
  redemption: 'in',
  withdrawal: 'in',
  interest: 'income',
  dividend: 'income',
  fee: 'cost',
  tax: 'cost',
  adjustment: 'adjust',
};

export async function getInvestmentDetailView(
  repo: UserRepository,
  id: string,
): Promise<InvestmentDetailView | null> {
  const investment = await repo.getInvestment(id);
  if (!investment) return null;

  const snapshot = await loadPortfolioSnapshot(repo, { includeArchived: true });
  const position = snapshot.positions.find((p) => p.investment.id === id);
  if (!position) return null;
  const { metrics } = position;
  const reminders = await repo.listReminders({ investmentId: id });

  let estimate: TermDepositEstimateView | null = null;
  if (investment.details.kind === 'term_deposit' && investment.maturityDate) {
    const d = investment.details;
    estimate = summarizeTermDeposit({
      principal: d.principal,
      annualRate: d.annualRate,
      startDate: investment.startDate,
      maturityDate: investment.maturityDate,
      interestMethod: d.interestMethod,
      compoundingFrequency: d.compoundingFrequency,
      dayCountBasis: d.dayCountBasis,
      customDayCount: d.customDayCount,
      estimatedTaxRate: d.estimatedTaxRate,
    });
  }

  const timeline: TimelineEntry[] = [
    ...position.transactions.map((t): TimelineEntry => ({
      id: t.id,
      kind: 'transaction',
      date: t.occurredOn,
      createdAt: t.createdAt,
      label: transactionTypeLabel[t.type],
      transactionType: t.type,
      amount: t.amount,
      flow: FLOW[t.type],
      quantity: t.quantity,
      unitPrice: t.unitPrice,
      feeAmount: t.feeAmount,
      taxAmount: t.taxAmount,
      capitalComponent: t.capitalComponent,
      isReinvested: t.isReinvested,
      notes: t.notes,
    })),
    ...position.valuations.map((v): TimelineEntry => ({
      id: v.id,
      kind: 'valuation',
      date: v.valuedOn,
      createdAt: v.createdAt,
      label: 'Avaliação',
      transactionType: null,
      amount: v.totalValue,
      flow: 'value',
      quantity: v.quantity,
      unitPrice: v.unitPrice,
      feeAmount: '0' as DecimalString,
      taxAmount: '0' as DecimalString,
      capitalComponent: null,
      isReinvested: false,
      notes: v.notes,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const portfolio = snapshot.portfolios.find((p) => p.id === investment.portfolioId);
  return {
    today: snapshot.today,
    investment,
    typeLabel: investmentTypeLabel[investment.type],
    institution: position.institution
      ? { id: position.institution.id, name: position.institution.name }
      : null,
    portfolio: portfolio ? { id: portfolio.id, name: portfolio.name } : null,
    isOpen: investment.status === 'active' || investment.status === 'matured',
    metrics: {
      capitalInflows: str(metrics.capitalInflows, 2),
      capitalReturned: str(metrics.capitalReturned, 2),
      netInvested: str(metrics.netInvested, 2),
      exitProceeds: str(metrics.exitProceeds, 2),
      realizedGain: str(metrics.realizedGain, 2),
      income: str(metrics.income, 2),
      reinvestedIncome: str(metrics.reinvestedIncome, 2),
      costs: str(metrics.costs, 2),
      currentValue: metrics.currentValue ? str(metrics.currentValue, 2) : null,
      valuedOn: metrics.valuedOn,
      result: metrics.result ? str(metrics.result, 2) : null,
      simpleReturn: metrics.simpleReturn ? str(metrics.simpleReturn, 6) : null,
      quantity: metrics.quantity ? str(metrics.quantity, 12) : null,
      averageCost: metrics.averageCost ? str(metrics.averageCost, 2) : null,
    },
    freshness: position.freshness,
    deadline: position.deadline,
    estimate,
    valuationSeries: [...position.valuations]
      .sort(
        (a, b) => a.valuedOn.localeCompare(b.valuedOn) || a.createdAt.localeCompare(b.createdAt),
      )
      .map((v) => ({ date: v.valuedOn, value: v.totalValue })),
    timeline,
    reminders: [...reminders].sort((a, b) => a.dueOn.localeCompare(b.dueOn)),
    transactions: position.transactions,
    latestValuation: position.latestValuation,
    valuationTarget: toValuationTarget(position),
    counts: {
      transactions: position.transactions.length,
      valuations: position.valuations.length,
      reminders: reminders.length,
    },
  };
}

/** Opções dos formulários de investimento. */
export async function getInvestmentFormOptions(repo: UserRepository) {
  const [profile, portfolios, institutions] = await Promise.all([
    repo.getProfile(),
    repo.listPortfolios(),
    repo.listInstitutions(),
  ]);
  return {
    today: todayIn(profile.timezone),
    portfolios: portfolios.map((p) => ({ id: p.id, name: p.name, isDefault: p.isDefault })),
    institutions: institutions.map((i) => ({ id: i.id, name: i.name, kind: i.kind })),
    defaultPortfolioId: portfolios.find((p) => p.isDefault)?.id ?? portfolios[0]?.id ?? '',
  };
}

export type InvestmentFormOptions = Awaited<ReturnType<typeof getInvestmentFormOptions>>;
