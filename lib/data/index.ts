import 'server-only';
import { redirect } from 'next/navigation';
import { requireSession } from '@/lib/auth/session';
import { createMockRepository } from './mock/repository';
import type { UserRepository } from './repository';

/**
 * Ponto único de acesso a dados para páginas e Server Actions.
 * DATA_SOURCE=mock (por defeito) usa a base em memória; DATA_SOURCE=supabase será a
 * implementação real (docs/ligacao-supabase.md).
 */
export async function getRepository(): Promise<UserRepository> {
  const session = await requireSession();
  const source = process.env.DATA_SOURCE ?? 'mock';
  if (source !== 'mock') {
    throw new Error(
      `DATA_SOURCE=${source} ainda não está implementado. Ver docs/ligacao-supabase.md.`,
    );
  }
  return createMockRepository(session.userId);
}

/** Repositório de um utilizador que já concluiu o onboarding (senão, vai para as boas-vindas). */
export async function getOnboardedRepository(): Promise<UserRepository> {
  const repo = await getRepository();
  const profile = await repo.getProfile();
  if (!profile.onboardedAt) redirect('/boas-vindas');
  return repo;
}
