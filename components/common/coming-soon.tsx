import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from './section';

/** Página provisória para ecrãs das próximas etapas do Marco 1. */
export function ComingSoon({
  title,
  stage,
  children,
}: {
  title: string;
  stage: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader eyebrow="Em construção" title={title} description={children} />
      <p className="mt-8 border-t border-rule pt-6 text-sm text-ink-3">
        Este ecrã chega na {stage} do Marco 1. O painel inicial já está completo para revisão.
      </p>
      <Link
        href="/app"
        className="mt-4 inline-flex items-center gap-2 text-sm text-accent underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />
        Voltar ao início
      </Link>
    </div>
  );
}
