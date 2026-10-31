import 'server-only';
import { deadlineFor, type DeadlineLevel } from '@/lib/calculations/status';
import type { UserRepository } from '@/lib/data/repository';
import type { InvestmentType, IsoDate, ReminderStatus } from '@/lib/domain/types';
import { formatMonthYear } from '@/lib/formatters/dates';
import { loadPortfolioSnapshot } from './snapshot';

/** Prazos (PLANO_MVP §9): vencimentos e lembretes por mês, com as marcas de 30, 7 e 1 dia. */

export interface CalendarItem {
  id: string;
  kind: 'maturity' | 'reminder';
  date: IsoDate;
  daysLeft: number;
  level: DeadlineLevel;
  title: string;
  investmentId: string | null;
  investmentName: string | null;
  investmentType: InvestmentType | null;
  reminderStatus: ReminderStatus | null;
}

export interface CalendarGroup {
  key: string;
  label: string;
  items: CalendarItem[];
}

export interface CalendarView {
  today: IsoDate;
  overdue: CalendarItem[];
  groups: CalendarGroup[];
  done: CalendarItem[];
  showDone: boolean;
  investments: { id: string; name: string }[];
}

export async function getCalendarView(
  repo: UserRepository,
  options: { showDone: boolean },
): Promise<CalendarView> {
  const snapshot = await loadPortfolioSnapshot(repo);
  const { today } = snapshot;
  const byId = new Map(snapshot.positions.map((p) => [p.investment.id, p.investment]));
  const items: CalendarItem[] = [];

  for (const { investment } of snapshot.positions) {
    const open = investment.status === 'active' || investment.status === 'matured';
    if (!open || !investment.maturityDate) continue;
    const deadline = deadlineFor(investment.maturityDate, today);
    items.push({
      id: `vencimento-${investment.id}`,
      kind: 'maturity',
      date: investment.maturityDate,
      daysLeft: deadline.daysLeft,
      level: deadline.level,
      title: 'Vencimento',
      investmentId: investment.id,
      investmentName: investment.name,
      investmentType: investment.type,
      reminderStatus: null,
    });
  }

  for (const reminder of snapshot.reminders) {
    if (reminder.status === 'cancelled') continue;
    const investment = reminder.investmentId ? byId.get(reminder.investmentId) : undefined;
    const deadline = deadlineFor(reminder.dueOn, today);
    items.push({
      id: reminder.id,
      kind: 'reminder',
      date: reminder.dueOn,
      daysLeft: deadline.daysLeft,
      level: deadline.level,
      title: reminder.title,
      investmentId: investment?.id ?? null,
      investmentName: investment?.name ?? null,
      investmentType: investment?.type ?? null,
      reminderStatus: reminder.status,
    });
  }

  items.sort((a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind));

  const isDone = (item: CalendarItem) => item.reminderStatus === 'done';
  const pending = items.filter((item) => !isDone(item));
  const overdue = pending.filter((item) => item.daysLeft < 0);
  const groups = new Map<string, CalendarGroup>();
  for (const item of pending.filter((i) => i.daysLeft >= 0)) {
    const key = item.date.slice(0, 7);
    const group = groups.get(key) ?? { key, label: formatMonthYear(item.date), items: [] };
    group.items.push(item);
    groups.set(key, group);
  }

  return {
    today,
    overdue,
    groups: [...groups.values()],
    done: options.showDone ? items.filter(isDone).reverse() : [],
    showDone: options.showDone,
    investments: snapshot.positions
      .filter((p) => p.investment.status !== 'archived')
      .map((p) => ({ id: p.investment.id, name: p.investment.name })),
  };
}
