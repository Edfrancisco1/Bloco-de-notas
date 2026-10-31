import { Amount } from '@/components/common/amount';
import { Section } from '@/components/common/section';
import { Badge } from '@/components/ui/badge';
import type { DecimalString, Transaction } from '@/lib/domain/types';
import { formatDate } from '@/lib/formatters/dates';
import { formatMoney, formatQuantity } from '@/lib/formatters/money';
import type { TimelineEntry } from '@/lib/services/investment-detail';
import { cn } from '@/lib/utils';
import type { TransactionContext } from '../transaction-dialog';
import { EntryActions } from './entry-actions';

const FLOW_TONE: Record<TimelineEntry['flow'], string> = {
  in: 'bg-accent-soft text-accent',
  out: 'bg-paper-sunken text-ink-2',
  income: 'bg-positive-soft text-positive',
  cost: 'bg-negative-soft text-negative',
  value: 'bg-marker-soft text-marker-ink',
  adjust: 'bg-paper-sunken text-ink-2',
};

function details(entry: TimelineEntry): string[] {
  const parts: string[] = [];
  if (entry.quantity && entry.unitPrice) {
    parts.push(`${formatQuantity(entry.quantity)} × ${formatMoney(entry.unitPrice)}`);
  } else if (entry.quantity) {
    parts.push(`${formatQuantity(entry.quantity)} unidades`);
  }
  if (entry.capitalComponent) parts.push(`capital ${formatMoney(entry.capitalComponent)}`);
  if (entry.feeAmount !== '0') parts.push(`comissão ${formatMoney(entry.feeAmount)}`);
  if (entry.taxAmount !== '0') parts.push(`imposto ${formatMoney(entry.taxAmount)}`);
  if (entry.isReinvested) parts.push('reinvestido');
  return parts;
}

/** Histórico (como nas atividades do Parqet/Wealthfolio): movimentos e avaliações, do mais recente. */
export function Timeline({
  entries,
  transactions,
  context,
  editable,
}: {
  entries: TimelineEntry[];
  transactions: Transaction[];
  context: TransactionContext;
  editable: boolean;
}) {
  const byId = new Map(transactions.map((t) => [t.id, t]));
  return (
    <Section
      id="historico"
      title="Histórico"
      description="Movimentos e avaliações. Nada é sobrescrito: cada registo fica guardado."
    >
      <ol className="divide-y divide-rule">
        {entries.map((entry) => {
          const extra = details(entry);
          const signed = entry.flow === 'income' || entry.flow === 'in';
          return (
            <li
              key={`${entry.kind}-${entry.id}`}
              className="grid grid-cols-[minmax(0,1fr)_auto_2rem] items-start gap-x-3 gap-y-1.5 py-3.5 [grid-template-areas:'data_valor_acoes'_'corpo_corpo_corpo'] sm:grid-cols-[6.5rem_minmax(0,1fr)_auto_2rem] sm:gap-x-3.5 sm:[grid-template-areas:'data_corpo_valor_acoes']"
            >
              <time
                dateTime={entry.date}
                className="pt-0.5 text-sm text-ink-3 figures-table [grid-area:data]"
              >
                {formatDate(entry.date)}
              </time>
              <div className="min-w-0 [grid-area:corpo]">
                <Badge className={cn('text-[0.75rem]', FLOW_TONE[entry.flow])}>{entry.label}</Badge>
                {extra.length ? (
                  <p className="mt-1.5 text-sm text-ink-3">{extra.join(' · ')}</p>
                ) : null}
                {entry.notes ? <p className="mt-1 text-sm text-ink-2">{entry.notes}</p> : null}
              </div>
              <div className="text-right [grid-area:valor]">
                <Amount
                  value={
                    entry.flow === 'cost' ? (`-${entry.amount}` as DecimalString) : entry.amount
                  }
                  sign={signed ? 'always' : undefined}
                  className="text-[0.9375rem] text-ink"
                />
              </div>
              <div className="-mt-1 flex justify-end [grid-area:acoes]">
                {editable ? (
                  <EntryActions
                    kind={entry.kind}
                    id={entry.id}
                    label={entry.label}
                    date={entry.date}
                    transaction={entry.kind === 'transaction' ? (byId.get(entry.id) ?? null) : null}
                    context={context}
                    isOnlyTransaction={entry.kind === 'transaction' && transactions.length === 1}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
      {!editable ? (
        <p className="mt-3 text-[0.8125rem] text-ink-3">
          Investimento encerrado ou arquivado: o histórico é só de leitura. Reabra-o para o alterar.
        </p>
      ) : null}
    </Section>
  );
}
