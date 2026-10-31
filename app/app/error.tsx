'use client';

import { Button } from '@/components/ui/button';

/** Erro numa página da área autenticada: nunca finge sucesso e permite tentar de novo. */
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div role="alert" className="py-16">
      <p className="eyebrow">Algo correu mal</p>
      <h1 className="mt-3 font-serif text-display text-ink">
        Não foi possível mostrar esta página.
      </h1>
      <p className="mt-3 max-w-prose text-ink-2">
        Os seus dados não foram alterados. Tente novamente; se o problema continuar, volte mais
        tarde.
      </p>
      <Button className="mt-8" onClick={reset}>
        Tentar novamente
      </Button>
    </div>
  );
}
