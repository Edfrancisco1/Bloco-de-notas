'use server';

import { revalidatePath } from 'next/cache';
import { getOnboardedRepository } from '@/lib/data';
import { institutionSchema, portfolioSchema } from '@/lib/validations/schemas';
import type { z } from 'zod';
import { type ActionResult, failure, invalid, ok } from './result';

/** Carteiras e instituições (PLANO_MVP §13: create/update/archive). */

export async function savePortfolioAction(
  id: string | null,
  input: z.input<typeof portfolioSchema>,
): Promise<ActionResult> {
  const parsed = portfolioSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const repo = await getOnboardedRepository();
  try {
    if (id) await repo.updatePortfolio(id, parsed.data);
    else await repo.createPortfolio(parsed.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}

export async function archivePortfolioAction(id: string): Promise<ActionResult> {
  const repo = await getOnboardedRepository();
  try {
    await repo.archivePortfolio(id);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}

export async function saveInstitutionAction(
  id: string | null,
  input: z.input<typeof institutionSchema>,
): Promise<ActionResult> {
  const parsed = institutionSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const repo = await getOnboardedRepository();
  try {
    if (id) await repo.updateInstitution(id, parsed.data);
    else await repo.createInstitution(parsed.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}

export async function archiveInstitutionAction(id: string): Promise<ActionResult> {
  const repo = await getOnboardedRepository();
  try {
    await repo.archiveInstitution(id);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}
