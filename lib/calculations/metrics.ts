import type { InvestmentStatus, IsoDate, Transaction, Valuation } from '@/lib/domain/types';
import { type Dec, ZERO, dec, maxDec, minDec } from './decimal';

/**
 * Métricas por investimento (PLANO_MVP §7).
 *
 * Convenções:
 * - Entradas de capital: investimento inicial + compras/reforços + rendimentos reinvestidos
 *   + ajustes que aumentam capital.
 * - Capital devolvido: componente de capital de vendas, resgates e levantamentos. Se não for
 *   indicada, usa-se o custo médio (ativos com quantidade) ou o capital ainda investido
 *   (restantes); o excedente é ganho realizado.
 * - Rendimentos: juros + dividendos/rendimentos (incluindo os reinvestidos).
 * - Custos: comissões e impostos, autónomos ou associados a qualquer movimento.
 * - Resultado indicativo: valor atual + valores recebidos em saídas + rendimentos
 *   − entradas de capital − custos. Os rendimentos reinvestidos contam como rendimento
 *   e como entrada, pelo que se anulam.
 * - Retorno simples: resultado ÷ entradas de capital.
 */
export interface InvestmentMetrics {
  capitalInflows: Dec;
  capitalReturned: Dec;
  netInvested: Dec;
  exitProceeds: Dec;
  realizedGain: Dec;
  income: Dec;
  reinvestedIncome: Dec;
  costs: Dec;
  /** `null` quando não há avaliação (e o investimento não está encerrado). */
  currentValue: Dec | null;
  valuedOn: IsoDate | null;
  result: Dec | null;
  /** Fração (0,137 = 13,7 %). `null` sem resultado ou sem entradas. */
  simpleReturn: Dec | null;
  /** Quantidade em carteira, se o investimento usar quantidades. */
  quantity: Dec | null;
  /** Custo médio ponderado por unidade (compras; vendas não o alteram). */
  averageCost: Dec | null;
  /** Data do primeiro e último movimento. */
  firstMovementOn: IsoDate | null;
  lastMovementOn: IsoDate | null;
}

export interface MetricsInput {
  status: InvestmentStatus;
  transactions: readonly Transaction[];
  latestValuation: Valuation | null;
  /** Data de encerramento (para posições encerradas). */
  closedOn?: IsoDate | null;
  /** Incluir comissões de compra no custo médio. */
  includeFeesInCost?: boolean;
}

/** Ordena movimentos por data e, no mesmo dia, pela ordem de registo. */
export function sortTransactions<T extends Pick<Transaction, 'occurredOn' | 'createdAt'>>(
  transactions: readonly T[],
): T[] {
  return [...transactions].sort((a, b) =>
    a.occurredOn === b.occurredOn
      ? a.createdAt.localeCompare(b.createdAt)
      : a.occurredOn.localeCompare(b.occurredOn),
  );
}

/** Avaliação mais recente (por data; no mesmo dia, a última registada). */
export function latestValuation(valuations: readonly Valuation[]): Valuation | null {
  let latest: Valuation | null = null;
  for (const valuation of valuations) {
    if (
      latest === null ||
      valuation.valuedOn > latest.valuedOn ||
      (valuation.valuedOn === latest.valuedOn && valuation.createdAt > latest.createdAt)
    ) {
      latest = valuation;
    }
  }
  return latest;
}

