import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignUpForm } from '@/components/auth/auth-forms';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Criar conta' };

export default async function SignUpPage() {
  if (await getSession()) redirect('/app');
  return (
    <>
      <h1 className="font-serif text-display text-ink">Criar conta</h1>
      <p className="mt-2 text-ink-2">
        Já tem conta?{' '}
        <Link
          href="/entrar"
          className="text-accent underline decoration-accent/40 underline-offset-4"
        >
          Entrar
        </Link>
      </p>
      <div className="mt-8">
        <SignUpForm />
      </div>
      <p className="mt-6 text-[0.8125rem] leading-relaxed text-ink-3">
        Gratuito durante a fase de testes. Modo demonstração: a conta fica só na memória do servidor
        e não enviamos e-mail de confirmação.
      </p>
    </>
  );
}
