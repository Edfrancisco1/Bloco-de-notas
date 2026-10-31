import 'server-only';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { DomainError } from '@/lib/data/errors';
import { createMockAccount, findMockAccount, getMockDb } from '@/lib/data/mock/store';

/**
 * Autenticação do MODO DEMONSTRAÇÃO. Mesmo em memória, nunca guarda palavras-passe em claro
 * (scrypt com sal). Com o Supabase, tudo isto passa para o Supabase Auth.
 */

function hash(password: string, salt: string = randomBytes(16).toString('hex')): string {
  return `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;
}

function verify(password: string, stored: string): boolean {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 32);
  const expectedBuffer = Buffer.from(expected, 'hex');
  return expectedBuffer.length === actual.length && timingSafeEqual(actual, expectedBuffer);
}

/** Devolve o id da conta ou `null` (mensagem genérica no ecrã: não revela se o e-mail existe). */
export function signInWithPassword(email: string, password: string): string | null {
  const account = findMockAccount(email);
  if (!account) {
    // Mesmo custo de tempo com ou sem conta, para não revelar quais e-mails existem.
    verify(password, hash('sem-conta'));
    return null;
  }
  return verify(password, account.passwordHash) ? account.userId : null;
}

export function signUpWithPassword(email: string, password: string): string {
  if (findMockAccount(email)) {
    throw new DomainError(
      'conflict',
      'Já existe uma conta com este e-mail. Entre ou recupere a palavra-passe.',
    );
  }
  return createMockAccount(email, hash(password)).userId;
}

export function updatePassword(userId: string, password: string): void {
  for (const account of getMockDb().accounts.values()) {
    if (account.userId === userId) account.passwordHash = hash(password);
  }
}
