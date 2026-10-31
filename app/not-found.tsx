import Link from 'next/link';
import { Wordmark } from '@/components/common/wordmark';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-16">
      <Wordmark />
      <p className="mt-12 eyebrow">Página não encontrada</p>
      <h1 className="mt-3 font-serif text-display text-ink">
        Esta página não existe — ou já não existe.
      </h1>
      <p className="mt-3 text-ink-2">
        Pode ter sido removida, ou o endereço pode ter um erro. Os seus dados estão onde os deixou.
      </p>
      <Link href="/app" className={buttonVariants({ className: 'mt-8 self-start' })}>
        Ir para o início
      </Link>
    </main>
  );
}
