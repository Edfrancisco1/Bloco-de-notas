import { MARKET } from '@/lib/domain/market';
import type { IsoDate } from '@/lib/domain/types';

/**
 * Datas em pt-AO. Datas de calendário (IsoDate) são formatadas em UTC para não "mudarem de dia"
 * com o fuso do servidor ou do browser.
 */

function utc(date: IsoDate): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

const cache = new Map<string, Intl.DateTimeFormat>();
function dtf(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = JSON.stringify(options);
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(MARKET.locale, { ...options, timeZone: 'UTC' });
    cache.set(key, formatter);
  }
  return formatter;
}

function monthShort(date: IsoDate): string {
  return dtf({ month: 'short' }).format(utc(date));
}

/**
 * - `short`: 30/10/2026
 * - `medium`: 30 out. 2026
 * - `long`: 30 de outubro de 2026
 */
export function formatDate(date: IsoDate, style: 'short' | 'medium' | 'long' = 'medium'): string {
  if (style === 'short') return dtf({ dateStyle: 'medium' }).format(utc(date));
  if (style === 'long') return dtf({ dateStyle: 'long' }).format(utc(date));
  const d = utc(date);
  return `${d.getUTCDate()} ${monthShort(date)} ${d.getUTCFullYear()}`;
}

/** 30 out. */
export function formatDayMonth(date: IsoDate): string {
  return `${utc(date).getUTCDate()} ${monthShort(date)}`;
}

/** Outubro de 2026 */
export function formatMonthYear(date: IsoDate): string {
  const text = dtf({ month: 'long', year: 'numeric' }).format(utc(date));
  return text.charAt(0).toLocaleUpperCase(MARKET.locale) + text.slice(1);
}

const relative = new Intl.RelativeTimeFormat(MARKET.locale, { numeric: 'auto' });

/** Diferença em dias → "hoje", "ontem", "há 45 dias", "dentro de 7 dias", "há 2 meses". */
export function formatRelativeDays(days: number): string {
  const abs = Math.abs(days);
  const sign = days < 0 ? -1 : 1;
  if (abs < 60) return relative.format(days, 'day');
  // Arredonda pelo valor absoluto (Math.round(-1.5) daria -1 em JavaScript).
  const months = Math.round(abs / 30);
  if (months < 12) return relative.format(sign * months, 'month');
  return relative.format(sign * Math.round(abs / 365), 'year');
}

/** Idade de um registo → "Atualizado hoje", "Atualizado há 3 dias". */
export function formatUpdatedAgo(ageDays: number): string {
  if (ageDays <= 0) return 'Atualizado hoje';
  if (ageDays === 1) return 'Atualizado ontem';
  return `Atualizado ${formatRelativeDays(-ageDays)}`;
}

/** Prazo → "Vence hoje", "Vence amanhã", "Vence dentro de 7 dias", "Venceu há 2 dias". */
export function formatDueIn(
  daysLeft: number,
  verb: { future: string; past: string } = { future: 'Vence', past: 'Venceu' },
): string {
  const text = formatRelativeDays(daysLeft);
  return daysLeft < 0 ? `${verb.past} ${text}` : `${verb.future} ${text}`;
}
