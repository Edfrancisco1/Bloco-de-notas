'use server';

import { revalidatePath } from 'next/cache';
import { totalFromUnits } from '@/lib/calculations/preview';
import { getOnboardedRepository } from '@/lib/data';
import { type ValuationInput, valuationSchema } from '@/lib/validations/schemas';
import { type ActionResult, failure, invalid, ok } from './result';

/** Regista uma nova avaliação sem apagar as anteriores (PLANO_MVP §8, jornada D). */
export async function createValuationAction(input: ValuationInput): Promise<ActionResult> {
  const parsed = valuationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  // Com quantidade e preço, o servidor recalcula o total — não confia no valor do cliente.
  const totalValue =
    data.quantity && data.unitPrice
      ? totalFromUnits(data.quantity, data.unitPrice)
      : data.totalValue;

  // Fora do try: um redirect (sessão expirada) tem de propagar, não virar erro genérico.
  const repo = await getOnboardedRepository();
  try {
    await repo.createValuation({
      investmentId: data.investmentId,
      valuedOn: data.valuedOn,
      totalValue,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      notes: data.notes,
    });
  } catch (error) {
    return failure(error);
  }

  revalidatePath('/app', 'layout');
  return ok();
}

export async function deleteValuationAction(id: string): Promise<ActionResult> {
  const repo = await getOnboardedRepository();
  try {
    await repo.deleteValuation(id);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}
