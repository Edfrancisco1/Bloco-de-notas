'use client';

import {
  Archive,
  ArchiveRestore,
  BellPlus,
  Ellipsis,
  Lock,
  PencilLine,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from '@/components/ui/menu';
import { changeInvestmentStatusAction, deleteInvestmentAction } from '@/lib/actions/investments';
import { addDays } from '@/lib/calculations/dates';
import type { DecimalString, InvestmentStatus, IsoDate } from '@/lib/domain/types';
import type { ValuationTarget } from '@/lib/services/views';
import { CloseInvestmentDialog } from '../close-dialog';
import { ReminderDialog } from '../reminder-dialog';
import { type TransactionContext, TransactionDialog } from '../transaction-dialog';
import { ValuationDialog } from '../valuation-dialog';

export function InvestmentActions({
  context,
  target,
  status,
  netInvested,
  quantity,
  maturityDate,
  counts,
}: {
  context: TransactionContext;
  target: ValuationTarget;
  status: InvestmentStatus;
  netInvested: DecimalString;
  quantity: DecimalString | null;
  maturityDate: IsoDate | null;
  counts: { transactions: number; valuations: number; reminders: number };
}) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [pending, startTransition] = useTransition();
  const isOpen = status === 'active' || status === 'matured';
  const editHref = `/app/investimentos/${context.investmentId}/editar` as Route;

  const change = (kind: 'reopen' | 'unarchive', message: string) =>
    startTransition(async () => {
      const result = await changeInvestmentStatusAction(context.investmentId, kind);
      if (result.ok) {
        toast.success(message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });

  const reminderDate =
    maturityDate && maturityDate > context.today
      ? addDays(maturityDate, -7) > context.today
        ? addDays(maturityDate, -7)
        : context.today
      : addDays(context.today, 7);

  return (
    <div className="flex items-center gap-2">
      {isOpen ? (
        <>
          <ValuationDialog
            target={target}
            today={context.today}
            trigger={<Button>Atualizar valor</Button>}
          />
          <TransactionDialog
            context={context}
            trigger={
              <Button variant="secondary" aria-label="Registar movimento" className="max-sm:px-3">
                <Plus aria-hidden strokeWidth={1.75} />
                <span className="hidden sm:inline">Movimento</span>
              </Button>
            }
          />
          <ReminderDialog
            investmentId={context.investmentId}
            investmentName={context.investmentName}
            defaultTitle={maturityDate ? `Vencimento: ${context.investmentName}` : ''}
            defaultDate={reminderDate}
            today={context.today}
            trigger={
              <Button
                variant="secondary"
                size="icon"
                aria-label="Criar lembrete"
                title="Criar lembrete"
              >
                <BellPlus aria-hidden strokeWidth={1.75} />
              </Button>
            }
          />
        </>
      ) : status === 'closed' ? (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => change('reopen', 'Investimento reaberto')}
        >
          <RotateCcw aria-hidden strokeWidth={1.75} />
          Reabrir
        </Button>
      ) : (
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => change('unarchive', 'Investimento desarquivado')}
        >
          <ArchiveRestore aria-hidden strokeWidth={1.75} />
          Desarquivar
        </Button>
      )}

      <Menu modal={false}>
        <MenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Mais ações">
            <Ellipsis aria-hidden strokeWidth={1.75} />
          </Button>
        </MenuTrigger>
        <MenuContent>
          <MenuItem asChild>
            <Link href={editHref}>
              <PencilLine aria-hidden strokeWidth={1.75} />
              Editar dados
            </Link>
          </MenuItem>
          {isOpen ? (
            <MenuItem onSelect={() => setClosing(true)}>
              <Lock aria-hidden strokeWidth={1.75} />
              Encerrar…
            </MenuItem>
          ) : null}
          {status !== 'archived' ? (
            <MenuItem onSelect={() => setArchiving(true)}>
              <Archive aria-hidden strokeWidth={1.75} />
              Arquivar…
            </MenuItem>
          ) : null}
          <MenuSeparator />
          <MenuItem tone="danger" onSelect={() => setDeleting(true)}>
            <Trash2 aria-hidden strokeWidth={1.75} />
            Eliminar…
          </MenuItem>
        </MenuContent>
      </Menu>

      {isOpen ? (
        <CloseInvestmentDialog
          context={context}
          netInvested={netInvested}
          quantity={quantity}
          open={closing}
          onOpenChange={setClosing}
        />
      ) : null}

      <ConfirmDialog
        open={archiving}
        onOpenChange={setArchiving}
        tone="default"
        title={`Arquivar «${context.investmentName}»?`}
        description={
          <>
            Deixa de aparecer no painel e na lista (exceto no filtro «Arquivados»). O histórico fica
            guardado e pode desarquivar quando quiser.
          </>
        }
        confirmLabel="Arquivar"
        onConfirm={async () => {
          const result = await changeInvestmentStatusAction(context.investmentId, 'archive');
          if (result.ok) {
            toast.success('Investimento arquivado');
            router.refresh();
          }
          return result;
        }}
      />

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Eliminar «${context.investmentName}»?`}
        description={
          <>
            Elimina o investimento e todo o histórico: {counts.transactions}{' '}
            {counts.transactions === 1 ? 'movimento' : 'movimentos'}, {counts.valuations}{' '}
            {counts.valuations === 1 ? 'avaliação' : 'avaliações'} e {counts.reminders}{' '}
            {counts.reminders === 1 ? 'lembrete' : 'lembretes'}.{' '}
            <strong>Não pode ser desfeito.</strong> Se quer apenas deixar de o ver, arquive-o.
          </>
        }
        confirmLabel="Eliminar definitivamente"
        pendingLabel="A eliminar…"
        onConfirm={() => deleteInvestmentAction(context.investmentId)}
      />
    </div>
  );
}
