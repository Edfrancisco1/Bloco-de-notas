'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check } from 'lucide-react';
import { useState, useTransition } from 'react';
import { type FieldPath, FormProvider, useForm, useWatch } from 'react-hook-form';
import { TypeMonogram } from '@/components/common/type-monogram';
import { Button } from '@/components/ui/button';
import { RadioCards } from '@/components/ui/choice';
import { createInvestmentAction } from '@/lib/actions/investments';
import { totalFromUnits } from '@/lib/calculations/preview';
import { summarizeTermDeposit } from '@/lib/calculations/term-deposit';
import {
  institutionKindLabel,
  interestMethodLabel,
  investmentTypeDescription,
  investmentTypeLabel,
  investmentTypeOrder,
  paymentFrequencyLabel,
} from '@/lib/domain/labels';
import type { DecimalString, InvestmentType } from '@/lib/domain/types';
import { formatDate } from '@/lib/formatters/dates';
import { formatMoney, formatQuantity, formatRate } from '@/lib/formatters/money';
import type { InvestmentFormOptions } from '@/lib/services/investment-detail';
import { cn } from '@/lib/utils';
import {
  type CreateInvestmentData,
  type CreateInvestmentInput,
  createInvestmentSchema,
} from '@/lib/validations/schemas';
import { TermDepositEstimate } from '../term-deposit-estimate';
import { UNIT_TYPES, defaultDetails, newInvestmentDefaults } from './defaults';
import { DetailFields, EssentialFields } from './investment-fieldsets';

type Values = CreateInvestmentInput;
const STEPS = ['Tipo', 'Essencial', 'Detalhes', 'Resumo'] as const;

const ESSENTIAL_KEYS = [
  'name',
  'portfolioId',
  'startDate',
  'institutionId',
  'newInstitution',
  'initial',
];

/** Passo onde vive um campo (para levar o utilizador ao primeiro erro devolvido pelo servidor). */
function stepOf(path: string, type: InvestmentType): number {
  const root = path.split('.')[0] ?? '';
  if (ESSENTIAL_KEYS.includes(root)) return 1;
  if (root === 'maturityDate') return type === 'term_deposit' || type === 'bond' ? 1 : 2;
  if (root === 'details') {
    const essentialDetails = [
      'annualRate',
      'interestMethod',
      'compoundingFrequency',
      'issuer',
      'nominalValue',
      'couponRate',
      'couponFrequency',
      'assetClass',
      'subtype',
      'platformOrProject',
      'expectedRate',
      'expectedExitDate',
    ];
    return essentialDetails.includes(path.split('.')[1] ?? '') ? 1 : 2;
  }
  return 2;
}

/**
 * Novo investimento (PLANO_MVP §8, jornadas A–C): tipo → essencial → detalhes opcionais →
 * resumo com estimativa transparente. Os campos são validados passo a passo no cliente e de
 * novo no servidor.
 */
