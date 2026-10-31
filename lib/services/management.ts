import 'server-only';
import { ZERO, toDecimalString as str } from '@/lib/calculations/decimal';
import type { UserRepository } from '@/lib/data/repository';
import type { DecimalString, InstitutionKind } from '@/lib/domain/types';
import { loadPortfolioSnapshot, type PositionSnapshot } from './snapshot';

/** Carteiras e instituições, com contagens e valor atual conhecido (posições abertas). */

export interface GroupSummary {
  id: string;
  name: string;
  openCount: number;
  closedCount: number;
  currentValue: DecimalString;
  unvalued: number;
}

export interface PortfolioRow extends GroupSummary {
  isDefault: boolean;
}

export interface InstitutionRow extends GroupSummary {
  kind: InstitutionKind;
  notes: string | null;
}

function summarize(positions: PositionSnapshot[]) {
  let value = ZERO;
  let openCount = 0;
  let closedCount = 0;
  let unvalued = 0;
  for (const p of positions) {
    const open = p.investment.status === 'active' || p.investment.status === 'matured';
    if (open) {
      openCount += 1;
      if (p.metrics.currentValue) value = value.plus(p.metrics.currentValue);
      else unvalued += 1;
    } else if (p.investment.status === 'closed') {
      closedCount += 1;
    }
  }
  return { openCount, closedCount, unvalued, currentValue: str(value, 2) };
}

export async function getPortfoliosView(repo: UserRepository): Promise<PortfolioRow[]> {
  const snapshot = await loadPortfolioSnapshot(repo);
  return snapshot.portfolios.map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    isDefault: portfolio.isDefault,
    ...summarize(snapshot.positions.filter((p) => p.investment.portfolioId === portfolio.id)),
  }));
}

export async function getInstitutionsView(repo: UserRepository): Promise<InstitutionRow[]> {
  const snapshot = await loadPortfolioSnapshot(repo);
  return snapshot.institutions
    .filter((i) => !i.archivedAt)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt'))
    .map((institution) => ({
      id: institution.id,
      name: institution.name,
      kind: institution.kind,
      notes: institution.notes,
      ...summarize(snapshot.positions.filter((p) => p.investment.institutionId === institution.id)),
    }));
}
