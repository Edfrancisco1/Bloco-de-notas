'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import type { Route } from 'next';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { type FieldPath, FormProvider, useForm } from 'react-hook-form';
import { buttonVariants, Button } from '@/components/ui/button';
import { updateInvestmentAction } from '@/lib/actions/investments';
import type { Investment } from '@/lib/domain/types';
import { formatMoney } from '@/lib/formatters/money';
import type { InvestmentFormOptions } from '@/lib/services/investment-detail';
import { type UpdateInvestmentInput, updateInvestmentSchema } from '@/lib/validations/schemas';
import { DetailFields, EssentialFields } from './investment-fieldsets';

function toFormValues(investment: Investment): UpdateInvestmentInput {
  const { details } = investment;
  const formDetails =
    details.kind === 'term_deposit'
      ? (() => {
          const { principal: _principal, ...rest } = details;
          return rest;
        })()
      : details;
  return {
    name: investment.name,
    type: investment.type,
    portfolioId: investment.portfolioId,
    institutionId: investment.institutionId,
    currency: investment.currency as UpdateInvestmentInput['currency'],
    symbol: investment.symbol,
    isin: investment.isin,
    startDate: investment.startDate,
    maturityDate: investment.maturityDate,
    tags: investment.tags,
    customFields: investment.customFields,
    notes: investment.notes,
    details: formDetails as UpdateInvestmentInput['details'],
  };
}

/** Edição dos dados do investimento. O tipo não muda; os valores mudam pelos movimentos. */
export function EditInvestmentForm({
  investment,
  options,
}: {
  investment: Investment;
  options: InvestmentFormOptions;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<UpdateInvestmentInput>({
    resolver: zodResolver(updateInvestmentSchema),
    defaultValues: toFormValues(investment),
    mode: 'onTouched',
  });
  const backHref = `/app/investimentos/${investment.id}` as Route;

  const submit = form.handleSubmit(() =>
    startTransition(async () => {
      setFormError(null);
      const result = await updateInvestmentAction(investment.id, form.getValues());
      if (result && !result.ok) {
        setFormError(result.error);
        for (const [path, message] of Object.entries(result.fieldErrors ?? {})) {
          form.setError(path as FieldPath<UpdateInvestmentInput>, { message });
        }
      }
    }),
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="mx-auto flex max-w-3xl flex-col gap-12">
        <section aria-labelledby="essencial-titulo">
          <h2
            id="essencial-titulo"
            className="border-b border-ink/80 pb-2.5 font-serif text-title text-ink"
          >
            O essencial
          </h2>
          <div className="mt-6">
            <EssentialFields type={investment.type} options={options} mode="edit" />
          </div>
          {investment.details.kind === 'term_deposit' ? (
            <p className="mt-4 text-[0.8125rem] text-ink-3">
              O capital ({formatMoney(investment.details.principal)}) vem do movimento inicial. Para
              o alterar, edite esse movimento no histórico.
            </p>
          ) : null}
        </section>
        <section aria-labelledby="detalhes-titulo">
          <h2
            id="detalhes-titulo"
            className="border-b border-ink/80 pb-2.5 font-serif text-title text-ink"
          >
            Detalhes
          </h2>
          <div className="mt-6">
            <DetailFields type={investment.type} options={options} mode="edit" />
          </div>
        </section>

        {formError ? (
          <p role="alert" className="rounded-md bg-negative-soft px-4 py-3 text-sm text-negative">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:justify-end">
          <Link href={backHref} className={buttonVariants({ variant: 'ghost' })}>
            Cancelar
          </Link>
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? 'A guardar…' : 'Guardar alterações'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
