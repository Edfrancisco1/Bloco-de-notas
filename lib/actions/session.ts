'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE, sessionCookieOptions } from '@/lib/auth/session';
import { DEMO_USER_ID } from '@/lib/data/mock/fixtures';
import { getUserData } from '@/lib/data/mock/store';

/** Entra na conta de demonstração (dados fictícios). */
export async function enterDemoAction() {
  getUserData(DEMO_USER_ID); // cria os dados de exemplo, se ainda não existirem
  const store = await cookies();
  store.set(SESSION_COOKIE, DEMO_USER_ID, sessionCookieOptions);
  redirect('/app');
}

export async function signOutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect('/entrar');
}