export function NewInvestmentForm({
  options,
  initialType,
}: {
  options: InvestmentFormOptions;
  initialType: InvestmentType | null;
}) {
  const [step, setStep] = useState(initialType ? 1 : 0);
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const form = useForm<Values, unknown, CreateInvestmentData>({
    resolver: zodResolver(createInvestmentSchema),
    defaultValues: newInvestmentDefaults(initialType ?? 'term_deposit', options),
    mode: 'onTouched',
  });
  const type = useWatch({ control: form.control, name: 'type' });
  const units = UNIT_TYPES.has(type);

  function chooseType(next: InvestmentType) {
    if (next === form.getValues('type')) return;
    form.setValue('type', next);
    form.setValue('details', defaultDetails(next));
    form.setValue('initial', { amount: '', quantity: null, unitPrice: null, feeAmount: '0' });
    form.setValue('remindBeforeMaturity', next === 'term_deposit' || next === 'bond');
    form.clearErrors();
  }

  /** Nos tipos por unidades, o montante é quantidade × preço. */
  function syncUnitsAmount(): boolean {
    if (!UNIT_TYPES.has(form.getValues('type'))) return true;
    const { quantity, unitPrice } = form.getValues('initial');
    let ok = true;
    if (!quantity) {
      form.setError('initial.quantity', { message: 'Indique a quantidade.' });
      ok = false;
    }
    if (!unitPrice) {
      form.setError('initial.unitPrice', { message: 'Indique o preço unitário.' });
      ok = false;
    }
    form.setValue(
      'initial.amount',
      quantity && unitPrice
        ? totalFromUnits(quantity as DecimalString, unitPrice as DecimalString)
        : '',
    );
    return ok;
  }

  async function next() {
    setFormError(null);
    if (step === 1) {
      const unitsOk = syncUnitsAmount();
      const fields: FieldPath<Values>[] = [
        'name',
        'portfolioId',
        'startDate',
        'newInstitution',
        'details',
      ];
      if (!units) fields.push('initial.amount');
      if (type === 'term_deposit' || type === 'bond') fields.push('maturityDate');
      const valid = await form.trigger(fields, { shouldFocus: true });
      if (!valid || !unitsOk) return;
    }
    if (step === 2) {
      const valid = await form.trigger(
        ['details', 'maturityDate', 'currentValue', 'notes', 'tags', 'customFields'],
        {
          shouldFocus: true,
        },
      );
      if (!valid) return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function back() {
    setFormError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  const submit = form.handleSubmit(
    () => {
      setFormError(null);
      if (!syncUnitsAmount()) {
        setStep(1);
        return;
      }
      startTransition(async () => {
        // O servidor valida de novo os valores tal como foram escritos.
        const result = await createInvestmentAction(form.getValues());
        if (result && !result.ok) {
          setFormError(result.error);
          const entries = Object.entries(result.fieldErrors ?? {});
          for (const [path, message] of entries) {
            form.setError(path as FieldPath<Values>, { message });
          }
          if (entries[0]) setStep(stepOf(entries[0][0], type));
        }
      });
    },
    (errors) => {
      const first = Object.keys(errors)[0];
      if (first) setStep(stepOf(first, type));
    },
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={submit} noValidate className="mx-auto max-w-3xl">
        <Stepper step={step} onGo={(target) => target < step && setStep(target)} />

        <div className="mt-8">
          {step === 0 ? (
            <section aria-labelledby="passo-titulo">
              <h2 id="passo-titulo" className="font-serif text-display text-ink">
                Que investimento quer registar?
              </h2>
              <p className="mt-2 text-ink-2">Os campos seguintes adaptam-se ao tipo escolhido.</p>
              <div className="mt-8">
                <RadioCards
                  name="tipo"
                  legend="Tipo de investimento"
                  value={type}
                  onChange={chooseType}
                  options={investmentTypeOrder.map((t) => ({
                    value: t,
                    title: investmentTypeLabel[t],
                    description: investmentTypeDescription[t],
                    media: <TypeMonogram type={t} />,
                  }))}
                />
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <StepSection title="O essencial" description={investmentTypeLabel[type]}>
              <EssentialFields type={type} options={options} mode="create" />
            </StepSection>
          ) : null}

          {step === 2 ? (
            <StepSection title="Detalhes" description="Tudo opcional. Pode completar mais tarde.">
              <DetailFields type={type} options={options} mode="create" />
            </StepSection>
          ) : null}

          {step === 3 ? <Summary values={form.getValues()} options={options} /> : null}
        </div>

        {formError ? (
          <p
            role="alert"
            className="mt-6 rounded-md bg-negative-soft px-4 py-3 text-sm text-negative"
          >
            {formError}
          </p>
        ) : null}

        <div className="mt-10 flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <Button type="button" variant="ghost" onClick={back} className="self-start">
              <ArrowLeft aria-hidden strokeWidth={1.75} />
              Voltar
            </Button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button key="continuar" type="button" size="lg" onClick={next}>
              Continuar
            </Button>
          ) : (
            <Button key="guardar" type="submit" size="lg" disabled={pending}>
              {pending ? 'A guardar…' : 'Guardar investimento'}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}

function Stepper({ step, onGo }: { step: number; onGo: (step: number) => void }) {
  return (
    <ol aria-label="Passos" className="flex items-center gap-2 text-sm">
      {STEPS.map((label, index) => {
        const done = index < step;
        const current = index === step;
        return (
          <li key={label} className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => onGo(index)}
              disabled={!done}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'flex min-w-0 items-center gap-2 rounded-md py-1 disabled:cursor-default',
                done && 'text-ink-2 hover:text-ink',
                current && 'font-medium text-ink',
                !done && !current && 'text-ink-3',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs',
                  done && 'border-accent bg-accent text-paper-raised',
                  current && 'border-accent text-accent',
                  !done && !current && 'border-rule-strong',
                )}
              >
                {done ? <Check aria-hidden className="size-3.5" strokeWidth={2.5} /> : index + 1}
              </span>
              <span className={cn('truncate', !current && 'sr-only sm:not-sr-only')}>
                {label}
                {done ? <span className="sr-only"> (concluído)</span> : null}
              </span>
            </button>
            {index < STEPS.length - 1 ? <span aria-hidden className="h-px flex-1 bg-rule" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function StepSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby="passo-titulo">
      <h2 id="passo-titulo" className="font-serif text-display text-ink">
        {title}
      </h2>
      {description ? <p className="mt-2 text-ink-2">{description}</p> : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}

/** Resumo antes de guardar, com a estimativa transparente no caso dos depósitos. */
function Summary({ values, options }: { values: Values; options: InvestmentFormOptions }) {
  const type = values.type;
  const amount = values.initial.amount as DecimalString;
  const institution = values.newInstitution
    ? `${values.newInstitution.name} (nova, ${institutionKindLabel[values.newInstitution.kind].toLowerCase()})`
    : (options.institutions.find((i) => i.id === values.institutionId)?.name ?? 'Sem instituição');
  const portfolio = options.portfolios.find((p) => p.id === values.portfolioId)?.name ?? '—';

  const rows: [string, React.ReactNode][] = [
    ['Tipo', investmentTypeLabel[type]],
    ['Nome', values.name],
    ['Carteira', portfolio],
    ['Instituição', institution],
    ['Início', formatDate(values.startDate)],
  ];
  if (values.maturityDate) rows.push(['Vencimento', formatDate(values.maturityDate)]);
  if (UNIT_TYPES.has(type) && values.initial.quantity && values.initial.unitPrice) {
    rows.push([
      'Compra',
      `${formatQuantity(values.initial.quantity as DecimalString)} × ${formatMoney(values.initial.unitPrice as DecimalString)}`,
    ]);
  }
  rows.push([
    UNIT_TYPES.has(type) ? 'Montante investido' : 'Capital aplicado',
    formatMoney(amount),
  ]);
  if (values.initial.feeAmount && values.initial.feeAmount !== '0') {
    rows.push(['Comissão', formatMoney(values.initial.feeAmount as DecimalString)]);
  }

  let estimate = null;
  if (values.details.kind === 'term_deposit') {
    const d = values.details;
    rows.push(['Taxa anual', formatRate(d.annualRate as DecimalString)]);
    rows.push([
      'Juros',
      d.interestMethod === 'compound'
        ? `${interestMethodLabel.compound} ${paymentFrequencyLabel[d.compoundingFrequency].toLowerCase()}`
        : interestMethodLabel.simple,
    ]);
    if (values.maturityDate) {
      try {
        estimate = summarizeTermDeposit({
          principal: amount,
          annualRate: d.annualRate as DecimalString,
          startDate: values.startDate,
          maturityDate: values.maturityDate,
          interestMethod: d.interestMethod,
          compoundingFrequency:
            d.interestMethod === 'compound' ? d.compoundingFrequency : 'at_maturity',
          dayCountBasis: d.dayCountBasis,
          customDayCount: d.customDayCount ?? null,
          estimatedTaxRate: (d.estimatedTaxRate || null) as DecimalString | null,
        });
      } catch {
        estimate = null;
      }
    }
  }
  if (values.currentValue?.totalValue) {
    rows.push([
      'Valor atual',
      `${formatMoney(values.currentValue.totalValue as DecimalString)} em ${formatDate(values.currentValue.valuedOn)}`,
    ]);
  }
  if (values.remindBeforeMaturity && values.maturityDate) {
    rows.push(['Lembrete', '7 dias antes do vencimento']);
  }

  return (
    <section aria-labelledby="passo-titulo">
      <h2 id="passo-titulo" className="font-serif text-display text-ink">
        Confirme os dados
      </h2>
      <p className="mt-2 text-ink-2">
        Ao guardar, registamos o movimento inicial
        {values.currentValue ? ' e a primeira avaliação' : ''}. Tudo fica no histórico.
      </p>
      <dl className="mt-8 divide-y divide-rule border-y border-ink/80">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[9rem_minmax(0,1fr)] gap-4 py-3 sm:grid-cols-[12rem_minmax(0,1fr)]"
          >
            <dt className="text-sm text-ink-3">{label}</dt>
            <dd className="text-[0.9375rem] text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {estimate ? <TermDepositEstimate estimate={estimate} className="mt-8" /> : null}
    </section>
  );
}
