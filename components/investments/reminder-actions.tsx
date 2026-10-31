'use client';

import { Check, Clock3, RotateCcw, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { updateReminderAction } from '@/lib/actions/reminders';
import type { ReminderStatus } from '@/lib/domain/types';

function IconAction({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof Check;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-paper-sunken hover:text-ink disabled:opacity-50"
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.75} />
    </button>
  );
}

/** Concluir, adiar uma semana, cancelar ou reabrir um lembrete. */
export function ReminderActions({
  id,
  status,
  title,
}: {
  id: string;
  status: ReminderStatus;
  title: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const open = status === 'pending' || status === 'snoozed';
  const act = (change: 'done' | 'cancel' | 'reopen' | 'snooze', message: string) =>
    startTransition(async () => {
      const result = await updateReminderAction(id, change);
      if (result.ok) {
        toast.success(message, { description: title });
        router.refresh();
      } else toast.error(result.error);
    });

  return (
    <div className="flex shrink-0 gap-0.5">
      {open ? (
        <>
          <IconAction
            label={`Marcar como concluído: ${title}`}
            icon={Check}
            disabled={pending}
            onClick={() => act('done', 'Lembrete concluído')}
          />
          <IconAction
            label={`Adiar uma semana: ${title}`}
            icon={Clock3}
            disabled={pending}
            onClick={() => act('snooze', 'Lembrete adiado uma semana')}
          />
          <IconAction
            label={`Cancelar: ${title}`}
            icon={X}
            disabled={pending}
            onClick={() => act('cancel', 'Lembrete cancelado')}
          />
        </>
      ) : (
        <IconAction
          label={`Reabrir: ${title}`}
          icon={RotateCcw}
          disabled={pending}
          onClick={() => act('reopen', 'Lembrete reaberto')}
        />
      )}
    </div>
  );
}
