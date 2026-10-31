'use server';

import type { Route } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signInWithPassword, signUpWithPassword, updatePassword } from '@/lib/auth/mock-auth';
import { consume, reset } from '@/lib/auth/rate-limit';
import { SESSION_COOKIE, getSession, sessionCookieOptions } from '@/lib/auth/session';
import { isDomainError } from '@/lib/data/errors';
import {
  newPasswordSchema,
  passwordResetRequestSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/validations/schemas';

/**
 * Autenticação (modo demonstração). Estados compatíveis com `useActionState`, para os
 * formulários funcionarem também sem JavaScript. Mensagens genéricas: nunca revelam se um
 * e-mail tem conta. Com o Supabase, estas ações passam a chamar o Supabase Auth.
 */
export interface AuthFormState {
  error: string | null;
  fieldErrors: Record<string, string>;
  /** Para repor o e-mail no formulário depois de um erro. */
  email: string;
  done?: boolean;
}

const fieldErrorsOf = (issues: { path: PropertyKey[]; message: string }[]) => {
  const errors: Record<string, string> = {};
  for (const issue of issues) errors[String(issue.path[0] ?? '_')] ??= issue.message;
  return errors;
};

async function startSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, userId, sessionCookieOptions);
}

export async function signInAction(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = String(form.get('email') ?? '').trim();
  const parsed = signInSchema.safeParse({ email, password: form.get('password') });
  if (!parsed.success)
    return { error: null, fieldErrors: fieldErrorsOf(parsed.error.issues), email };

  const limit = consume(`entrar:${parsed.data.email.toLowerCase()}`, 5, 15 * 60_000);
  if (!limit.allowed) {
    return {
      error: `Demasiadas tentativas. Tente de novo dentro de ${Math.ceil(limit.retryAfterSeconds / 60)} minutos.`,
      fieldErrors: {},
      email,
    };
  }
  const userId = signInWithPassword(parsed.data.email, parsed.data.password);
  if (!userId) return { error: 'E-mail ou palavra-passe incorretos.', fieldErrors: {}, email };

  reset(`entrar:${parsed.data.email.toLowerCase()}`);
  await startSession(userId);
  redirect('/app');
}

export async function signUpAction(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = String(form.get('email') ?? '').trim();
  const parsed = signUpSchema.safeParse({ email, password: form.get('password') });
  const fieldErrors = parsed.success ? {} : fieldErrorsOf(parsed.error.issues);
  if (form.get('termos') !== 'on') fieldErrors.termos = 'Aceite os termos para continuar.';
  if (!parsed.success || fieldErrors.termos) return { error: null, fieldErrors, email };

  let userId: string;
  try {
    userId = signUpWithPassword(parsed.data.email, parsed.data.password);
  } catch (error) {
    if (isDomainError(error)) return { error: error.message, fieldErrors: {}, email };
    throw error;
  }
  await startSession(userId);
  redirect('/boas-vindas');
}

/** Pede a recuperação. A resposta é sempre a mesma, exista ou não conta com o e-mail. */
export async function requestPasswordResetAction(
  _prev: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const email = String(form.get('email') ?? '').trim();
  const parsed = passwordResetRequestSchema.safeParse({ email });
  if (!parsed.success)
    return { error: null, fieldErrors: fieldErrorsOf(parsed.error.issues), email };
  const limit = consume(`recuperar:${parsed.data.email.toLowerCase()}`, 3, 60 * 60_000);
  if (!limit.allowed) {
    return { error: 'Demasiados pedidos. Tente de novo mais tarde.', fieldErrors: {}, email };
  }
  // Modo demonstração: não envia e-mail. Com o Supabase: resetPasswordForEmail com redirect
  // para /auth/confirm?type=recovery&next=/recuperar-password/nova.
  return { error: null, fieldErrors: {}, email, done: true };
}

export async function setNewPasswordAction(
  _prev: AuthFormState,
  form: FormData,
): Promise<AuthFormState> {
  const parsed = newPasswordSchema.safeParse({
    password: form.get('password'),
    confirm: form.get('confirm'),
  });
  if (!parsed.success)
    return { error: null, fieldErrors: fieldErrorsOf(parsed.error.issues), email: '' };
  const session = await getSession();
  if (!session) {
    return {
      error: 'A ligação de recuperação expirou. Peça uma nova.',
      fieldErrors: {},
      email: '',
    };
  }
  updatePassword(session.userId, parsed.data.password);
  redirect('/app?password=atualizada' as Route);
}
