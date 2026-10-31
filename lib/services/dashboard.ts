import 'server-only';
import { toDecimalString as str } from '@/lib/calculations/decimal';
import { deadlineFor } from '@/lib/calculations/status';
import { maxIsoDate } from '@/lib/calculations/dates';
import type { UserRepository } from '@/lib/data/repository';
import { investmentTypeGroupLabel, transactionTypeLabel } from '@/lib/domain/labels';
import type { TransactionType } from '@/lib/domain/types';
import {
  allocationByInstitution,
  allocationByType,
  loadPortfolioSnapshot,
  type PositionSnapshot,
} from './snapshot';
import type {
  ActivityItem,
  AttentionItem,
  DashboardView,
  SliceView,
  UpcomingItem,
  ValuationTarget,
} from './views';

const INFLOW_TYPES: TransactionType[] = ['interest', 'dividend', 'redemption', 'withdrawal'];

export function toValuationTarget(position: PositionSnapshot): ValuationTarget {
  const { investment, metrics, latestValuation } = position;
  const resultBase = metrics.exitProceeds
    .plus(metrics.income)
    .minus(metrics.capitalInflows)
    .minus(metrics.costs);
  return {
    investmentId: investment.id,
    name: investment.name,
    type: investment.type,
    currency: investment.currency,
    startDate: investment.startDate,
    quantity: metrics.quantity ? str(metrics.quantity) : null,
    lastValue: latestValuation?.totalValue ?? null,
    lastValuedOn: latestValuation?.valuedOn ?? null,
    lastUnitPrice: latestValuation?.unitPrice ?? null,
    resultBase: str(resultBase),
    capitalInflows: str(metrics.capitalInflows),
  };
}

