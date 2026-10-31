'use client';

import { ArrowRight } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox, Segmented } from '@/components/ui/choice';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Field, fieldA11y } from '@/components/ui/field';
import { DateInput, Select, Textarea } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { createTransactionAction, updateTransactionAction } from '@/lib/actions/transactions';
import {
  type MetricsSummary,
  previewTransaction,
  totalFromUnits,
} from '@/lib/calculations/preview';
import { transactionTypeLabel } from '@/lib/domain/labels';
import type {
  AdjustmentDirection,
  DecimalString,
  InvestmentStatus,
  InvestmentType,
  IsoDate,
  Transaction,
  TransactionType,
  Valuation,
} from '@/lib/domain/types';
import { formatMoney, formatQuantity } from '@/lib/formatters/money';
import { type ParseFailure, parseFailureMessage } from '@/lib/formatters/parse';
import { transactionSchema } from '@/lib/validations/schemas';

const GROUPS: { label: string; types: TransactionType[] }[] = [
  { label: 'Entrada de capital', types: ['contribution'] },
  { label: 'Saída de capital', types: ['redemption', 'withdrawal'] },
  { label: 'Rendimento', types: ['interest', 'dividend'] },
  { label: 'Custo', types: ['fee', 'tax'] },
  { label: 'Correção', types: ['adjustment'] },
];

const UNIT_CAPABLE: TransactionType[] = [
  'initial',
  'contribution',
  'redemption',
  'withdrawal',
  'adjustment',
];

export interface TransactionContext {
  investmentId: string;
  investmentName: string;
  investmentType: InvestmentType;
  status: InvestmentStatus;
  startDate: IsoDate;
  today: IsoDate;
  usesUnits: boolean;
  transactions: Transaction[];
  latestValuation: Valuation | null;
}

