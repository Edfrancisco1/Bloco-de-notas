'use client';

import { ArrowRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { TypeMonogram } from '@/components/common/type-monogram';
import { Button } from '@/components/ui/button';
import { Field, fieldA11y } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { completeOnboardingAction } from '@/lib/actions/onboarding';
import {
  investmentTypeDescription,
  investmentTypeLabel,
  investmentTypeOrder,
} from '@/lib/domain/labels';
import { MARKET } from '@/lib/domain/market';

/**
 * Primeiro acesso (jornada A): 1) nome, moeda e fuso, carteira; 2) escolher o primeiro
 * investimento. Objetivo do plano: primeiro investimento registado em menos de 3 minutos.
 */
export function OnboardingFlow({
  initialName,
  timezones,
}: {
  initialName: string;
  timezones: string[];
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initialName);
  const [timezone, setTimezone] = useState<string>(MARKET.timezone);
  const [portfolioName, setPortfolioName] = useState('A minha carteira');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (step === 2) {
    return (
      <section aria-labelledby="passo-2">
        <p className="eyebrow">Passo 2 de 2</p>
        <h1 id="passo-2" className="mt-3 font-serif text-display text-ink">
          Que investimento quer registar primeiro{name ? `, ${name}` : ''}?
        </h1>
        <p className="mt-2 text-ink-2">
          A carteira «{portfolioName}» está criada. Escolha um tipo — os campos adaptam-se.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {investmentTypeOrder.map((type) => (
            <li key={type}>
              <Link
                href={`/app/investimentos/novo?tipo=${type}` as Route}
                className="group flex h-full gap-3.5 rounded-lg border border-rule bg-paper-raised p-4 transition-colors hover:border-rule-strong hover:bg-surface"
              >
                <TypeMonogram type={type} />
                <span className="min-w-0">
                  <span className="block font-medium text-ink">{investmentTypeLabel[type]}</span>
                  <span className="mt-1 block text-sm leading-snug text-ink-3">
                    {investmentTypeDescription[type]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/app"
          className="mt-8 inline-flex items-center gap-1.5 text-sm text-accent underline-offset-4 hover:underline"
        >
          Fazer isto mais tarde e ir para o painel
          <ArrowRight aria-hidden className="size-4" strokeWidth={1.75} />
        </Link>
      </section>
    );
  }

  return (
    <section aria-labelledby="passo-1">
      <p className="eyebrow">Passo 1 de 2</p>
      <h1 id="passo-1" className="mt-3 font-serif text-display text-ink">
        Bem-vindo ao InvestNote.
      </h1>
      <p className="mt-2 text-ink-2">Três escolhas rápidas e fica pronto a registar.</p>
      <form
        noValidate
        className="mt-8 flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          setFormError(null);
          startTransition(async () => {
            const result = await completeOnboardingAction({
              displayName: name,
              timezone,
              portfolioName,
            });
            if (result.ok) {
              setErrors({});
              setStep(2);
              window.scrollTo({ top: 0 });
            } else {
              setErrors(result.fieldErrors ?? {});
              setFormError(result.fieldErrors ? null : result.error);
            }
          });
        }}
      >
        <Field id="ob-nome" label="Como o devemos tratar?" error={errors.displayName}>
          <Input
            {...fieldA11y('ob-nome', { error: errors.displayName })}
            value={name}
            maxLength={60}
            autoComplete="given-name"
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Moeda base</span>
            <p className="flex h-11 items-center rounded-md border border-rule bg-paper-sunken px-3 text-ink">
              {MARKET.currencyName} (Kz)
            </p>
            <p className="text-[0.8125rem] text-ink-3">Outras moedas chegam numa fase seguinte.</p>
          </div>
          <Field id="ob-fuso" label="Fuso horário" error={errors.timezone}>
            <Select
              {...fieldA11y('ob-fuso', { error: errors.timezone })}
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {timezones.map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          id="ob-carteira"
          label="Nome da primeira carteira"
          hint="Pode criar outras mais tarde (ex.: «Reforma»)."
          error={errors.portfolioName}
        >
          <Input
            {...fieldA11y('ob-carteira', { hint: true, error: errors.portfolioName })}
            value={portfolioName}
            maxLength={60}
            onChange={(event) => setPortfolioName(event.target.value)}
          />
        </Field>
        {formError ? (
          <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
            {formError}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={pending} className="self-start">
          {pending ? 'A preparar…' : 'Continuar'}
        </Button>
      </form>
    </section>
  );
}