export function computeInvestmentMetrics(input: MetricsInput): InvestmentMetrics {
  const ordered = sortTransactions(input.transactions);

  let inflows = ZERO;
  let returned = ZERO;
  let exitProceeds = ZERO;
  let income = ZERO;
  let reinvested = ZERO;
  let costs = ZERO;

  // Posição em unidades (só para movimentos com quantidade).
  let usesQuantity = false;
  let quantity = ZERO;
  let costBasis = ZERO;

  const averageCost = (): Dec => (quantity.greaterThan(0) ? costBasis.dividedBy(quantity) : ZERO);

  const addUnits = (units: Dec | null, cost: Dec) => {
    if (units === null) return;
    usesQuantity = true;
    quantity = quantity.plus(units);
    costBasis = costBasis.plus(cost);
  };

  const removeUnits = (units: Dec | null): Dec | null => {
    if (units === null || !usesQuantity) return null;
    const avg = averageCost();
    const removed = minDec(units, quantity);
    const basis = removed.times(avg);
    quantity = maxDec(quantity.minus(units), ZERO);
    costBasis = quantity.isZero() ? ZERO : maxDec(costBasis.minus(basis), ZERO);
    return basis;
  };

  for (const tx of ordered) {
    const amount = dec(tx.amount);
    const units = tx.quantity === null ? null : dec(tx.quantity);
    const fee = dec(tx.feeAmount);
    const tax = dec(tx.taxAmount);
    costs = costs.plus(fee).plus(tax);

    switch (tx.type) {
      case 'initial':
      case 'contribution': {
        inflows = inflows.plus(amount);
        addUnits(units, input.includeFeesInCost ? amount.plus(fee) : amount);
        break;
      }
      case 'redemption':
      case 'withdrawal': {
        exitProceeds = exitProceeds.plus(amount);
        const basis = removeUnits(units);
        const stillInvested = maxDec(inflows.minus(returned), ZERO);
        const capital =
          tx.capitalComponent !== null
            ? dec(tx.capitalComponent)
            : basis !== null
              ? basis
              : minDec(amount, stillInvested);
        returned = returned.plus(capital);
        break;
      }
      case 'interest':
      case 'dividend': {
        income = income.plus(amount);
        if (tx.isReinvested) {
          reinvested = reinvested.plus(amount);
          inflows = inflows.plus(amount);
          addUnits(units, amount);
        }
        break;
      }
      case 'fee':
      case 'tax': {
        costs = costs.plus(amount);
        break;
      }
      case 'adjustment': {
        if (tx.adjustmentDirection === 'decrease') {
          inflows = inflows.minus(amount);
          if (units !== null && usesQuantity) {
            quantity = maxDec(quantity.minus(units), ZERO);
            costBasis = maxDec(costBasis.minus(amount), ZERO);
          }
        } else {
          inflows = inflows.plus(amount);
          addUnits(units, amount);
        }
        break;
      }
    }
  }

  const netInvested = inflows.minus(returned);
  const realizedGain = exitProceeds.minus(returned);

  let currentValue: Dec | null = null;
  let valuedOn: IsoDate | null = null;
  if (input.status === 'closed') {
    currentValue = ZERO;
    valuedOn = input.closedOn ?? ordered.at(-1)?.occurredOn ?? null;
  } else if (input.latestValuation) {
    currentValue = dec(input.latestValuation.totalValue);
    valuedOn = input.latestValuation.valuedOn;
  }

  const result =
    currentValue === null
      ? null
      : currentValue.plus(exitProceeds).plus(income).minus(inflows).minus(costs);

  const simpleReturn = result !== null && inflows.greaterThan(0) ? result.dividedBy(inflows) : null;

  return {
    capitalInflows: inflows,
    capitalReturned: returned,
    netInvested,
    exitProceeds,
    realizedGain,
    income,
    reinvestedIncome: reinvested,
    costs,
    currentValue,
    valuedOn,
    result,
    simpleReturn,
    quantity: usesQuantity ? quantity : null,
    averageCost: usesQuantity && quantity.greaterThan(0) ? averageCost() : null,
    firstMovementOn: ordered[0]?.occurredOn ?? null,
    lastMovementOn: ordered.at(-1)?.occurredOn ?? null,
  };
}

/** Valor de uma avaliação a partir de quantidade × preço unitário. */
export function valueFromUnits(quantity: Dec, unitPrice: Dec): Dec {
  return quantity.times(unitPrice);
}