export async function getDashboardView(
  repo: UserRepository,
  options: { portfolioId?: string | null } = {},
): Promise<DashboardView> {
  const snapshot = await loadPortfolioSnapshot(repo, options);
  const { positions, totals, today } = snapshot;
  const open = positions.filter(
    (p) => p.investment.status === 'active' || p.investment.status === 'matured',
  );

  // "Precisa de atenção": vencidos por resolver, sem avaliação e avaliações desatualizadas.
  const attention: AttentionItem[] = [];
  for (const position of open) {
    const base = {
      institutionName: position.institution?.name ?? null,
      target: toValuationTarget(position),
    };
    if (
      position.deadline &&
      position.deadline.daysLeft < 0 &&
      position.investment.status === 'active'
    ) {
      attention.push({
        ...base,
        reason: 'matured',
        ageDays: null,
        daysOverdue: -position.deadline.daysLeft,
      });
    } else if (position.freshness.state === 'missing') {
      attention.push({ ...base, reason: 'missing', ageDays: null, daysOverdue: null });
    } else if (position.freshness.state === 'stale') {
      attention.push({
        ...base,
        reason: 'stale',
        ageDays: position.freshness.ageDays,
        daysOverdue: null,
      });
    }
  }
  const reasonOrder = { matured: 0, missing: 1, stale: 2 } as const;
  attention.sort(
    (a, b) => reasonOrder[a.reason] - reasonOrder[b.reason] || (b.ageDays ?? 0) - (a.ageDays ?? 0),
  );

  // Próximos prazos: vencimentos nos próximos 90 dias e lembretes por concluir.
  const upcoming: UpcomingItem[] = [];
  for (const position of open) {
    const { investment, deadline } = position;
    if (!investment.maturityDate || !deadline) continue;
    if (deadline.daysLeft < 0 || deadline.daysLeft > 90) continue;
    upcoming.push({
      id: `vencimento-${investment.id}`,
      kind: 'maturity',
      date: investment.maturityDate,
      daysLeft: deadline.daysLeft,
      level: deadline.level,
      title: `Vencimento — ${investment.name}`,
      investmentId: investment.id,
      investmentName: investment.name,
      investmentType: investment.type,
    });
  }
  const investmentById = new Map(positions.map((p) => [p.investment.id, p.investment]));
  for (const reminder of snapshot.reminders) {
    if (reminder.status !== 'pending' && reminder.status !== 'snoozed') continue;
    const deadline = deadlineFor(reminder.dueOn, today);
    if (deadline.daysLeft > 90) continue;
    const investment = reminder.investmentId
      ? investmentById.get(reminder.investmentId)
      : undefined;
    upcoming.push({
      id: reminder.id,
      kind: 'reminder',
      date: reminder.dueOn,
      daysLeft: deadline.daysLeft,
      level: deadline.level,
      title: reminder.title,
      investmentId: investment?.id ?? null,
      investmentName: investment?.name ?? null,
      investmentType: investment?.type ?? null,
    });
  }
  upcoming.sort((a, b) => a.date.localeCompare(b.date));

  // Atividade recente: movimentos e avaliações, do mais recente para o mais antigo.
  const activity: (ActivityItem & { createdAt: string })[] = [];
  for (const position of positions) {
    const { investment } = position;
    for (const tx of position.transactions) {
      activity.push({
        id: tx.id,
        kind: 'transaction',
        date: tx.occurredOn,
        createdAt: tx.createdAt,
        investmentId: investment.id,
        investmentName: investment.name,
        investmentType: investment.type,
        label: transactionTypeLabel[tx.type],
        amount: tx.amount,
        flow: INFLOW_TYPES.includes(tx.type) ? 'in' : 'out',
      });
    }
    for (const valuation of position.valuations) {
      activity.push({
        id: valuation.id,
        kind: 'valuation',
        date: valuation.valuedOn,
        createdAt: valuation.createdAt,
        investmentId: investment.id,
        investmentName: investment.name,
        investmentType: investment.type,
        label: 'Avaliação',
        amount: valuation.totalValue,
        flow: 'value',
      });
    }
  }
  activity.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const institutionName = new Map(snapshot.institutions.map((i) => [i.id, i.name]));
  const slices = (
    items: ReturnType<typeof allocationByType> | ReturnType<typeof allocationByInstitution>,
    label: (key: string) => string,
  ): SliceView[] =>
    items.map((slice) => ({
      key: slice.key,
      label: label(slice.key),
      value: str(slice.value, 2),
      share: str(slice.share, 6),
      count: slice.count,
    }));

  return {
    today,
    displayName: snapshot.profile.displayName,
    baseCurrency: snapshot.profile.baseCurrency,
    portfolios: snapshot.portfolios.map((p) => ({ id: p.id, name: p.name })),
    portfolioId: snapshot.portfolioId,
    lastUpdatedOn: maxIsoDate(
      open.flatMap((p) => [p.latestValuation?.valuedOn, p.metrics.lastMovementOn]),
    ),
    hasInvestments: positions.length > 0,
    totals: {
      currentValue: str(totals.currentValue, 2),
      netInvested: str(totals.netInvested, 2),
      result: str(totals.result, 2),
      simpleReturn: totals.simpleReturn ? str(totals.simpleReturn, 6) : null,
      income: str(totals.income, 2),
      costs: str(totals.costs, 2),
      coverage: totals.coverage,
      closedPositions: positions.filter((p) => p.investment.status === 'closed').length,
    },
    unconverted: totals.unconverted.map((u) => ({ currency: u.currency, count: u.count })),
    attention,
    allocation: {
      byType: slices(allocationByType(snapshot), (key) =>
        key in investmentTypeGroupLabel
          ? investmentTypeGroupLabel[key as keyof typeof investmentTypeGroupLabel]
          : key,
      ),
      byInstitution: slices(allocationByInstitution(snapshot), (key) =>
        key === 'sem-instituicao' ? 'Sem instituição' : (institutionName.get(key) ?? 'Instituição'),
      ),
      unvaluedCount: open.filter((p) => p.metrics.currentValue === null).length,
    },
    upcoming: upcoming.slice(0, 6),
    activity: activity.slice(0, 7).map(({ createdAt: _c, ...item }) => item),
  };
}
