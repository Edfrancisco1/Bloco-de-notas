'use client';

import { Archive, PencilLine } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Field, fieldA11y } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import {
  archiveInstitutionAction,
  archivePortfolioAction,
  saveInstitutionAction,
  savePortfolioAction,
} from '@/lib/actions/organize';
import type { ActionResult } from '@/lib/actions/result';
import { institutionKindLabel } from '@/lib/domain/labels';
import { INSTITUTION_KINDS, type InstitutionKind } from '@/lib/domain/types';

function FormFooter({ pending, label }: { pending: boolean; label: string }) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <DialogClose asChild>
        <Button type="button" variant="ghost">
          Cancelar
        </Button>
      </DialogClose>
      <Button type="submit" disabled={pending}>
        {pending ? 'A guardar…' : label}
      </Button>
    </div>
  );
}

function useSubmit(onDone: () => void, success: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      setFormError(null);
      const result = await action();
      if (result.ok) {
        toast.success(success);
        setErrors({});
        onDone();
        router.refresh();
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    });
  return { pending, errors, formError, run };
}

export function PortfolioDialog({
  portfolio,
  trigger,
}: {
  portfolio?: { id: string; name: string };
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(portfolio?.name ?? '');
  const { pending, errors, formError, run } = useSubmit(
    () => setOpen(false),
    portfolio ? 'Carteira renomeada' : 'Carteira criada',
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setName(portfolio?.name ?? '');
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={portfolio ? 'Renomear carteira' : 'Nova carteira'}
        description="Uma carteira agrupa investimentos (ex.: «Reforma», «Estudos dos filhos»)."
      >
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => savePortfolioAction(portfolio?.id ?? null, { name }));
          }}
        >
          <Field id="carteira-nome" label="Nome" error={errors.name}>
            <Input
              {...fieldA11y('carteira-nome', { error: errors.name })}
              value={name}
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </Field>
          {formError && !errors.name ? (
            <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
              {formError}
            </p>
          ) : null}
          <FormFooter pending={pending} label={portfolio ? 'Guardar' : 'Criar carteira'} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function InstitutionDialog({
  institution,
  trigger,
}: {
  institution?: { id: string; name: string; kind: InstitutionKind; notes: string | null };
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(institution?.name ?? '');
  const [kind, setKind] = useState<InstitutionKind>(institution?.kind ?? 'bank');
  const [notes, setNotes] = useState(institution?.notes ?? '');
  const { pending, errors, formError, run } = useSubmit(
    () => setOpen(false),
    institution ? 'Instituição atualizada' : 'Instituição criada',
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        title={institution ? 'Editar instituição' : 'Nova instituição'}
        description="Onde o investimento está registado. Nunca guardamos credenciais de acesso."
      >
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            run(() =>
              saveInstitutionAction(institution?.id ?? null, { name, kind, notes: notes || null }),
            );
          }}
        >
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <Field id="instituicao-nome" label="Nome" error={errors.name}>
              <Input
                {...fieldA11y('instituicao-nome', { error: errors.name })}
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                autoFocus
              />
            </Field>
            <Field id="instituicao-tipo" label="Tipo">
              <Select
                id="instituicao-tipo"
                value={kind}
                onChange={(event) => setKind(event.target.value as InstitutionKind)}
              >
                {INSTITUTION_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {institutionKindLabel[k]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field id="instituicao-notas" label="Notas" optional error={errors.notes}>
            <Textarea
              id="instituicao-notas"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Field>
          {formError && !errors.name ? (
            <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
              {formError}
            </p>
          ) : null}
          <FormFooter pending={pending} label={institution ? 'Guardar' : 'Criar instituição'} />
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Editar + arquivar, com confirmação (as regras de negócio ficam no servidor). */
export function OrganizeRowActions({
  kind,
  id,
  name,
  institution,
  archiveDisabledReason,
}: {
  kind: 'portfolio' | 'institution';
  id: string;
  name: string;
  /** Dados da instituição (para o diálogo de edição). */
  institution?: { kind: InstitutionKind; notes: string | null };
  archiveDisabledReason?: string | null;
}) {
  const router = useRouter();
  const label = kind === 'portfolio' ? 'carteira' : 'instituição';
  const editTrigger = (
    <Button variant="ghost" size="icon-sm" aria-label={`Editar ${label}: ${name}`} title="Editar">
      <PencilLine aria-hidden strokeWidth={1.75} />
    </Button>
  );
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      {kind === 'portfolio' ? (
        <PortfolioDialog portfolio={{ id, name }} trigger={editTrigger} />
      ) : (
        <InstitutionDialog
          institution={{
            id,
            name,
            kind: institution?.kind ?? 'other',
            notes: institution?.notes ?? null,
          }}
          trigger={editTrigger}
        />
      )}
      <ConfirmDialog
        tone="default"
        trigger={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Arquivar ${label}: ${name}`}
            title={archiveDisabledReason ?? 'Arquivar'}
            disabled={Boolean(archiveDisabledReason)}
          >
            <Archive aria-hidden strokeWidth={1.75} />
          </Button>
        }
        title={`Arquivar «${name}»?`}
        description={
          kind === 'portfolio'
            ? 'A carteira deixa de aparecer nos filtros. Os investimentos encerrados continuam no histórico.'
            : 'A instituição deixa de aparecer nas escolhas. Os investimentos que a usam continuam a mostrá-la.'
        }
        confirmLabel="Arquivar"
        onConfirm={async () => {
          const result =
            kind === 'portfolio'
              ? await archivePortfolioAction(id)
              : await archiveInstitutionAction(id);
          if (result.ok) {
            toast.success(`${kind === 'portfolio' ? 'Carteira' : 'Instituição'} arquivada`);
            router.refresh();
          }
          return result;
        }}
      />
    </div>
  );
}
