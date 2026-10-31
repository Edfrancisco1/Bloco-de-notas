/**
 * Limite de tentativas em memória (janela fixa), para login e recuperação no modo demonstração.
 * Com o Supabase, a autenticação já tem limites próprios; este módulo continua útil para
 * exportações e outras ações sensíveis (PLANO_MVP §11).
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = globalThis as typeof globalThis & { __investnoteRateLimit?: Map<string, Bucket> };

function buckets(): Map<string, Bucket> {
  store.__investnoteRateLimit ??= new Map();
  return store.__investnoteRateLimit;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function consume(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const map = buckets();
  let bucket = map.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    map.set(key, bucket);
  }
  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(limit - bucket.count, 0),
    retryAfterSeconds: allowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000),
  };
}

export function reset(key: string): void {
  buckets().delete(key);
}