export function TransactionDialog({
  context,
  existing,
  trigger,
  defaultOpen = false,
  onOpenChange,
}: {
  context: TransactionContext;
  existing?: Transaction;
  trigger?: React.ReactNode;
  /** Abrir já (ex.: a partir de um menu), sem botão próprio. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpenState] = useState(defaultOpen);
  const setOpen = (next: boolean) => {
    setOpenState(next);
    onOpenChange?.(next);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent
        title={existing ? 'Editar movimento' : 'Registar movimento'}
        description={context.investmentName}
      >
        {open ? (
          <TransactionForm context={context} existing={existing} onDone={() => setOpen(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function TransactionForm({
  context,
  existing,
  onDone,
}: {
  context: TransactionContext;
  existing?: Transaction;
  onDone: () => void;
}) {
  const [type, setType] = useState<TransactionType>(existing?.type ?? 'contribution');
  const [occurredOn, setOccurredOn] = useState<IsoDate>(existing?.occurredOn ?? context.today);
  const [amount, setAmount] = useState<string>(existing?.amount ?? '');
  const [quantity, setQuantity] = useState<string>(existing?.quantity ?? '');
  const [unitPrice, setUnitPrice] = useState<string>(existing?.unitPrice ?? '');
  const [fee, setFee] = useState<string>(existing?.feeAmount ?? '0');
  const [tax, setTax] = useState<string>(existing?.taxAmount ?? '0');
  const [capital, setCapital] = useState<string>(existing?.capitalComponent ?? '');
  const [reinvested, setReinvested] = useState<boolean>(existing?.isReinvested ?? false);
  const [direction, setDirection] = useState<AdjustmentDirection>(
    existing?.adjustmentDirection ?? 'increase',
  );
  const [notes, setNotes] = useState<string>(existing?.notes ?? '');
  const [parse, setParse] = useState<Record<string, ParseFailure | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isCost = type === 'fee' || type === 'tax';
  const isExit = type === 'redemption' || type === 'withdrawal';
  const isIncome = type === 'interest' || type === 'dividend';
  const byUnits = context.usesUnits && (UNIT_CAPABLE.includes(type) || (isIncome && reinvested));
  const computedAmount =
    byUnits && quantity && unitPrice
      ? totalFromUnits(quantity as DecimalString, unitPrice as DecimalString)
      : amount;

  const payload = {
    investmentId: context.investmentId,
    type,
    occurredOn,
    amount: computedAmount,
    quantity: byUnits ? quantity || null : null,
    unitPrice: byUnits ? unitPrice || null : null,
    feeAmount: isCost ? '0' : fee || '0',
    taxAmount: isCost ? '0' : tax || '0',
    capitalComponent: isExit ? capital || null : null,
    isReinvested: isIncome ? reinvested : false,
    adjustmentDirection: type === 'adjustment' ? direction : null,
    notes: notes.trim() || null,
  };

  let preview: { before: MetricsSummary; after: MetricsSummary } | null = null;
  const draft = transactionSchema.safeParse(payload);
  if (draft.success) {
    const { investmentId: _id, ...rest } = draft.data;
    preview = previewTransaction({
      status: context.status,
      transactions: context.transactions,
      latestValuation: context.latestValuation,
      replaceId: existing?.id ?? null,
      draft: { ...rest, currency: 'AOA' },
    });
  }

  const onParsed =
    (field: string, setter: (v: string) => void) =>
    (value: string, failure: ParseFailure | null) => {
      setter(value);
      setParse((p) => ({ ...p, [field]: failure === 'empty' ? null : failure }));
    };
  const errorFor = (field: string) => {
    const failure = parse[field];
    return failure ? parseFailureMessage[failure] : (errors[field] ?? null);
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    const parsed = transactionSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[issue.path.join('.')] ??= issue.message;
      if (byUnits && !quantity) next.quantity = 'Indique a quantidade.';
      if (byUnits && !unitPrice) next.unitPrice = 'Indique o preço unitário.';
      setErrors(next);
      return;
    }
    startTransition(async () => {
      const result = existing
        ? await updateTransactionAction(existing.id, payload)
        : await createTransactionAction(payload);
      if (result.ok) {
        toast.success(existing ? 'Movimento atualizado' : 'Movimento registado', {
          description: transactionTypeLabel[type],
        });
        onDone();
      } else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="mov-tipo" label="Tipo de movimento" error={errors.type}>
          {existing?.type === 'initial' ? (
            <p className="flex h-11 items-center text-ink">{transactionTypeLabel.initial}</p>
          ) : (
            <Select
              id="mov-tipo"
              value={type}
              onChange={(event) => {
                setType(event.target.value as TransactionType);
                setErrors({});
              }}
            >
              {GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.types.map((t) => (
                    <option key={t} value={t}>
                      {transactionTypeLabel[t]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          )}
        </Field>
        <Field id="mov-data" label="Data" error={errors.occurredOn}>
          <DateInput
            {...fieldA11y('mov-data', { error: errors.occurredOn })}
            value={occurredOn}
            min={context.startDate}
            max={context.today}
            onChange={(event) => setOccurredOn(event.target.value)}
          />
        </Field>
      </div>

      {type === 'adjustment' ? (
        <Segmented
          label="Efeito do ajuste"
          value={direction}
          onChange={setDirection}
          options={[
            { value: 'increase', label: 'Aumenta o capital' },
            { value: 'decrease', label: 'Diminui o capital' },
          ]}
        />
      ) : null}

      {byUnits ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="mov-quantidade" label="Quantidade" error={errorFor('quantity')}>
            <MoneyInput
              {...fieldA11y('mov-quantidade', { error: errorFor('quantity') })}
              mode="quantity"
              suffix=""
              value={quantity}
              onValueChange={onParsed('quantity', setQuantity)}
            />
          </Field>
          <Field id="mov-preco" label="Preço unitário" error={errorFor('unitPrice')}>
            <MoneyInput
              {...fieldA11y('mov-preco', { error: errorFor('unitPrice') })}
              value={unitPrice}
              onValueChange={onParsed('unitPrice', setUnitPrice)}
            />
          </Field>
          <p className="text-sm text-ink-2 sm:col-span-2" aria-live="polite">
            Valor do movimento:{' '}
            <span className="font-medium text-ink figures-table">
              {computedAmount ? formatMoney(computedAmount as DecimalString) : '—'}
            </span>
          </p>
        </div>
      ) : (
        <Field
          id="mov-valor"
          label={
            isCost
              ? 'Valor do custo'
              : isIncome
                ? 'Valor recebido'
                : isExit
                  ? 'Valor recebido'
                  : 'Valor'
          }
          error={errorFor('amount')}
        >
          <MoneyInput
            {...fieldA11y('mov-valor', { error: errorFor('amount') })}
            value={amount}
            onValueChange={onParsed('amount', setAmount)}
            autoFocus
          />
        </Field>
      )}

      {isIncome ? (
        <Checkbox
          label="Reinvestido no próprio investimento"
          hint="Conta como rendimento e como nova entrada de capital."
          checked={reinvested}
          onChange={(event) => setReinvested(event.target.checked)}
        />
      ) : null}

      {isExit ? (
        <Field
          id="mov-capital"
          label="Parte de capital"
          optional
          hint="Se o valor inclui juros ou ganhos, indique só o capital devolvido. Vazio: usamos o custo médio ou o capital investido."
          error={errorFor('capitalComponent')}
        >
          <MoneyInput
            {...fieldA11y('mov-capital', { hint: true, error: errorFor('capitalComponent') })}
            value={capital}
            onValueChange={onParsed('capitalComponent', setCapital)}
          />
        </Field>
      ) : null}

      {!isCost ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="mov-comissao" label="Comissão" error={errorFor('feeAmount')}>
            <MoneyInput
              {...fieldA11y('mov-comissao', { error: errorFor('feeAmount') })}
              value={fee}
              onValueChange={onParsed('feeAmount', setFee)}
            />
          </Field>
          <Field id="mov-imposto" label="Imposto" error={errorFor('taxAmount')}>
            <MoneyInput
              {...fieldA11y('mov-imposto', { error: errorFor('taxAmount') })}
              value={tax}
              onValueChange={onParsed('taxAmount', setTax)}
            />
          </Field>
        </div>
      ) : null}

      <Field id="mov-notas" label="Notas" optional>
        <Textarea
          id="mov-notas"
          rows={2}
          value={notes}
          maxLength={1000}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>

      <ImpactPreview preview={preview} showUnits={context.usesUnits} />

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
          {pending ? 'A guardar…' : existing ? 'Guardar alterações' : 'Registar movimento'}
        </Button>
      </div>
    </form>
  );
}

function ImpactRow({ label, before, after }: { label: string; before: string; after: string }) {
  const changed = before !== after;
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt className="text-ink-2">{label}</dt>
      <dd className="flex items-center gap-2 text-right figures-table">
        {changed ? (
          <>
            <span className="text-[0.8125rem] text-ink-3">{before}</span>
            <ArrowRight aria-label="passa a" className="size-3.5 text-ink-3" strokeWidth={1.75} />
            <span className="font-medium text-ink">{after}</span>
          </>
        ) : (
          <span className="text-ink-3">{after}</span>
        )}
      </dd>
    </div>
  );
}

function ImpactPreview({
  preview,
  showUnits,
}: {
  preview: { before: MetricsSummary; after: MetricsSummary } | null;
  showUnits: boolean;
}) {
  return (
    <div aria-live="polite" className="rounded-lg border border-rule bg-paper px-4 py-3.5">
      <p className="mb-2.5 eyebrow">Impacto</p>
      {preview ? (
        <dl className="grid gap-2 text-sm">
          <ImpactRow
            label="Capital líquido investido"
            before={formatMoney(preview.before.netInvested)}
            after={formatMoney(preview.after.netInvested)}
          />
          <ImpactRow
            label="Rendimentos"
            before={formatMoney(preview.before.income)}
            after={formatMoney(preview.after.income)}
          />
          <ImpactRow
            label="Custos"
            before={formatMoney(preview.before.costs)}
            after={formatMoney(preview.after.costs)}
          />
          {showUnits && (preview.before.quantity || preview.after.quantity) ? (
            <ImpactRow
              label="Quantidade"
              before={preview.before.quantity ? formatQuantity(preview.before.quantity) : '0'}
              after={preview.after.quantity ? formatQuantity(preview.after.quantity) : '0'}
            />
          ) : null}
        </dl>
      ) : (
        <p className="text-sm text-ink-3">Preencha o valor para ver o impacto nas métricas.</p>
      )}
    </div>
  );
}
