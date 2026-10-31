import type { Route } from 'next';
import Link from 'next/link';
import { Section } from '@/components/common/section';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatRelativeDays } from '@/lib/formatters/dates';
import type { DashboardView, UpcomingItem } from '@/lib/services/views';
import { cn } from '@/lib/utils';

function dayAndMonth(date: string) {
  const [, , day] = date.split('-');
  const month = formatDate(date).split(' ')[1] ?? '';
  return { day: String(Number(day)), month };
}

function LevelBadge({ item }: { item: UpcomingItem }) {
  const text = formatRelativeDays(item.daysLeft);
  if (item.level === 'overdue') return <Badge tone="negative">{text}</Badge>;
  if (item.level === 'today' || item.level === 'd1' || item.level === 'd7') {
    return <Badge tone="marker">{text}</Badge>;
  }
  return <span className="text-sm whitespace-nowrap text-ink-3">{text}</span>;
}

/** Próximos vencimentos e lembretes (90 dias), com marcas de 30, 7 e 1 dia. */
export function UpcomingList({ view, className }: { view: DashboardView; className?: string }) {
  return (
    <Section
      id="prazos"
      title="Próximos prazos"
      className={className}
      action={
        <Link
          href="/app/calendario"
          className="text-sm text-accent underline-offset-4 hover:underline"
        >
          Ver todos
        </Link>
      }
    >
      {view.upcoming.length === 0 ? (
        <p className="py-5 text-ink-3">Sem vencimentos nem lembretes nos próximos 90 dias.</p>
      ) : (
        <ol className="divide-y divide-rule">
          {view.upcoming.map((item) => {
            const { day, month } = dayAndMonth(item.date);
            const content = (
              <>
                <span className="w-11 shrink-0 text-center">
                  <span className="block figures-display text-[1.625rem] leading-none text-ink">
                    {day}
                  </span>
                  <span className="mt-1 block eyebrow">{month}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-[0.9375rem] font-medium text-ink">
                    {item.kind === 'maturity' ? 'Vencimento' : item.title}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink-3">
                    {item.kind === 'maturity'
                      ? item.investmentName
                      : (item.investmentName ?? 'Lembrete')}
                  </span>
                  <span className="mt-1.5 block sm:hidden">
                    <LevelBadge item={item} />
                  </span>
                </span>
                <span className="hidden shrink-0 self-start pt-0.5 sm:block">
                  <LevelBadge item={item} />
                </span>
              </>
            );
            return (
              <li key={item.id}>
                {item.investmentId ? (
                  <Link
                    href={`/app/investimentos/${item.investmentId}` as Route}
                    className={cn(
                      'flex items-center gap-4 py-3.5 transition-colors hover:bg-paper-sunken/60 sm:-mx-2 sm:px-2',
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-center gap-4 py-3.5">{content}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}
