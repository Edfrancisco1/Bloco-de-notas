import 'server-only';
import { aggregatePositions, allocateBy, type Position } from '@/lib/calculations/aggregate';
import { todayIn } from '@/lib/calculations/dates';
import { computeInvestmentMetrics, latestValuation } from '@/lib/calculations/metrics';
import { deadlineFor, valuationFreshness } from '@/lib/calculations/status';
import type { UserRepository } from '@/lib/data/repository';
import type {
  Institution,
  Portfolio,
  Profile,
  Reminder,
  Transaction,
  Valuation,
} from '@/lib/domain/types';

/**
 * Lê tudo o que um ecrã de acompanhamento precisa em consultas paralelas (sem N+1) e calcula
 * as métricas de cada posição. Os view models dos ecrãs partem daqui.
 */
export interface PositionSnapshot extends Position {
  institution: Institution | null;
  transactions: Transaction[];
  valuations: Valuation[];
  latestValuation: Valuation | null;
  freshness: ReturnType<typeof valuationFreshness>;
  deadline: ReturnType<typeof deadlineFor> | null;
}

export interface PortfolioSnapshot {
  today: string;
  profile: Profile;
  portfolios: Portfolio[];
  institutions: Institution[];
  /** Carteira filtrada (null = todas). */
  portfolioId: string | null;
  positions: PositionSnapshot[];
  reminders: Reminder[];
  totals: ReturnType<typeof aggregatePositions>;
}

export async function loadPortfolioSnapshot(
  repo: UserRepository,
  options: { portfolioId?: string | null; includeArchived?: boolean } = {},
): Promise<PortfolioSnapshot> {
  const [profile, portfolios, institutions, allInvestments, transactions, valuations, reminders] =
    await Promise.all([
      repo.getProfile(),
      repo.listPortfolios(),
      repo.listInstitutions({ includeArchived: true }),
      repo.listInvestments({ includeArchived: options.includeArchived ?? false }),
      repo.listTransactions(),
      repo.listValuations(),
      repo.listReminders(),
    ]);

  const today = todayIn(profile.timezone);
  const portfolioId =
    options.portfolioId && portfolios.some((p) => p.id === options.portfolioId)
      ? options.portfolioId
      : null;
  const investments = portfolioId
    ? allInvestments.filter((i) => i.portfolioId === portfolioId)
    : allInvestments;

  const txByInvestment = groupBy(transactions, (t) => t.investmentId);
  const valByInvestment = groupBy(valuations, (v) => v.investmentId);
  const institutionById = new Map(institutions.map((i) => [i.id, i]));

  const positions = investments.map((investment): PositionSnapshot => {
    const txs = txByInvestment.get(investment.id) ?? [];
    const vals = valByInvestment.get(investment.id) ?? [];
    const latest = latestValuation(vals);
    const metrics = computeInvestmentMetrics({
      status: investment.status,
      transactions: txs,
      latestValuation: latest,
      closedOn: investment.closedAt?.slice(0, 10) ?? null,
    });
    const isOpen = investment.status === 'active' || investment.status === 'matured';
    return {
      investment,
      metrics,
      institution: investment.institutionId
        ? (institutionById.get(investment.institutionId) ?? null)
        : null,
      transactions: txs,
      valuations: vals,
      latestValuation: latest,
      freshness: valuationFreshness(isOpen ? (latest?.valuedOn ?? null) : metrics.valuedOn, today),
      deadline:
        investment.maturityDate && isOpen ? deadlineFor(investment.maturityDate, today) : null,
    };
  });

  const investmentIds = new Set(investments.map((i) => i.id));
  const scopedReminders = portfolioId
    ? reminders.filter((r) => r.investmentId !== null && investmentIds.has(r.investmentId))
    : reminders;

  return {
    today,
    profile,
    portfolios,
    institutions,
    portfolioId,
    positions,
    reminders: scopedReminders,
    totals: aggregatePositions(positions, profile.baseCurrency),
  };
}

export function allocationByType(snapshot: PortfolioSnapshot) {
  return allocateBy(snapshot.positions, snapshot.profile.baseCurrency, (p) => p.investment.type);
}

export function allocationByInstitution(snapshot: PortfolioSnapshot) {
  return allocateBy(
    snapshot.positions,
    snapshot.profile.baseCurrency,
    (p) => p.investment.institutionId ?? 'sem-instituicao',
  );
}

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = groups.get(k);
    if (list) list.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}
