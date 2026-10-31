'use client';

import { AlertDialog as Primitive } from 'radix-ui';
import { useState, useTransition } from 'react';
import type { ActionResult } from '@/lib/actions/result';
import { cn } from '@/lib/utils';
import { buttonVariants } from './button';

/**
 * Confirmação de ações destrutivas ou importantes (PLANO_MVP §15): diz o nome do item e as
 * consequências, mostra o erro sem fechar e nunca finge sucesso.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  pendingLabel = 'Um momento…',
  tone = 'danger',
  onConfirm,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel: string;
  pendingLabel?: string;
  tone?: 'danger' | 'default';
  onConfirm: () => Promise<ActionResult | void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Primitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        setOpen(next);
      }}
    >
      {trigger ? <Primitive.Trigger asChild>{trigger}</Primitive.Trigger> : null}
      <Primitive.Portal>
        <Primitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-ink/30 backdrop-blur-[1px]" />
        <Primitive.Content
          className={cn(
            'dialog-content fixed z-50 flex w-full flex-col gap-5 bg-paper-raised p-6 shadow-overlay outline-none',
            'inset-x-0 bottom-0 rounded-t-lg pb-[max(1.5rem,env(safe-area-inset-bottom))]',
            'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg',
          )}
        >
          <div>
            <Primitive.Title className="font-serif text-title text-ink">{title}</Primitive.Title>
            <Primitive.Description asChild>
              <div className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{description}</div>
            </Primitive.Description>
          </div>
          {error ? (
            <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Primitive.Cancel className={buttonVariants({ variant: 'ghost' })}>
              Cancelar
            </Primitive.Cancel>
            <button
              type="button"
              disabled={pending}
              className={buttonVariants({ variant: tone === 'danger' ? 'danger' : 'primary' })}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await onConfirm();
                  if (result && !result.ok) setError(result.error);
                  else setOpen(false);
                })
              }
            >
              {pending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
