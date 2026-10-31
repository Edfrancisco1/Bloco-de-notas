import { CircleCheck } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { Section } from '@/components/common/section';
import { TypeMonogram } from '@/components/common/type-monogram';
import { ValuationDialog } from '@/components/investments/valuation-dialog';
import { buttonVariants } from '@/components/ui/button';
import { formatRelativeDays, formatUpdatedAgo } from '@/lib/formatters/dates';
import type { AttentionItem, DashboardView } from '@/lib/services/views';
import { cn } from '@/lib/utils';

function reasonText(item: AttentionItem): string {
  if (item.reason === 'matured') {
    return `Venceu ${formatRelativeDays(-(item.daysOverdue ?? 0))} — registe o resgate ou a renovação`;
  }
  if (item.reason === 'missing') return 'Valor atual não registado';
  return formatUpdatedAgo(item.ageDays ?? 0);
}

/**
 * Fila de revisão (como no Copilot Money): o que falta para o painel estar certo.
 * Junta os pontos 3 e 6 do PLANO_MVP §9.
 */
export function AttentionList({ view, className }: { view: DashboardView; className?: string }) {
  const items = view.attention;
  return (
    <Section
      id="atencao"
      className={className}
      title={
        <span className="inline-flex items-baseline gap-2.5">
          Precisa de atenção
          {items.length ? (
            <span className="rounded-sm bg-marker px-1.5 font-sans text-sm font-semibold text-marker-ink figures-table">
              {items.length}
            </span>
          ) : null}
        </span>
      }
      description="Valores em falta ou com mais de 30 dias. O painel nunca os apresenta como atuais."
    >
      {items.length === 0 ? (
        <p className="flex items-center gap-2.5 py-5 text-ink-2">
          <CircleCheck aria-hidden className="size-5 text-positive" strokeWidth={1.75} />
          Está tudo em dia: todos os valores têm menos de 30 dias.
        </p>
      ) : (
        <ul className="divide-y divide-rule">
          {items.map((item) => {
            const href = `/app/investimentos/${item.target.investmentId}` as Route;
            return (
              <li
                key={item.target.investmentId}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3.5 gap-y-2.5 py-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
              >
                <TypeMonogram
                  type={item.target.type}
                  className="row-span-2 self-start sm:row-span-1 sm:self-center"
                />
                <div className="min-w-0">
                  <Link
                    href={href}
                    className="line-clamp-2 font-medium text-ink underline-offset-4 hover:underline"
                  >
                    {item.target.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-ink-3">
                    {item.institutionName ? <>{item.institutionName} · </> : null}
                    <span
                      className={cn(
                        'text-ink-2',
                        item.reason === 'matured'
                          ? 'font-medium text-negative'
                          : 'marker-highlight',
                      )}
                    >
                      {reasonText(item)}
                    </span>
                  </p>
                </div>
                <div className="col-start-2 sm:col-start-3">
                  {item.reason === 'matured' ? (
                    <Link
                      href={href}
                      className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                    >
                      Ver investimento
                    </Link>
                  ) : (
                    <ValuationDialog target={item.target} today={view.today} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
