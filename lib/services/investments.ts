import 'server-only';
import { type Dec, ZERO, toDecimalString as str } from '@/lib/calculations/decimal';
import type { Deadline, Freshness } from '@/lib/calculations/status';
import type { UserRepository } from '@/lib/data/repository';
import { investmentTypeGroupLabel, investmentTypeOrder } from '@/lib/domain/labels';
import {
  INVESTMENT_TYPES,
  type DecimalString,
  type InvestmentStatus,
  type InvestmentType,
  type IsoDate,
} from '@/lib/domain/types';
import { toValuationTarget } from './dashboard';
import { loadPortfolioSnapshot, type PositionSnapshot } from './snapshot';
import type { ValuationTarget } from './views';

/** Filtros da lista (PLANO_MVP §4: pesquisa, filtros e ordenação), guardados no URL. */
export const STATUS_FILTERS = ['abertos', 'encerrados', 'arquivados', 'todos'] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number];

export const SORTS = ['valor', 'nome', 'resultado', 'vencimento', 'atualizacao'] as const;
export type SortKey = (typeof SORTS)[number];

export interface InvestmentFilters {
  q: string;
  type: InvestmentType | null;
  status: StatusFilter;
  institutionId: string | null;
  portfolioId: string | null;
  sort: SortKey;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value)?.trim() ?? '';

export function parseInvestmentFilters(params: SearchParams): InvestmentFilters {
  const type = first(params.tipo);
  const status = first(params.estado);
  const sort = first(params.ordem);
  return {
    q: first(params.q).slice(0, 80),
    type: (INVESTMENT_TYPES as readonly string[]).includes(type) ? (type as InvestmentType) : null,
    status: (STATUS_FILTERS as readonly string[]).includes(status)
      ? (status as StatusFilter)
      : 'abertos',
    institutionId: first(params.instituicao) || null,
    portfolioId: first(params.carteira) || null,
    sort: (SORTS as readonly string[]).includes(sort) ? (sort as SortKey) : 'valor',
  };
}

export interface InvestmentRow {
  id: string;
  name: string;
  type: InvestmentType;
  status: InvestmentStatus;
  isOpen: boolean;
  symbol: string | null;
  institutionName: string | null;
  portfolioName: string | null;
  currentValue: DecimalString | null;
  valuedOn: IsoDate | null;
  freshness: Freshness;
  netInvested: DecimalString;
  result: DecimalString | null;
  simpleReturn: DecimalString | null;
  maturityDate: IsoDate | null;
  deadline: Deadline | null;
  target: ValuationTarget;
}

export interface InvestmentGroup {
  type: InvestmentType;
  label: string;
  rows: InvestmentRow[];
  subtotalValue: DecimalString;
  subtotalNetInvested: DecimalString;
  unvalued: number;
}

export interface InvestmentListView {
  today: IsoDate;
  filters: InvestmentFilters;
  groups: InvestmentGroup[];
  /** Investimentos que a conta tem (antes de filtrar), para distinguir "vazio" de "sem resultados". */
  totalCount: number;
  shownCount: number;
  totals: { currentValue: DecimalString; netInvested: DecimalString };
  options: {
    portfolios: { id: string; name: string }[];
    institutions: { id: string; name: string }[];
  };
}

