import type { z } from 'zod';
import { isDomainError } from '@/lib/data/errors';

/** Resultado tipado de uma Server Action: nunca finge sucesso e nunca expõe detalhes internos. */
export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const GENERIC_ERROR = 'Não foi possível guardar. Tente novamente dentro de instantes.';

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

/** Converte erros do Zod em mensagens por campo (caminho "a.b.c" → primeira mensagem). */
export function invalid(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: 'Reveja os campos assinalados.', fieldErrors };
}

/** Erros de regra de negócio têm mensagem para o utilizador; os restantes ficam genéricos. */
export function failure(error: unknown): ActionResult<never> {
  if (isDomainError(error)) return { ok: false, error: error.message };
  console.error('[action] erro inesperado', error instanceof Error ? error.name : 'desconhecido');
  return { ok: false, error: GENERIC_ERROR };
}
