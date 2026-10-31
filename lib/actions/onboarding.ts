'use server';

import { getRepository } from '@/lib/data';
import { onboardingSchema } from '@/lib/validations/schemas';
import type { z } from 'zod';
import { type ActionResult, failure, invalid, ok } from './result';

/**
 * Onboarding (PLANO_MVP §8, jornada A): nome, moeda (Kwanza), fuso e a primeira carteira.
 * Sem revalidatePath de propósito: isso voltaria a renderizar /boas-vindas, que redireciona
 * quem já concluiu o onboarding — e o passo 2 (escolher o primeiro investimento) não apareceria.
 * As páginas de /app são dinâmicas e leem os dados atualizados ao navegar.
 */
export async function completeOnboardingAction(
  input: z.input<typeof onboardingSchema>,
): Promise<ActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const repo = await getRepository();
  try {
    await repo.completeOnboarding(parsed.data);
  } catch (error) {
    return failure(error);
  }
  return ok();
}