/** Minúsculas e sem acentos: "Depósito" encontra-se com "deposito". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('pt');
}

function matchesStatus(status: InvestmentStatus, filter: StatusFilter): boolean {
  if (filter === 'todos') return true;
  if (filter === 'abertos') return status === 'active' || status === 'matured';
  if (filter === 'encerrados') return status === 'closed';
  return status === 'archived';
}

const byNullableDesc = (a: Dec | null, b: Dec | null) =>
  a === null ? (b === null ? 0 : 1) : b === null ? -1 : b.comparedTo(a);

function compare(sort: SortKey) {
  return (a: PositionSnapshot, b: PositionSnapshot): number => {
    const byName = a.investment.name.localeCompare(b.investment.name, 'pt');
    switch (sort) {
      case 'nome':
        return byName;
      case 'resultado':
        return byNullableDesc(a.metrics.result, b.metrics.result) || byName;
      case 'vencimento': {
        const am = a.investment.maturityDate;
        const bm = b.investment.maturityDate;
        if (am === bm) return byName;
        if (!am) return 1;
        if (!bm) return -1;
        return am.localeCompare(bm);
      }
      case 'atualizacao': {
        // As mais antigas (e as que nunca foram avaliadas) primeiro: são as que precisam de atenção.
        const av = a.latestValuation?.valuedOn ?? '';
        const bv = b.latestValuation?.valuedOn ?? '';
        return av.localeCompare(bv) || byName;
      }
      default:
        return byNullableDesc(a.metrics.currentValue, b.metrics.currentValue) || byName;
    }
  };
}

export async function getInvestmentListView(
  repo: UserRepository,
  filters: InvestmentFilters,
): Promise<InvestmentListView> {
  const snapshot = await loadPortfolioSnapshot(repo, {
    portfolioId: filters.portfolioId,
    includeArchived: true,
  });
  const portfolioName = new Map(snapshot.portfolios.map((p) => [p.id, p.name]));
  // Cada palavra tem de aparecer (em qualquer ordem): "deposito 12" encontra "Depósito a prazo 12 meses".
  const terms = normalize(filters.q).split(/\s+/).filter(Boolean);

  const visible = snapshot.positions.filter((position) => {
    const { investment, institution } = position;
    if (!matchesStatus(investment.status, filters.status)) return false;
    if (filters.type && investment.type !== filters.type) return false;
    if (filters.institutionId && investment.institutionId !== filters.institutionId) return false;
    if (terms.length) {
      const haystack = normalize(
        [investment.name, investment.symbol, institution?.name, ...investment.tags]
          .filter(Boolean)
          .join(' '),
      );
      if (!terms.every((term) => haystack.includes(term))) return false;
    }
    return true;
  });

  const toRow = (position: PositionSnapshot): InvestmentRow => {
    const { investment, metrics } = position;
    return {
      id: investment.id,
      name: investment.name,
      type: investment.type,
      status: investment.status,
      isOpen: investment.status === 'active' || investment.status === 'matured',
      symbol: investment.symbol,
      institutionName: position.institution?.name ?? null,
      portfolioName: portfolioName.get(investment.portfolioId) ?? null,
      currentValue: metrics.currentValue ? str(metrics.currentValue, 2) : null,
      valuedOn: metrics.valuedOn,
      freshness: position.freshness,
      netInvested: str(metrics.netInvested, 2),
      result: metrics.result ? str(metrics.result, 2) : null,
      simpleReturn: metrics.simpleReturn ? str(metrics.simpleReturn, 6) : null,
      maturityDate: investment.maturityDate,
      deadline: position.deadline,
      target: toValuationTarget(position),
    };
  };

  let totalValue = ZERO;
  let totalNet = ZERO;
  const groups: InvestmentGroup[] = [];
  for (const type of investmentTypeOrder) {
    const positions = visible.filter((p) => p.investment.type === type).sort(compare(filters.sort));
    if (positions.length === 0) continue;
    let subtotalValue = ZERO;
    let subtotalNet = ZERO;
    for (const p of positions) {
      subtotalValue = subtotalValue.plus(p.metrics.currentValue ?? ZERO);
      subtotalNet = subtotalNet.plus(p.metrics.netInvested);
    }
    totalValue = totalValue.plus(subtotalValue);
    totalNet = totalNet.plus(subtotalNet);
    groups.push({
      type,
      label: investmentTypeGroupLabel[type],
      rows: positions.map(toRow),
      subtotalValue: str(subtotalValue, 2),
      subtotalNetInvested: str(subtotalNet, 2),
      unvalued: positions.filter(
        (p) => p.metrics.currentValue === null && p.investment.status !== 'closed',
      ).length,
    });
  }

  return {
    today: snapshot.today,
    filters,
    groups,
    totalCount: (await repo.listInvestments({ includeArchived: true })).length,
    shownCount: visible.length,
    totals: { currentValue: str(totalValue, 2), netInvested: str(totalNet, 2) },
    options: {
      portfolios: snapshot.portfolios.map((p) => ({ id: p.id, name: p.name })),
      institutions: snapshot.institutions
        .filter((i) => !i.archivedAt)
        .map((i) => ({ id: i.id, name: i.name })),
    },
  };
}
