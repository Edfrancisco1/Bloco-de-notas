'use client';

import { ArrowRight } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Amount, Delta } from '@/components/common/amount';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Field, fieldA11y } from '@/components/ui/field';
import { DateInput } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { createValuationAction } from '@/lib/actions/valuations';
import { previewValuation, totalFromUnits } from '@/lib/calculations/preview';
import type { DecimalString, IsoDate } from '@/lib/domain/types';
import { formatDate } from '@/lib/formatters/dates';
import { formatQuantity } from '@/lib/formatters/money';
import { type ParseFailure, parseFailureMessage } from '@/lib/formatters/parse';
import type { ValuationTarget } from '@/lib/services/views';
import { cn } from '@/lib/utils';

type Mode = 'total' | 'units';

export function ValuationDialog({
  target,
  today,
  trigger,
}: {
  target: ValuationTarget;
  today: IsoDate;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="secondary" size="sm">
            Atualizar valor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent title="Atualizar valor" description={target.name}>
        {open ? (
          <ValuationForm target={target} today={today} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ValuationForm({
  target,
  today,
  onDone,
}: {
  target: ValuationTarget;
  today: IsoDate;
  onDone: () => void;
}) {
  const hasUnits = target.quantity !== null;
  const [mode, setMode] = useState<Mode>(hasUnits && target.lastUnitPrice ? 'units' : 'total');
  const [valuedOn, setValuedOn] = useState<IsoDate>(today);
  const [total, setTotal] = useState('');
  const [quantity, setQuantity] = useState<string>(target.quantity ?? '');
  const [unitPrice, setUnitPrice] = useState('');
  const [parseErrors, setParseErrors] = useState<Record<string, ParseFailure | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const computedTotal =
    mode === 'units' && quantity && unitPrice
      ? totalFromUnits(quantity as DecimalString, unitPrice as DecimalString)
      : mode === 'total' && total
        ? (total as DecimalString)
        : null;
  const preview = computedTotal ? previewValuation(target, computedTotal) : null;

  const onParsed =
    (field: string, setter: (v: string) => void) =>
    (value: string, failure: ParseFailure | null) => {
      setter(value);
      setParseErrors((prev) => ({ ...prev, [field]: failure === 'empty' ? null : failure }));
    };

  const errorFor = (field: string) => {
    const parse = parseErrors[field];
    return parse ? parseFailureMessage[parse] : (errors[field] ?? null);
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!computedTotal) {
      setErrors({ [mode === 'units' ? 'unitPrice' : 'totalValue']: 'Indique o novo valor.' });
      return;
    }
    startTransition(async () => {
      const result = await createValuationAction({
        investmentId: target.investmentId,
        valuedOn,
        totalValue: computedTotal,
        quantity: mode === 'units' ? quantity || null : null,
        unitPrice: mode === 'units' ? unitPrice || null : null,
        notes: null,
      });
      if (result.ok) {
        toast.success('Valor atualizado', { description: target.name });
        onDone();
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      {target.lastValue ? (
        <p className="text-sm text-ink-3">
          Último valor registado: <Amount value={target.lastValue} className="text-ink-2" />
          {target.lastValuedOn ? <> · {formatDate(target.lastValuedOn)}</> : null}
        </p>
      ) : (
        <p className="text-sm text-ink-3">
          Ainda não há nenhum valor registado para este investimento.
        </p>
      )}

      <Field id="valuedOn" label="Data da avaliação" error={errors.valuedOn}>
        <DateInput
          {...fieldA11y('valuedOn', { error: errors.valuedOn })}
          value={valuedOn}
          max={today}
          min={target.startDate}
          onChange={(event) => setValuedOn(event.target.value)}
          required
        />
      </Field>

      {hasUnits ? (
        <div
          role="radiogroup"
          aria-label="Como indicar o valor"
          className="grid grid-cols-2 rounded-md bg-paper-sunken p-1 text-sm"
        >
          {(
            [
              ['units', 'Quantidade × preço'],
              ['total', 'Valor total'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'rounded-[5px] px-3 py-1.5 transition-colors',
                mode === value
                  ? 'bg-surface font-medium text-ink shadow-sm'
                  : 'text-ink-2 hover:text-ink',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {mode === 'units' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="quantity"
            label="Quantidade"
            hint={
              target.quantity
                ? `Em carteira: ${formatQuantity(target.quantity as DecimalString)}`
                : undefined
            }
            error={errorFor('quantity')}
          >
            <MoneyInput
              {...fieldA11y('quantity', { hint: !!target.quantity, error: errorFor('quantity') })}
              mode="quantity"
              value={quantity}
              onValueChange={onParsed('quantity', setQuantity)}
            />
          </Field>
          <Field id="unitPrice" label="Preço unitário" error={errorFor('unitPrice')}>
            <MoneyInput
              {...fieldA11y('unitPrice', { error: errorFor('unitPrice') })}
              value={unitPrice}
              onValueChange={onParsed('unitPrice', setUnitPrice)}
              autoFocus
            />
          </Field>
        </div>
      ) : (
        <Field id="totalValue" label="Valor total atual" error={errorFor('totalValue')}>
          <MoneyInput
            {...fieldA11y('totalValue', { error: errorFor('totalValue') })}
            value={total}
            onValueChange={onParsed('totalValue', setTotal)}
            autoFocus
          />
        </Field>
      )}

      <div aria-live="polite" className="rounded-lg border border-rule bg-paper px-4 py-3.5">
        <p className="mb-2.5 eyebrow">Pré-visualização</p>
        {preview && computedTotal ? (
          <dl className="grid gap-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-2">Novo valor</dt>
              <dd className="flex flex-wrap items-baseline justify-end gap-x-2 text-right">
                <Amount value={computedTotal} className="font-medium text-ink" />
                {preview.change ? (
                  <Delta value={preview.change} showIcon={false} className="text-[0.8125rem]" />
                ) : null}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-2">Resultado indicativo</dt>
              <dd className="flex flex-wrap items-center justify-end gap-x-2 text-right">
                {preview.previousResult ? (
                  <>
                    <Amount
                      value={preview.previousResult}
                      sign="always"
                      className="text-[0.8125rem] text-ink-3"
                    />
                    <ArrowRight
                      aria-label="passa a"
                      className="size-3.5 text-ink-3"
                      strokeWidth={1.75}
                    />
                  </>
                ) : null}
                <Delta value={preview.result} percent={preview.simpleReturn} />
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-ink-3">
            Indique o novo valor para ver o impacto no resultado.
          </p>
        )}
      </div>

      {formError ? (
        <p role="alert" className="rounded-md bg-negative-soft px-3 py-2 text-sm text-negative">
          {formError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? 'A guardar…' : 'Guardar avaliação'}
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-ink-3">
        As avaliações anteriores ficam no histórico. Nada é apagado.
      </p>
    </form>
  );
}
