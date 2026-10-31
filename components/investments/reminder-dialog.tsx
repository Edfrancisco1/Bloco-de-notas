'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Field, fieldA11y } from '@/components/ui/field';
import { DateInput, Input, Select } from '@/components/ui/input';
import { createReminderAction } from '@/lib/actions/reminders';
import type { IsoDate } from '@/lib/domain/types';

/** Novo lembrete interno (notificações por e-mail ficam para P1). */
export function ReminderDialog({
  investmentId,
  investmentName,
  defaultTitle,
  defaultDate,
  today,
  trigger,
  investments,
}: {
  investmentId: string | null;
  /** Se indicado, permite escolher (ou não) o investimento. */
  investments?: { id: string; name: string }[];
  investmentName?: string;
  defaultTitle?: string;
  defaultDate: IsoDate;
  today: IsoDate;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle ?? '');
  const [dueOn, setDueOn] = useState(defaultDate);
  const [linkedId, setLinkedId] = useState<string | null>(investmentId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    startTransition(async () => {
      const result = await createReminderAction({ investmentId: linkedId, title, dueOn });
      if (result.ok) {
        toast.success('Lembrete criado', { description: title });
        setOpen(false);
        setTitle(defaultTitle ?? '');
        setDueOn(defaultDate);
        setErrors({});
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent title="Novo lembrete" description={investmentName}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <Field id="lembrete-titulo" label="O que lembrar" error={errors.title}>
            <Input
              {...fieldA11y('lembrete-titulo', { error: errors.title })}
              value={title}
              maxLength={120}
              placeholder="Ex.: Decidir a renovação"
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
            />
          </Field>
          {investments ? (
            <Field id="lembrete-investimento" label="Investimento" optional>
              <Select
                id="lembrete-investimento"
                value={linkedId ?? ''}
                onChange={(event) => setLinkedId(event.target.value || null)}
              >
                <option value="">Nenhum (lembrete geral)</option>
                {investments.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <Field id="lembrete-data" label="Data" error={errors.dueOn}>
            <DateInput
              {...fieldA11y('lembrete-data', { error: errors.dueOn })}
              value={dueOn}
              min={today}
              onChange={(event) => setDueOn(event.target.value)}
            />
          </Field>
          <p className="text-[0.8125rem] text-ink-3">
            O lembrete aparece em Prazos e no painel. Ainda não enviamos notificações por e-mail.
          </p>
          {formError ? (
            <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
              {formError}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? 'A guardar…' : 'Criar lembrete'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
