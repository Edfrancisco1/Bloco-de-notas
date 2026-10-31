'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/choice';
import { Field, fieldA11y } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  type AuthFormState,
  requestPasswordResetAction,
  setNewPasswordAction,
  signInAction,
  signUpAction,
} from '@/lib/actions/auth';

const initial: AuthFormState = { error: null, fieldErrors: {}, email: '' };

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-negative-soft px-3 py-2.5 text-sm text-negative">
      {message}
    </p>
  );
}

/** Palavra-passe com "mostrar/esconder" (útil no telemóvel). */
function PasswordField({
  id,
  name,
  label,
  error,
  hint,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  error?: string | null;
  hint?: string;
  autoComplete: 'current-password' | 'new-password';
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <Input
          {...fieldA11y(id, { error, hint: !!hint })}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="pr-20"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-ink-2 hover:bg-paper-sunken"
          aria-label={visible ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}
        >
          {visible ? 'Esconder' : 'Mostrar'}
        </button>
      </div>
    </Field>
  );
}

function EmailField({ state, autoFocus }: { state: AuthFormState; autoFocus?: boolean }) {
  const error = state.fieldErrors.email;
  return (
    <Field id="email" label="E-mail" error={error}>
      <Input
        {...fieldA11y('email', { error })}
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        defaultValue={state.email}
        autoFocus={autoFocus}
        required
      />
    </Field>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, initial);
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <EmailField state={state} autoFocus />
      <PasswordField
        id="password"
        name="password"
        label="Palavra-passe"
        autoComplete="current-password"
        error={state.fieldErrors.password}
      />
      <div className="-mt-2 text-right">
        <Link
          href="/recuperar-password"
          className="text-sm text-accent underline-offset-4 hover:underline"
        >
          Esqueceu-se da palavra-passe?
        </Link>
      </div>
      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'A entrar…' : 'Entrar'}
      </Button>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <EmailField state={state} autoFocus />
      <PasswordField
        id="password"
        name="password"
        label="Palavra-passe"
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres. Uma frase longa é mais segura e fácil de lembrar."
        error={state.fieldErrors.password}
      />
      <div>
        <Checkbox
          name="termos"
          label={
            <>
              Li e aceito os{' '}
              <Link
                href="/termos"
                className="text-accent underline underline-offset-4"
                target="_blank"
              >
                termos
              </Link>{' '}
              e a{' '}
              <Link
                href="/privacidade"
                className="text-accent underline underline-offset-4"
                target="_blank"
              >
                política de privacidade
              </Link>
              .
            </>
          }
          aria-invalid={state.fieldErrors.termos ? true : undefined}
          aria-describedby={state.fieldErrors.termos ? 'termos-erro' : undefined}
        />
        {state.fieldErrors.termos ? (
          <p
            id="termos-erro"
            role="alert"
            className="mt-1.5 text-[0.8125rem] font-medium text-negative"
          >
            {state.fieldErrors.termos}
          </p>
        ) : null}
      </div>
      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'A criar…' : 'Criar conta'}
      </Button>
    </form>
  );
}

export function ResetRequestForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initial);
  if (state.done) {
    return (
      <div role="status" className="rounded-lg border border-rule bg-paper-raised p-5">
        <p className="font-medium text-ink">Verifique o seu e-mail.</p>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
          Se existir uma conta com <strong className="font-medium">{state.email}</strong>, enviámos
          as instruções para definir uma nova palavra-passe. A ligação é válida durante pouco tempo.
        </p>
        <p className="mt-3 text-sm text-ink-3">
          Modo demonstração: nenhum e-mail é enviado de facto.
        </p>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <EmailField state={state} autoFocus />
      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'A enviar…' : 'Enviar instruções'}
      </Button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(setNewPasswordAction, initial);
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <PasswordField
        id="password"
        name="password"
        label="Nova palavra-passe"
        autoComplete="new-password"
        hint="Pelo menos 8 caracteres."
        error={state.fieldErrors.password}
      />
      <PasswordField
        id="confirm"
        name="confirm"
        label="Repita a palavra-passe"
        autoComplete="new-password"
        error={state.fieldErrors.confirm}
      />
      <FormError message={state.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'A guardar…' : 'Guardar palavra-passe'}
      </Button>
    </form>
  );
}
