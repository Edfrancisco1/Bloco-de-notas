import type { Metadata } from 'next';
import { NewPasswordForm } from '@/components/auth/auth-forms';

export const metadata: Metadata = { title: 'Nova palavra-passe' };

/** Destino da ligação de recuperação (com o Supabase, via /auth/confirm?type=recovery). */
export default function NewPasswordPage() {
  return (
    <>
      <h1 className="font-serif text-display text-ink">Nova palavra-passe</h1>
      <p className="mt-2 text-ink-2">Escolha uma palavra-passe nova para a sua conta.</p>
      <div className="mt-8">
        <NewPasswordForm />
      </div>
    </>
  );
}
