import type { IsoDate } from '@/lib/domain/types';

/**
 * Utilitários de datas de calendário (AAAA-MM-DD). Calculam em UTC para que
 * diferenças de dias nunca dependam do fuso ou de mudanças de hora.
 */

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return date.toISOString().slice(0, 10) === value;
}

function toUtcMs(date: IsoDate): number {
  const match = ISO_DATE.exec(date);
  if (!match) throw new TypeError(`Data inválida: "${date}"`);
  const [, y, m, d] = match;
  return Date.UTC(Number(y), Number(m) - 1, Number(d));
}

function fromUtcMs(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Data de hoje num fuso horário (por defeito, o do mercado). */
export function todayIn(timeZone: string, now: Date = new Date()): IsoDate {
  // en-CA formata como AAAA-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Número de dias de `from` até `to` (negativo se `to` for anterior). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

export function compareIsoDates(a: IsoDate, b: IsoDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function maxIsoDate(dates: Iterable<IsoDate | null | undefined>): IsoDate | null {
  let latest: IsoDate | null = null;
  for (const date of dates) {
    if (date && (latest === null || date > latest)) latest = date;
  }
  return latest;
}
