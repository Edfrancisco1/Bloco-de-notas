import { Plus } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

const steps = [
  ['Escolha o tipo', 'Depósito a prazo, obrigações, ações e fundos, cripto, imobiliário ou outro.'],
  ['Indique o essencial', 'Quanto aplicou, onde e em que data. Os detalhes podem vir depois.'],
  ['Acompanhe', 'Atualize o valor quando quiser e veja os prazos que se aproximam.'],
] as const;

/** Painel vazio: explica o benefício e leva à primeira ação útil (PLANO_MVP §15). */
export function EmptyDashboard() {
  return (
    <section
      aria-labelledby="vazio-titulo"
      className="mt-12 grid grid-cols-1 gap-12 lg:mt-16 lg:grid-cols-12"
    >
      <div className="lg:col-span-7">
        <p className="eyebrow">Primeiros passos</p>
        <h2 id="vazio-titulo" className="mt-3 font-serif text-display text-balance text-ink">
          O seu caderno de investimentos ainda está em branco.
        </h2>
        <p className="mt-4 max-w-xl text-[1.0625rem] leading-relaxed text-ink-2">
          Registe o primeiro investimento e veja aqui quanto aplicou, quanto vale hoje, o que já
          rendeu e os próximos prazos — mesmo que esteja espalhado por vários bancos e plataformas.
        </p>
        <Link
          href="/app/investimentos/novo"
          className={buttonVariants({ size: 'lg', className: 'mt-8' })}
        >
          <Plus aria-hidden strokeWidth={2} />
          Adicionar primeiro investimento
        </Link>
      </div>
      <ol className="border-t border-ink/80 lg:col-span-5 lg:mt-2">
        {steps.map(([title, text], index) => (
          <li key={title} className="flex gap-4 border-b border-rule py-5">
            <span className="w-6 shrink-0 figures-display text-[1.375rem] leading-none text-ink-3">
              {index + 1}
            </span>
            <span>
              <span className="block font-medium text-ink">{title}</span>
              <span className="mt-1 block text-sm leading-relaxed text-ink-2">{text}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
