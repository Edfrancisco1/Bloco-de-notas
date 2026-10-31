import { MARKET } from '@/lib/domain/market';
import type { IsoDate } from '@/lib/domain/types';
import { daysBetween } from './dates';

export type Freshness =
  | { state: 'missing'; ageDays: null }
  | { state: 'stale'; ageDays: number }
  | { state: 'fresh'; ageDays: number };

/** Estado da avaliação: sem avaliação, desatualizada (> limite) ou atual. */
export function valuationFreshness(
  valuedOn: IsoDate | null,
  today: IsoDate,
  staleAfterDays: number = MARKET.staleAfterDays,
): Freshness {
  if (!valuedOn) return { state: 'missing', ageDays: null };
  const ageDays = Math.max(daysBetween(valuedOn, today), 0);
  return ageDays > staleAfterDays ? { state: 'stale', ageDays } : { state: 'fresh', ageDays };
}

/** Referências visuais de proximidade de prazo (PLANO_MVP §15): 30, 7 e 1 dia. */
export type DeadlineLevel = 'overdue' | 'today' | 'd1' | 'd7' | 'd30' | 'later';

export interface Deadline {
  daysLeft: number;
  level: DeadlineLevel;
}

export function deadlineFor(date: IsoDate, today: IsoDate): Deadline {
  const daysLeft = daysBetween(today, date);
  let level: DeadlineLevel;
  if (daysLeft < 0) level = 'overdue';
  else if (daysLeft === 0) level = 'today';
  else if (daysLeft <= 1) level = 'd1';
  else if (daysLeft <= 7) level = 'd7';
  else if (daysLeft <= 30) level = 'd30';
  else level = 'later';
  return { daysLeft, level };
}
