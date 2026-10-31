'use client';

import { Ellipsis, PencilLine, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@/components/ui/menu';
import { deleteTransactionAction } from '@/lib/actions/transactions';
import { deleteValuationAction } from '@/lib/actions/valuations';
import type { Transaction } from '@/lib/domain/types';
import { formatDate } from '@/lib/formatters/dates';
import { type TransactionContext, TransactionDialog } from '../transaction-dialog';

/** Editar/eliminar uma entrada do histórico (com confirmação e auditoria no servidor). */
export function EntryActions({
  kind,
  id,
  label,
  date,
  transaction,
  context,
  isOnlyTransaction,
}: {
  kind: 'transaction' | 'valuation';
  id: string;
  label: string;
  date: string;
  transaction: Transaction | null;
  context: TransactionContext;
  /** O movimento inicial não pode ficar sozinho a ser apagado (o investimento ficaria sem história). */
  isOnlyTransaction: boolean;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <>
      <Menu modal={false}>
        <MenuTrigger
          className="flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-paper-sunken hover:text-ink"
          aria-label={`Ações: ${label} de ${formatDate(date)}`}
        >
          <Ellipsis aria-hidden className="size-4" strokeWidth={1.75} />
        </MenuTrigger>
        <MenuContent>
          {kind === 'transaction' && transaction ? (
            <MenuItem onSelect={() => setEditing(true)}>
              <PencilLine aria-hidden strokeWidth={1.75} />
              Editar movimento
            </MenuItem>
          ) : null}
          <MenuItem tone="danger" disabled={isOnlyTransaction} onSelect={() => setDeleting(true)}>
            <Trash2 aria-hidden strokeWidth={1.75} />
            Eliminar
          </MenuItem>
        </MenuContent>
      </Menu>

      {kind === 'transaction' && transaction && editing ? (
        <TransactionDialogOpen
          context={context}
          transaction={transaction}
          onClose={() => setEditing(false)}
        />
      ) : null}

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Eliminar ${kind === 'transaction' ? 'movimento' : 'avaliação'}?`}
        description={
          <>
            {label} de {formatDate(date)}. As métricas são recalculadas sem este registo e a
            eliminação fica no registo de auditoria.
          </>
        }
        confirmLabel="Eliminar"
        onConfirm={async () => {
          const result =
            kind === 'transaction'
              ? await deleteTransactionAction(id)
              : await deleteValuationAction(id);
          if (result.ok) {
            toast.success(kind === 'transaction' ? 'Movimento eliminado' : 'Avaliação eliminada');
            router.refresh();
          }
          return result;
        }}
      />
    </>
  );
}

/** Abre o diálogo de edição já aberto (acionado a partir do menu). */
function TransactionDialogOpen({
  context,
  transaction,
  onClose,
}: {
  context: TransactionContext;
  transaction: Transaction;
  onClose: () => void;
}) {
  return (
    <TransactionDialog
      context={context}
      existing={transaction}
      defaultOpen
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    />
  );
}
