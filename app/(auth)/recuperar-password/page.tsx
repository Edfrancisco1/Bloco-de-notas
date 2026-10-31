import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetRequestForm } from '@/components/auth/auth-forms';

export const metadata: Metadata = { title: 'Recuperar palavra-passe' };

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="font-serif text-display text-ink">Recuperar palavra-passe</h1>
      <p className="mt-2 text-ink-2">
        Indique o e-mail da conta. Enviamos uma ligação para definir uma nova palavra-passe.
      </p>
      <div className="mt-8">
        <ResetRequestForm />
      </div>
      <p className="mt-8 text-sm">
        <Link href="/entrar" className="text-accent underline-offset-4 hover:underline">
          Voltar a entrar
        </Link>
      </p>
    </>
  );
}
