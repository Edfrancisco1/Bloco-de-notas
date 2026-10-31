import type { DecimalString, InvestmentStatus, Transaction, Valuation } from '@/lib/domain/types';
import { dec, toDecimalString } from './decimal';
import { type InvestmentMetrics, computeInvestmentMetrics } from './metrics';

/**
 * Pré-visualização do impacto de uma nova avaliação (PLANO_MVP §8, jornada D).
 * Usa o "resultado base" (saídas + rendimentos − entradas − custos), por isso só depende do
 * novo valor: resultado = novo valor + resultado base.
 */
export interface ValuationPreviewInput {
  resultBase: DecimalString;
  capitalInflows: DecimalString;
  lastValue: DecimalString | null;
}

export interface ValuationPreview {
  result: DecimalString;
  simpleReturn: DecimalString | null;
  previousResult: DecimalString | null;
  /** Diferença face à última avaliação. */
  change: DecimalString | null;
}

export function previewValuation(
  input: ValuationPreviewInput,
  newTotal: DecimalString,
): ValuationPreview {
  const total = dec(newTotal);
  const base = dec(input.resultBase);
  const inflows = dec(input.capitalInflows);
  const result = total.plus(base);
  return {
    result: toDecimalString(result, 2),
    simpleReturn: inflows.greaterThan(0) ? toDecimalString(result.dividedBy(inflows), 6) : null,
    previousResult: input.lastValue ? toDecimalString(dec(input.lastValue).plus(base), 2) : null,
    change: input.lastValue ? toDecimalString(total.minus(dec(input.lastValue)), 2) : null,
  };
}

/** Valor total a partir de quantidade × preço unitário, arredondado às casas da moeda. */
export function totalFromUnits(quantity: DecimalString, unitPrice: DecimalString): DecimalString {
  return toDecimalString(dec(quantity).times(dec(unitPrice)), 2);
}

/** Resumo serializável das métricas, para mostrar "antes → depois". */
export interface MetricsSummary {
  netInvested: DecimalString;
  income: DecimalString;
  costs: DecimalString;
  quantity: DecimalString | null;
  averageCost: DecimalString | null;
  result: DecimalString | null;
}

export function summarizeMetrics(metrics: InvestmentMetrics): MetricsSummary {
  return {
    netInvested: toDecimalString(metrics.netInvested, 2),
    income: toDecimalString(metrics.income, 2),
    costs: toDecimalString(metrics.costs, 2),
    quantity: metrics.quantity ? toDecimalString(metrics.quantity, 12) : null,
    averageCost: metrics.averageCost ? toDecimalString(metrics.averageCost, 2) : null,
    result: metrics.result ? toDecimalString(metrics.result, 2) : null,
  };
}

export type TransactionDraft = Omit<Transaction, 'id' | 'investmentId' | 'createdAt' | 'updatedAt'>;

/**
 * Impacto de um movimento (novo ou editado) nas métricas do investimento.
 * O rascunho conta como o último registo do seu dia; ao editar, substitui o original.
 */
export function previewTransaction(input: {
  status: InvestmentStatus;
  transactions: readonly Transaction[];
  latestValuation: Valuation | null;
  draft: TransactionDraft;
  replaceId?: string | null;
}): { before: MetricsSummary; after: MetricsSummary } {
  const base = { status: input.status, latestValuation: input.latestValuation };
  const before = computeInvestmentMetrics({ ...base, transactions: input.transactions });
  const others = input.transactions.filter((t) => t.id !== input.replaceId);
  const original = input.transactions.find((t) => t.id === input.replaceId);
  const draft: Transaction = {
    ...input.draft,
    id: input.replaceId ?? 'rascunho',
    investmentId: input.transactions[0]?.investmentId ?? 'rascunho',
    createdAt: original?.createdAt ?? '9999-12-31T23:59:59.999Z',
    updatedAt: original?.updatedAt ?? '9999-12-31T23:59:59.999Z',
  };
  const after = computeInvestmentMetrics({ ...base, transactions: [...others, draft] });
  return { before: summarizeMetrics(before), after: summarizeMetrics(after) };
}

/** Métricas finais ao encerrar, com ou sem a venda/resgate final ainda por registar. */
export function previewClosing(input: {
  transactions: readonly Transaction[];
  draft: TransactionDraft | null;
}): MetricsSummary {
  const transactions = input.draft
    ? [
        ...input.transactions,
        {
          ...input.draft,
          id: 'rascunho',
          investmentId: input.transactions[0]?.investmentId ?? 'rascunho',
          createdAt: '9999-12-31T23:59:59.999Z',
          updatedAt: '9999-12-31T23:59:59.999Z',
        },
      ]
    : input.transactions;
  return summarizeMetrics(
    computeInvestmentMetrics({ status: 'closed', transactions, latestValuation: null }),
  );
}
