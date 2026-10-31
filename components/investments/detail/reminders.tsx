'use client';

import { BellPlus } from 'lucide-react';
import { Section } from '@/components/common/section';
import { Badge } from '@/components/ui/badge';
import { daysBetween } from '@/lib/calculations/dates';
import { reminderStatusLabel } from '@/lib/domain/labels';
import type { IsoDate, Reminder } from '@/lib/domain/types';
import { formatDate, formatRelativeDays } from '@/lib/formatters/dates';
import { cn } from '@/lib/utils';
import { ReminderActions } from '../reminder-actions';
import { ReminderDialog } from '../reminder-dialog';

/** Lembretes do investimento: concluir, adiar uma semana, cancelar ou reabrir. */
export function InvestmentReminders({
  reminders,
  investmentId,
  investmentName,
  today,
  editable,
}: {
  reminders: Reminder[];
  investmentId: string;
  investmentName: string;
  today: IsoDate;
  editable: boolean;
}) {
  return (
    <Section
      id="lembretes"
      title="Lembretes"
      action={
        editable ? (
          <ReminderDialog
            investmentId={investmentId}
            investmentName={investmentName}
            defaultDate={today}
            today={today}
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-sm text-accent underline-offset-4 hover:underline"
              >
                <BellPlus aria-hidden className="size-4" strokeWidth={1.75} />
                Novo
              </button>
            }
          />
        ) : null
      }
    >
      {reminders.length === 0 ? (
        <p className="py-4 text-sm text-ink-3">Sem lembretes para este investimento.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {reminders.map((reminder) => {
            const open = reminder.status === 'pending' || reminder.status === 'snoozed';
            const days = daysBetween(today, reminder.dueOn);
            return (
              <li key={reminder.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      'text-[0.9375rem] text-ink',
                      !open && 'text-ink-3 line-through decoration-ink-3/50',
                    )}
                  >
                    {reminder.title}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-3">
                    {formatDate(reminder.dueOn)}
                    {open ? (
                      <Badge tone={days < 0 ? 'negative' : days <= 7 ? 'marker' : 'outline'}>
                        {formatRelativeDays(days)}
                      </Badge>
                    ) : (
                      <Badge>{reminderStatusLabel[reminder.status]}</Badge>
                    )}
                  </p>
                </div>
                <ReminderActions id={reminder.id} status={reminder.status} title={reminder.title} />
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
