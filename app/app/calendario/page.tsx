import { BellPlus } from 'lucide-react';
import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { EmptyState, PageHeader, Section } from '@/components/common/section';
import { TypeMonogram } from '@/components/common/type-monogram';
import { ReminderActions } from '@/components/investments/reminder-actions';
import { ReminderDialog } from '@/components/investments/reminder-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { addDays } from '@/lib/calculations/dates';
import { getOnboardedRepository } from '@/lib/data';
import { formatDate, formatRelativeDays } from '@/lib/formatters/dates';
import { type CalendarItem, getCalendarView } from '@/lib/services/calendar';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Prazos' };

function LevelBadge({ item }: { item: CalendarItem }) {
  if (item.reminderStatus === 'done') return <Badge>Concluído</Badge>;
  const text = formatRelativeDays(item.daysLeft);
  if (item.level === 'overdue') return <Badge tone="negative">{text}</Badge>;
  if (item.level === 'today' || item.level === 'd1' || item.level === 'd7') {
    return <Badge tone="marker">{text}</Badge>;
  }
  if (item.level === 'd30') return <Badge tone="outline">{text}</Badge>;
  return <span className="text-sm whitespace-nowrap text-ink-3">{text}</span>;
}

function ItemRow({ item }: { item: CalendarItem }) {
  const [, , day] = item.date.split('-');
  const month = formatDate(item.date).split(' ')[1] ?? '';
  const done = item.reminderStatus === 'done';
  return (
    <li className="flex items-start gap-4 py-3.5">
      <span className="w-11 shrink-0 pt-0.5 text-center">
        <span className="block figures-display text-[1.625rem] leading-none text-ink">
          {Number(day)}
        </span>
        <span className="mt-1 block eyebrow">{month}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-[0.9375rem] font-medium text-ink',
            done && 'text-ink-3 line-through decoration-ink-3/50',
          )}
        >
          {item.kind === 'maturity' ? 'Vencimento' : item.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-3">
          {item.investmentId && item.investmentType ? (
            <Link
              href={`/app/investimentos/${item.investmentId}` as Route}
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-ink hover:underline"
            >
              <TypeMonogram
                type={item.investmentType}
                size="sm"
                className="size-5 text-[0.5625rem]"
              />
              {item.investmentName}
            </Link>
          ) : (
            <span>{item.kind === 'reminder' ? 'Lembrete geral' : null}</span>
          )}
          <LevelBadge item={item} />
        </div>
      </div>
      {item.kind === 'reminder' && item.reminderStatus ? (
        <ReminderActions id={item.id} status={item.reminderStatus} title={item.title} />
      ) : null}
    </li>
  );
}

export default async function CalendarPage({ searchParams }: PageProps<'/app/calendario'>) {
  const { concluidos } = await searchParams;
  const repo = await getOnboardedRepository();
  const view = await getCalendarView(repo, { showDone: concluidos === '1' });
  const empty = view.overdue.length === 0 && view.groups.length === 0;

  return (
    <>
      <PageHeader
        title="Prazos"
        description="Vencimentos dos seus investimentos e lembretes. As notificações por e-mail chegam numa fase seguinte."
        actions={
          <ReminderDialog
            investmentId={null}
            investments={view.investments}
            defaultDate={addDays(view.today, 7)}
            today={view.today}
            trigger={
              <Button>
                <BellPlus aria-hidden strokeWidth={1.75} />
                Novo lembrete
              </Button>
            }
          />
        }
      />

      <div className="mt-12 flex flex-col gap-14">
        {view.overdue.length > 0 ? (
          <Section
            id="em-atraso"
            title="Em atraso"
            description="Já passaram da data. Conclua, adie ou cancele."
          >
            <ol className="divide-y divide-rule">
              {view.overdue.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ol>
          </Section>
        ) : null}

        {view.groups.map((group) => (
          <Section key={group.key} id={`mes-${group.key}`} title={group.label}>
            <ol className="divide-y divide-rule">
              {group.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ol>
          </Section>
        ))}

        {empty ? (
          <EmptyState title="Sem prazos à vista.">
            Os vencimentos aparecem aqui quando indicar a data de vencimento de um investimento.
            Pode também criar lembretes para qualquer data.
          </EmptyState>
        ) : null}

        {view.showDone ? (
          <Section
            id="concluidos"
            title="Concluídos"
            action={
              <Link
                href="/app/calendario"
                className="text-sm text-accent underline-offset-4 hover:underline"
              >
                Esconder
              </Link>
            }
          >
            {view.done.length === 0 ? (
              <p className="py-4 text-sm text-ink-3">Ainda não concluiu nenhum lembrete.</p>
            ) : (
              <ol className="divide-y divide-rule">
                {view.done.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </ol>
            )}
          </Section>
        ) : (
          <Link
            href={'/app/calendario?concluidos=1' as Route}
            className="self-start text-sm text-accent underline decoration-accent/40 underline-offset-4"
          >
            Mostrar lembretes concluídos
          </Link>
        )}
      </div>
    </>
  );
}
