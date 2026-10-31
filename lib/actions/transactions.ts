'use server';

import { revalidatePath } from 'next/cache';
import { totalFromUnits } from '@/lib/calculations/preview';
import { getOnboardedRepository } from '@/lib/data';
import type { TransactionData } from '@/lib/data/repository';
import { type TransactionInput, transactionSchema } from '@/lib/validations/schemas';
import { type ActionResult, failure, invalid, ok } from './result';

function toData(input: TransactionInput) {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) return { valid: false, error: invalid(parsed.error) } as const;
  const d = parsed.data;
  const isCost = d.type === 'fee' || d.type === 'tax';
  const isExit = d.type === 'redemption' || d.type === 'withdrawal';
  const isIncome = d.type === 'interest' || d.type === 'dividend';
  const data: TransactionData = {
    investmentId: d.investmentId,
    type: d.type,
    occurredOn: d.occurredOn,
    amount:
      d.quantity && d.unitPrice && !isCost ? totalFromUnits(d.quantity, d.unitPrice) : d.amount,
    quantity: isCost ? null : d.quantity,
    unitPrice: isCost ? null : d.unitPrice,
    feeAmount: d.feeAmount,
    taxAmount: d.taxAmount,
    capitalComponent: isExit ? d.capitalComponent : null,
    isReinvested: isIncome ? d.isReinvested : false,
    adjustmentDirection: d.type === 'adjustment' ? d.adjustmentDirection : null,
    notes: d.notes,
  };
  return { valid: true, data } as const;
}

export async function createTransactionAction(input: TransactionInput): Promise<ActionResult> {
  const result = toData(input);
  if (!result.valid) return result.error;
  const repo = await getOnboardedRepository();
  try {
    await repo.createTransaction(result.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}

export async function updateTransactionAction(
  id: string,
  input: TransactionInput,
): Promise<ActionResult> {
  const result = toData(input);
  if (!result.valid) return result.error;
  const repo = await getOnboardedRepository();
  try {
    const updated = await repo.updateTransaction(id, result.data);
    // O capital de um depósito a prazo é o do movimento inicial: mantê-los iguais.
    const investment = await repo.getInvestment(updated.investmentId);
    if (
      investment &&
      updated.type === 'initial' &&
      investment.details.kind === 'term_deposit' &&
      investment.details.principal !== updated.amount
    ) {
      const {
        id: _id,
        status: _s,
        closedAt: _c,
        createdAt: _cr,
        updatedAt: _u,
        ...data
      } = investment;
      await repo.updateInvestment(investment.id, {
        ...data,
        details: { ...investment.details, principal: updated.amount },
      });
    }
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const repo = await getOnboardedRepository();
  try {
    await repo.deleteTransaction(id);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}
