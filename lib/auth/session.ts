import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { DEMO_USER_ID } from '@/lib/data/mock/fixtures';
import { getUserData } from '@/lib/data/mock/store';

/**
 * Sessão do MODO DEMONSTRAÇÃO: um cookie httpOnly com o id da conta mock.
 * Não é autenticação real. Com o Supabase, este módulo passa a usar `supabase.auth.getClaims()`
 * (nunca `getSession()` no servidor) — ver docs/ligacao-supabase.md. As páginas só dependem de
 * `getSession`/`requireSession`, por isso não mudam.
 */
export const SESSION_COOKIE = 'investnote_sessao';

export interface Session {
  userId: string;
  email: string;
  isDemo: boolean;
}

export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const userId = store.get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  const data = getUserData(userId);
  if (!data) return null;
  return { userId, email: data.profile.email, isDemo: userId === DEMO_USER_ID };
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect('/entrar');
  return session;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};
