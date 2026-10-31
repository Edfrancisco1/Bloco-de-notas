'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Field, fieldA11y } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { deleteAccountAction, updateProfileAction } from '@/lib/actions/profile';

export function ProfileForm({
  displayName,
  timezone,
  suggested,
  all,
}: {
  displayName: string;
  timezone: string;
  suggested: string[];
  all: string[];
}) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [zone, setZone] = useState(timezone);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const others = all.filter((z) => !suggested.includes(z));

  return (
    <form
      noValidate
      className="flex flex-col gap-5 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await updateProfileAction({ displayName: name, timezone: zone });
          if (result.ok) {
            setErrors({});
            toast.success('Perfil atualizado');
            router.refresh();
          } else {
            setErrors(result.fieldErrors ?? { _: result.error });
          }
        });
      }}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="perfil-nome" label="Nome" error={errors.displayName}>
          <Input
            {...fieldA11y('perfil-nome', { error: errors.displayName })}
            value={name}
            maxLength={60}
            autoComplete="given-name"
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field
          id="perfil-fuso"
          label="Fuso horário"
          hint="Define o que é «hoje» nos prazos e nas avaliações."
          error={errors.timezone}
        >
          <Select
            {...fieldA11y('perfil-fuso', { hint: true, error: errors.timezone })}
            value={zone}
            onChange={(event) => setZone(event.target.value)}
          >
            <optgroup label="Sugeridos">
              {suggested.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, ' ')}
                </option>
              ))}
            </optgroup>
            <optgroup label="Todos">
              {others.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, ' ')}
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>
      </div>
      {errors._ ? (
        <p role="alert" className="text-sm text-negative">
          {errors._}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? 'A guardar…' : 'Guardar perfil'}
      </Button>
    </form>
  );
}

/**
 * Eliminar a conta: modal com as consequências e confirmação escrita. Com o Supabase passa a
 * exigir reautenticação (PLANO_MVP §15).
 */
export function DeleteAccount({ isDemo }: { isDemo: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmed = text.trim().toLocaleLowerCase('pt') === 'eliminar';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setText('');
          setError(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="danger">Eliminar conta…</Button>
      </DialogTrigger>
      <DialogContent title="Eliminar a conta?" description="Esta ação não pode ser desfeita.">
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await deleteAccountAction(text);
              if (result && !result.ok) setError(result.error);
            });
          }}
        >
          <div className="text-[0.9375rem] leading-relaxed text-ink-2">
            <p>
              Elimina permanentemente o perfil, as carteiras, as instituições, todos os
              investimentos, movimentos, avaliações e lembretes.
            </p>
            <p className="mt-2">Antes de continuar, considere exportar os seus dados.</p>
            {isDemo ? (
              <p className="mt-2 text-sm text-ink-3">
                Modo demonstração: a conta de exemplo é recriada da próxima vez que entrar.
              </p>
            ) : null}
          </div>
          <Field id="confirmar-eliminar" label="Escreva «eliminar» para confirmar" error={error}>
            <Input
              {...fieldA11y('confirmar-eliminar', { error })}
              value={text}
              autoComplete="off"
              onChange={(event) => setText(event.target.value)}
            />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="danger" disabled={!confirmed || pending}>
              {pending ? 'A eliminar…' : 'Eliminar definitivamente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
