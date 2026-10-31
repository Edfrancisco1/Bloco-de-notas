'use server';

import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { addDays, maxIsoDate, todayIn } from '@/lib/calculations/dates';
import { totalFromUnits } from '@/lib/calculations/preview';
import { getOnboardedRepository } from '@/lib/data';
import type { InvestmentData } from '@/lib/data/repository';
import type { DecimalString, InvestmentDetails } from '@/lib/domain/types';
import {
  type CloseInvestmentInput,
  type CreateInvestmentInput,
  type InvestmentDetailsData,
  type UpdateInvestmentInput,
  closeInvestmentSchema,
  createInvestmentSchema,
  updateInvestmentSchema,
} from '@/lib/validations/schemas';
import { type ActionResult, failure, invalid, ok } from './result';

/** O capital de um depósito é o montante inicial (não se pede duas vezes). */
function withPrincipal(
  details: InvestmentDetailsData,
  principal: DecimalString,
): InvestmentDetails {
  return details.kind === 'term_deposit' ? { ...details, principal } : details;
}

function revalidateApp() {
  revalidatePath('/app', 'layout');
}

/** Cria o investimento com o movimento inicial (e avaliação/lembrete opcionais) — jornadas A–C. */
export async function createInvestmentAction(input: CreateInvestmentInput): Promise<ActionResult> {
  const parsed = createInvestmentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;

  // Com quantidade e preço, o servidor recalcula o montante.
  const amount =
    data.initial.quantity && data.initial.unitPrice
      ? totalFromUnits(data.initial.quantity, data.initial.unitPrice)
      : data.initial.amount;

  const repo = await getOnboardedRepository();
  const profile = await repo.getProfile();
  const today = todayIn(profile.timezone);

  let reminder: { title: string; dueOn: string } | null = null;
  if (data.remindBeforeMaturity && data.maturityDate && data.maturityDate >= today) {
    reminder = {
      title: `Vencimento: ${data.name}`,
      dueOn: maxIsoDate([addDays(data.maturityDate, -7), today]) ?? today,
    };
  }

  let id: string;
  try {
    const investment = await repo.createInvestment({
      portfolioId: data.portfolioId,
      institutionId: data.newInstitution ? null : data.institutionId,
      newInstitution: data.newInstitution ? { ...data.newInstitution, notes: null } : null,
      name: data.name,
      type: data.type,
      symbol: data.symbol,
      isin: data.isin,
      currency: data.currency,
      startDate: data.startDate,
      maturityDate: data.maturityDate,
      details: withPrincipal(data.details, amount),
      tags: data.tags,
      customFields: data.customFields,
      notes: data.notes,
      initialTransaction: {
        occurredOn: data.startDate,
        amount,
        quantity: data.initial.quantity,
        unitPrice: data.initial.unitPrice,
        feeAmount: data.initial.feeAmount,
      },
      initialValuation: data.currentValue
        ? {
            valuedOn: data.currentValue.valuedOn,
            totalValue: data.currentValue.totalValue,
            quantity: null,
            unitPrice: null,
          }
        : null,
      reminder,
    });
    id = investment.id;
  } catch (error) {
    return failure(error);
  }

  revalidateApp();
  redirect(`/app/investimentos/${id}?novo=1` as Route);
}

export async function updateInvestmentAction(
  id: string,
  input: UpdateInvestmentInput,
): Promise<ActionResult> {
  const parsed = updateInvestmentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const data = parsed.data;
  const repo = await getOnboardedRepository();
  try {
    const current = await repo.getInvestment(id);
    if (!current) return { ok: false, error: 'Investimento não encontrado.' };
    const principal =
      current.details.kind === 'term_deposit' ? current.details.principal : ('0' as DecimalString);
    const update: InvestmentData = {
      portfolioId: data.portfolioId,
      institutionId: data.institutionId,
      name: data.name,
      type: data.type,
      symbol: data.symbol,
      isin: data.isin,
      currency: data.currency,
      startDate: data.startDate,
      maturityDate: data.maturityDate,
      details: withPrincipal(data.details, principal),
      tags: data.tags,
      customFields: data.customFields,
      notes: data.notes,
    };
    await repo.updateInvestment(id, update);
  } catch (error) {
    return failure(error);
  }
  revalidateApp();
  redirect(`/app/investimentos/${id}` as Route);
}

/** Jornada E: venda/resgate final + estado encerrado, numa só operação. */
export async function closeInvestmentAction(input: CloseInvestmentInput): Promise<ActionResult> {
  const parsed = closeInvestmentSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { investmentId, closedOn, final } = parsed.data;
  const repo = await getOnboardedRepository();
  try {
    await repo.closeInvestment(investmentId, {
      closedOn,
      finalTransaction: final
        ? {
            type: 'redemption',
            amount:
              final.quantity && final.unitPrice
                ? totalFromUnits(final.quantity, final.unitPrice)
                : final.amount,
            quantity: final.quantity,
            unitPrice: final.unitPrice,
            feeAmount: final.feeAmount,
            taxAmount: final.taxAmount,
            capitalComponent: final.capitalComponent,
            isReinvested: false,
            adjustmentDirection: null,
            notes: final.notes,
          }
        : null,
    });
  } catch (error) {
    return failure(error);
  }
  revalidateApp();
  return ok();
}

/** Reabrir, arquivar e desarquivar. */
export async function changeInvestmentStatusAction(
  id: string,
  change: 'reopen' | 'archive' | 'unarchive',
): Promise<ActionResult> {
  const repo = await getOnboardedRepository();
  try {
    const current = await repo.getInvestment(id);
    if (!current) return { ok: false, error: 'Investimento não encontrado.' };
    const status =
      change === 'archive'
        ? 'archived'
        : change === 'unarchive' && current.closedAt
          ? 'closed'
          : 'active';
    await repo.setInvestmentStatus(id, status);
  } catch (error) {
    return failure(error);
  }
  revalidateApp();
  return ok();
}

export async function deleteInvestmentAction(id: string): Promise<ActionResult> {
  const repo = await getOnboardedRepository();
  try {
    await repo.deleteInvestment(id);
  } catch (error) {
    return failure(error);
  }
  revalidateApp();
  redirect('/app/investimentos?eliminado=1' as Route);
}
