'use server';

import type { Route } from 'next';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/lib/auth/session';
import { getRepository } from '@/lib/data';
import { profileSchema } from '@/lib/validations/schemas';
import type { z } from 'zod';
import { type ActionResult, failure, invalid, ok } from './result';

export async function updateProfileAction(
  input: z.input<typeof profileSchema>,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const repo = await getRepository();
  try {
    await repo.updateProfile(parsed.data);
  } catch (error) {
    return failure(error);
  }
  revalidatePath('/app', 'layout');
  return ok();
}

/**
 * Eliminar a conta (PLANO_MVP §15). No modo demonstração a confirmação é escrever "eliminar";
 * com o Supabase, exige reautenticação e termina todas as sessões antes de apagar.
 */
export async function deleteAccountAction(confirmation: string): Promise<ActionResult> {
  if (confirmation.trim().toLocaleLowerCase('pt') !== 'eliminar') {
    return { ok: false, error: 'Escreva «eliminar» para confirmar.' };
  }
  const repo = await getRepository();
  try {
    await repo.deleteAccount();
  } catch (error) {
    return failure(error);
  }
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/entrar?conta=eliminada' as Route);
}
