import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { DisplayAmount } from '@/components/common/amount';
import { TypeMonogram } from '@/components/common/type-monogram';
import { Wordmark } from '@/components/common/wordmark';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { enterDemoAction } from '@/lib/actions/session';
import type { DecimalString } from '@/lib/domain/types';
import { formatMoney } from '@/lib/formatters/money';

export const metadata: Metadata = {
  title: { absolute: 'InvestNote — o caderno dos seus investimentos' },
};

const ds = (v: string) => v as DecimalString;

const POINTS = [
  [
    'Tudo num só lugar',
    'Depósitos a prazo, Obrigações do Tesouro, ações, fundos, cripto, imóveis e o que mais tiver — em vários bancos e plataformas.',
  ],
  [
    'Cálculos que se explicam',
    'Capital investido, valor atual, resultado e rendimentos, cada um com a fórmula à vista. Estimativas sempre identificadas.',
  ],
  [
    'Prazos à vista',
    'Vencimentos e lembretes a 30, 7 e 1 dia. Saiba o que vence a seguir antes de o banco o avisar.',
  ],
] as const;

/** Pré-visualização estática do painel, com valores fictícios. */
function Preview() {
  return (
    <div
      aria-hidden
      className="rounded-lg border border-rule bg-paper-raised p-6 shadow-[0_1px_0_rgb(27_26_23/0.04),0_24px_48px_-24px_rgb(27_26_23/0.25)] sm:p-8"
    >
      <p className="eyebrow">Valor atual conhecido</p>
      <DisplayAmount
        value={ds('31135408.77')}
        className="mt-2 text-[clamp(2rem,1.6rem+1.6vw,3rem)]"
      />
      <dl className="mt-6 grid grid-cols-2 border-y border-ink/80 text-sm">
        <div className="py-3 pr-4">
          <dt className="eyebrow">Capital investido</dt>
          <dd className="mt-1 text-ink figures-table">{formatMoney(ds('29564666.67'))}</dd>
        </div>
        <div className="border-l border-rule py-3 pl-4">
          <dt className="eyebrow">Resultado</dt>
          <dd className="mt-1 text-positive figures-table">+{formatMoney(ds('4652637.81'))}</dd>
        </div>
      </dl>
      <ul className="mt-2 divide-y divide-rule text-sm">
        {(
          [
            ['term_deposit', 'Depósito a prazo 6 meses', '2630880', 'Vence dentro de 7 dias'],
            ['bond', 'Obrigações do Tesouro 2029', '3060000', null],
            ['crypto', 'Bitcoin', '2123000', null],
          ] as const
        ).map(([type, name, value, badge]) => (
          <li key={name} className="flex items-center gap-3 py-3">
            <TypeMonogram type={type} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-ink">{name}</span>
              {badge ? (
                <Badge tone="marker" className="mt-1">
                  {badge}
                </Badge>
              ) : null}
            </span>
            <span className="text-ink figures-table">{formatMoney(ds(value))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <nav aria-label="Conta" className="flex items-center gap-2">
          <Link href="/entrar" className={buttonVariants({ variant: 'ghost' })}>
            Entrar
          </Link>
          <Link href="/criar-conta" className={buttonVariants({ variant: 'secondary' })}>
            Criar conta
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 pt-10 pb-20 lg:grid-cols-12 lg:items-center lg:pt-16">
          <div className="lg:col-span-6">
            <p className="eyebrow">Para quem investe em kwanzas</p>
            <h1 className="mt-4 font-serif text-hero text-balance text-ink">
              Todos os seus investimentos, num só caderno.
            </h1>
            <p className="mt-6 max-w-xl text-[1.125rem] leading-relaxed text-ink-2">
              Veja quanto investiu, onde está o dinheiro, quanto vale, o que rendeu e os próximos
              prazos — mesmo com tudo espalhado por vários bancos e plataformas.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/criar-conta" className={buttonVariants({ size: 'lg' })}>
                Criar conta gratuita
              </Link>
              <form action={enterDemoAction}>
                <button
                  type="submit"
                  className={buttonVariants({
                    size: 'lg',
                    variant: 'ghost',
                    className: 'w-full sm:w-auto',
                  })}
                >
                  Ver a demonstração
                  <ArrowRight aria-hidden strokeWidth={1.75} />
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-6">
            <Preview />
            <p className="mt-3 text-center text-xs text-ink-3">Exemplo com valores fictícios.</p>
          </div>
        </section>

        <section aria-labelledby="porque" className="border-t border-rule">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 id="porque" className="sr-only">
              O que faz o InvestNote
            </h2>
            <ol className="grid gap-10 md:grid-cols-3">
              {POINTS.map(([title, text], index) => (
                <li key={title} className="border-t border-ink/80 pt-5">
                  <span className="figures-display text-[1.375rem] text-ink-3">{index + 1}</span>
                  <h3 className="mt-2 font-serif text-title text-ink">{title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-2">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-rule bg-paper-sunken/40">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <h2 className="font-serif text-title text-ink">Privado por defeito</h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-ink-2">
              Não ligamos a bancos, corretoras ou wallets e nunca pedimos credenciais. Os valores
              são os que regista, e só a sua conta os vê. Pode exportar tudo ou eliminar a conta
              quando quiser.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-xs leading-relaxed">
            O InvestNote organiza a informação fornecida pelo utilizador e não presta aconselhamento
            financeiro, fiscal ou jurídico.
          </p>
          <nav aria-label="Legal" className="flex gap-5">
            <Link href="/privacidade" className="hover:text-ink">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-ink">
              Termos
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
