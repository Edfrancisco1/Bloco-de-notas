import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/auth/auth-forms';
import { Button } from '@/components/ui/button';
import { enterDemoAction } from '@/lib/actions/session';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Entrar' };

export default async function SignInPage({ searchParams }: PageProps<'/entrar'>) {
  if (await getSession()) redirect('/app');
  const { conta } = await searchParams;

  return (
    <>
      {conta === 'eliminada' ? (
        <p role="status" className="mb-8 rounded-md bg-paper-sunken px-4 py-3 text-sm text-ink-2">
          A conta e todos os dados foram eliminados.
        </p>
      ) : null}
      <h1 className="font-serif text-display text-ink">Entrar</h1>
      <p className="mt-2 text-ink-2">
        Ainda não tem conta?{' '}
        <Link
          href="/criar-conta"
          className="text-accent underline decoration-accent/40 underline-offset-4"
        >
          Criar conta
        </Link>
      </p>
      <div className="mt-8">
        <SignInForm />
      </div>
      <div className="my-8 flex items-center gap-4 text-sm text-ink-3">
        <span className="h-px flex-1 bg-rule" />
        ou
        <span className="h-px flex-1 bg-rule" />
      </div>
      <form action={enterDemoAction}>
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          Entrar em modo demonstração
        </Button>
      </form>
      <p className="mt-3 text-center text-[0.8125rem] text-ink-3">
        Uma carteira de exemplo em kwanzas, com valores fictícios.
      </p>
    </>
  );
}
