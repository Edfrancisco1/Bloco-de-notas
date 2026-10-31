'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Delta } from '@/components/common/amount';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/choice';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Field, fieldA11y } from '@/components/ui/field';
import { DateInput } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { closeInvestmentAction } from '@/lib/actions/investments';
import { previewClosing, totalFromUnits } from '@/lib/calculations/preview';
import type { DecimalString } from '@/lib/domain/types';
import { formatMoney, formatQuantity } from '@/lib/formatters/money';
import { type ParseFailure, parseFailureMessage } from '@/lib/formatters/parse';
import type { TransactionContext } from './transaction-dialog';

/**
 * Encerrar (PLANO_MVP §8, jornada E): regista a venda/resgate final e marca como encerrado.
 * Mostra o resultado final antes de confirmar; o histórico fica preservado.
 */
export function CloseInvestmentDialog({
  context,
  netInvested,
  quantity,
  trigger,
  open,
  onOpenChange,
}: {
  context: TransactionContext;
  netInvested: DecimalString;
  quantity: DecimalString | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent title="Encerrar investimento" description={context.investmentName}>
        {isOpen ? (
          <CloseForm
            context={context}
            netInvested={netInvested}
            quantity={quantity}
            onDone={() => setOpen(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function CloseForm({
  context,
  netInvested,
  quantity: heldQuantity,
  onDone,
}: {
  context: TransactionContext;
  netInvested: DecimalString;
  quantity: DecimalString | null;
  onDone: () => void;
}) {
  const byUnits = context.usesUnits && heldQuantity !== null;
  const [closedOn, setClosedOn] = useState(context.today);
  const [withFinal, setWithFinal] = useState(true);
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState<string>(heldQuantity ?? '');
  const [unitPrice, setUnitPrice] = useState('');
  const [fee, setFee] = useState('0');
  const [tax, setTax] = useState('0');
  const [capital, setCapital] = useState<string>(byUnits ? '' : netInvested);
  const [parse, setParse] = useState<Record<string, ParseFailure | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const received =
    byUnits && quantity && unitPrice
      ? totalFromUnits(quantity as DecimalString, unitPrice as DecimalString)
      : amount;

  const draft = {
    type: 'redemption' as const,
    occurredOn: closedOn,
    currency: 'AOA',
    amount: received as DecimalString,
    quantity: byUnits && quantity ? (quantity as DecimalString) : null,
    unitPrice: byUnits && unitPrice ? (unitPrice as DecimalString) : null,
    feeAmount: (fee || '0') as DecimalString,
    taxAmount: (tax || '0') as DecimalString,
    capitalComponent: capital ? (capital as DecimalString) : null,
    isReinvested: false,
    adjustmentDirection: null,
    notes: null,
  };
  const preview = !withFinal
    ? previewClosing({ transactions: context.transactions, draft: null })
    : received
      ? previewClosing({ transactions: context.transactions, draft })
      : null;

  const onParsed =
    (field: string, setter: (v: string) => void) =>
    (value: string, failure: ParseFailure | null) => {
      setter(value);
      setParse((p) => ({ ...p, [field]: failure === 'empty' ? null : failure }));
    };
  const errorFor = (field: string) => {
    const failure = parse[field];
    return failure
      ? parseFailureMessage[failure]
      : (errors[`final.${field}`] ?? errors[field] ?? null);
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (withFinal && !received) {
      setErrors(
        byUnits
          ? { unitPrice: 'Indique o preço de venda.' }
          : { amount: 'Indique o valor recebido.' },
      );
      return;
    }
    startTransition(async () => {
      const result = await closeInvestmentAction({
        investmentId: context.investmentId,
        closedOn,
        final: withFinal
          ? {
              amount: received,
              quantity: byUnits ? quantity || null : null,
              unitPrice: byUnits ? unitPrice || null : null,
              feeAmount: fee || '0',
              taxAmount: tax || '0',
              capitalComponent: capital || null,
              notes: null,
            }
          : null,
      });
      if (result.ok) {
        toast.success('Investimento encerrado', { description: context.investmentName });
        onDone();
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field id="enc-data" label="Data de encerramento" error={errors.closedOn}>
        <DateInput
          {...fieldA11y('enc-data', { error: errors.closedOn })}
          value={closedOn}
          min={context.startDate}
          max={context.today}
          onChange={(event) => setClosedOn(event.target.value)}
        />
      </Field>

      <Checkbox
        label="Registar agora a venda ou o resgate final"
        hint="Desmarque se já registou esse movimento."
        checked={withFinal}
        onChange={(event) => setWithFinal(event.target.checked)}
      />

      {withFinal ? (
        <>
          {byUnits ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="enc-quantidade"
                label="Quantidade vendida"
                hint={heldQuantity ? `Em carteira: ${formatQuantity(heldQuantity)}` : undefined}
                error={errorFor('quantity')}
              >
                <MoneyInput
                  {...fieldA11y('enc-quantidade', { hint: true, error: errorFor('quantity') })}
                  mode="quantity"
                  suffix=""
                  value={quantity}
                  onValueChange={onParsed('quantity', setQuantity)}
                />
              </Field>
              <Field id="enc-preco" label="Preço de venda" error={errorFor('unitPrice')}>
                <MoneyInput
                  {...fieldA11y('enc-preco', { error: errorFor('unitPrice') })}
                  value={unitPrice}
                  onValueChange={onParsed('unitPrice', setUnitPrice)}
                  autoFocus
                />
              </Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="enc-valor" label="Valor recebido" error={errorFor('amount')}>
                <MoneyInput
                  {...fieldA11y('enc-valor', { error: errorFor('amount') })}
                  value={amount}
                  onValueChange={onParsed('amount', setAmount)}
                  autoFocus
                />
              </Field>
              <Field
                id="enc-capital"
                label="Parte de capital"
                hint="O resto conta como ganho."
                error={errorFor('capitalComponent')}
              >
                <MoneyInput
                  {...fieldA11y('enc-capital', { hint: true, error: errorFor('capitalComponent') })}
                  value={capital}
                  onValueChange={onParsed('capitalComponent', setCapital)}
                />
              </Field>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="enc-comissao" label="Comissão" error={errorFor('feeAmount')}>
              <MoneyInput
                {...fieldA11y('enc-comissao', { error: errorFor('feeAmount') })}
                value={fee}
                onValueChange={onParsed('feeAmount', setFee)}
              />
            </Field>
            <Field id="enc-imposto" label="Imposto" error={errorFor('taxAmount')}>
              <MoneyInput
                {...fieldA11y('enc-imposto', { error: errorFor('taxAmount') })}
                value={tax}
                onValueChange={onParsed('taxAmount', setTax)}
              />
            </Field>
          </div>
        </>
      ) : null}

      <div aria-live="polite" className="rounded-lg border border-rule bg-paper px-4 py-3.5">
        <p className="mb-2 eyebrow">Resultado final</p>
        {preview?.result ? (
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Delta value={preview.result} className="text-[1.0625rem] font-medium" />
            {byUnits && withFinal && received ? (
              <span className="text-sm text-ink-3">
                Recebido {formatMoney(received as DecimalString)}
              </span>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-ink-3">Indique o valor recebido para ver o resultado final.</p>
        )}
        <p className="mt-2 text-[0.8125rem] text-ink-3">
          O histórico e as métricas ficam guardados. Pode reabrir o investimento mais tarde.
        </p>
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
          {pending ? 'A encerrar…' : 'Encerrar investimento'}
        </Button>
      </div>
    </form>
  );
}
