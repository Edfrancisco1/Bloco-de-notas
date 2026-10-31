'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { resetDemoData } from '@/lib/data/mock/store';

/** Só para a conta de demonstração: repõe os dados de exemplo ou começa do zero. */
export async function resetDemoAction(formData: FormData) {
  const session = await requireSession();
  if (!session.isDemo) redirect('/app/definicoes');
  const mode = formData.get('modo') === 'vazia' ? 'empty' : 'sample';
  resetDemoData(mode);
  revalidatePath('/app', 'layout');
  redirect('/app');
}
