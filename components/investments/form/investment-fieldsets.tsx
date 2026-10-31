'use client';

import { useController, useFormContext, useWatch } from 'react-hook-form';
import { Checkbox, Segmented } from '@/components/ui/choice';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { totalFromUnits } from '@/lib/calculations/preview';
import {
  alternativeSubtypeLabel,
  dayCountBasisLabel,
  institutionKindLabel,
  interestMethodLabel,
  paymentFrequencyLabel,
  rateTypeLabel,
  securityAssetClassLabel,
} from '@/lib/domain/labels';
import {
  ALTERNATIVE_SUBTYPES,
  DAY_COUNT_BASES,
  INSTITUTION_KINDS,
  INTEREST_METHODS,
  PAYMENT_FREQUENCIES,
  RATE_TYPES,
  SECURITY_ASSET_CLASSES,
  type DecimalString,
  type InvestmentType,
} from '@/lib/domain/types';
import { formatMoney } from '@/lib/formatters/money';
import type { InvestmentFormOptions } from '@/lib/services/investment-detail';
import type { CreateInvestmentInput } from '@/lib/validations/schemas';
import { UNIT_TYPES } from './defaults';
import {
  CustomFieldsEditor,
  DateField,
  MoneyField,
  NotesField,
  SelectField,
  TagsField,
  TextField,
} from './form-fields';

type Values = CreateInvestmentInput;
type Mode = 'create' | 'edit';

const NEW_INSTITUTION = '__nova__';
const COMPOUND_FREQUENCIES = PAYMENT_FREQUENCIES.filter((f) => f !== 'at_maturity');

function SegmentedField({
  name,
  label,
  options,
}: {
  name: 'details.interestMethod' | 'details.rateType' | 'details.assetClass' | 'details.subtype';
  label: string;
  options: readonly { value: string; label: string }[];
}) {
  const { control } = useFormContext<Values>();
  const { field } = useController({ control, name });
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <Segmented
        label={label}
        value={field.value as string}
        options={options}
        onChange={(value) => field.onChange(value)}
      />
    </div>
  );
}

/** Instituição existente ou nova (criada no mesmo passo, na criação). */
function InstitutionPicker({ options, mode }: { options: InvestmentFormOptions; mode: Mode }) {
  const { control, setValue } = useFormContext<Values>();
  const institutionId = useWatch({ control, name: 'institutionId' });
  const newInstitution = useWatch({ control, name: 'newInstitution' });
  const selected = newInstitution ? NEW_INSTITUTION : (institutionId ?? '');

  return (
    <div className="flex flex-col gap-4">
      <Field id="campo-instituicao" label="Instituição ou conta" optional>
        <Select
          id="campo-instituicao"
          value={selected}
          onChange={(event) => {
            const value = event.target.value;
            if (value === NEW_INSTITUTION) {
              setValue('institutionId', null);
              setValue('newInstitution', { name: '', kind: 'bank' });
            } else {
              setValue('newInstitution', null);
              setValue('institutionId', value || null, { shouldDirty: true });
            }
          }}
        >
          <option value="">Sem instituição</option>
          {options.institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
          {mode === 'create' ? <option value={NEW_INSTITUTION}>+ Nova instituição…</option> : null}
        </Select>
      </Field>
      {newInstitution ? (
        <div className="grid gap-4 rounded-lg border border-rule bg-paper p-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <TextField<Values>
            name="newInstitution.name"
            label="Nome da instituição"
            autoFocus
            maxLength={80}
          />
          <SelectField<Values>
            name="newInstitution.kind"
            label="Tipo"
            options={INSTITUTION_KINDS.map((k) => ({ value: k, label: institutionKindLabel[k] }))}
          />
        </div>
      ) : null}
    </div>
  );
}

/** Quantidade × preço unitário → montante (mostrado ao vivo; o servidor recalcula). */
function UnitsFields() {
  const { control } = useFormContext<Values>();
  const [quantity, unitPrice] = useWatch({
    control,
    name: ['initial.quantity', 'initial.unitPrice'],
  });
  const total =
    quantity && unitPrice
      ? totalFromUnits(quantity as DecimalString, unitPrice as DecimalString)
      : null;
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <MoneyField<Values>
          name="initial.quantity"
          label="Quantidade"
          mode="quantity"
          nullable
          suffix=""
        />
        <MoneyField<Values> name="initial.unitPrice" label="Preço unitário" nullable />
        <MoneyField<Values> name="initial.feeAmount" label="Comissão" hint="0 se não houve" />
      </div>
      <p aria-live="polite" className="text-sm text-ink-2">
        Montante investido:{' '}
        <span className="font-medium text-ink figures-table">
          {total ? formatMoney(total) : '—'}
        </span>
      </p>
    </div>
  );
}

export function EssentialFields({
  type,
  options,
  mode,
}: {
  type: InvestmentType;
  options: InvestmentFormOptions;
  mode: Mode;
}) {
  const { control } = useFormContext<Values>();
  const interestMethod = useWatch({ control, name: 'details.interestMethod' as never }) as
    string | undefined;
  const create = mode === 'create';

  return (
    <div className="flex flex-col gap-5">
      <TextField<Values>
        name="name"
        label="Nome"
        placeholder={
          type === 'term_deposit'
            ? 'Ex.: Depósito a prazo 12 meses'
            : type === 'crypto'
              ? 'Ex.: Bitcoin'
              : 'Um nome que reconheça facilmente'
        }
        autoFocus={create}
        maxLength={120}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        {options.portfolios.length > 1 ? (
          <SelectField<Values>
            name="portfolioId"
            label="Carteira"
            options={options.portfolios.map((p) => ({ value: p.id, label: p.name }))}
          />
        ) : null}
        <DateField<Values> name="startDate" label="Data de início" max={options.today} />
      </div>
      <InstitutionPicker options={options} mode={mode} />

      {type === 'term_deposit' ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            {create ? <MoneyField<Values> name="initial.amount" label="Capital aplicado" /> : null}
            <MoneyField<Values> name="details.annualRate" label="Taxa anual nominal" mode="rate" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <DateField<Values> name="maturityDate" label="Data de vencimento" />
            <SegmentedField
              name="details.interestMethod"
              label="Juros"
              options={INTEREST_METHODS.map((m) => ({ value: m, label: interestMethodLabel[m] }))}
            />
          </div>
          {interestMethod === 'compound' ? (
            <SelectField<Values>
              name="details.compoundingFrequency"
              label="Frequência de capitalização"
              options={COMPOUND_FREQUENCIES.map((f) => ({
                value: f,
                label: paymentFrequencyLabel[f],
              }))}
              className="sm:max-w-xs"
            />
          ) : null}
        </>
      ) : null}

      {type === 'bond' ? (
        <>
          <TextField<Values>
            name="details.issuer"
            label="Emitente"
            optional
            nullable
            placeholder="Ex.: Tesouro Nacional"
          />
          {create ? <UnitsFields /> : null}
          <div className="grid gap-5 sm:grid-cols-3">
            <MoneyField<Values>
              name="details.nominalValue"
              label="Valor nominal (unidade)"
              optional
              nullable
            />
            <MoneyField<Values>
              name="details.couponRate"
              label="Taxa de cupão"
              mode="rate"
              optional
              nullable
            />
            <SelectField<Values>
              name="details.couponFrequency"
              label="Frequência do cupão"
              optional
              emptyLabel="—"
              options={PAYMENT_FREQUENCIES.map((f) => ({
                value: f,
                label: paymentFrequencyLabel[f],
              }))}
            />
          </div>
          <DateField<Values>
            name="maturityDate"
            label="Data de vencimento"
            className="sm:max-w-xs"
          />
        </>
      ) : null}

      {type === 'security' ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <SegmentedField
              name="details.assetClass"
              label="Tipo de ativo"
              options={SECURITY_ASSET_CLASSES.map((c) => ({
                value: c,
                label: securityAssetClassLabel[c],
              }))}
            />
            <TextField<Values>
              name="symbol"
              label="Símbolo / ticker"
              optional
              nullable
              maxLength={20}
            />
          </div>
          {create ? <UnitsFields /> : null}
        </>
      ) : null}

      {type === 'crypto' ? (
        <>
          <TextField<Values>
            name="symbol"
            label="Símbolo"
            optional
            nullable
            placeholder="Ex.: BTC"
            className="sm:max-w-xs"
            maxLength={20}
          />
          {create ? <UnitsFields /> : null}
          <p className="-mt-2 text-[0.8125rem] text-ink-3">
            Nesta fase os valores são registados em kwanzas: indique o preço por unidade em Kz.
          </p>
        </>
      ) : null}

      {type === 'alternative' ? (
        <>
          <SegmentedField
            name="details.subtype"
            label="Tipo"
            options={ALTERNATIVE_SUBTYPES.map((s) => ({
              value: s,
              label: alternativeSubtypeLabel[s],
            }))}
          />
          <TextField<Values>
            name="details.platformOrProject"
            label="Plataforma ou projeto"
            optional
            nullable
            maxLength={80}
          />
          <div className="grid gap-5 sm:grid-cols-3">
            {create ? <MoneyField<Values> name="initial.amount" label="Capital aplicado" /> : null}
            <MoneyField<Values>
              name="details.expectedRate"
              label="Taxa esperada"
              mode="rate"
              optional
              nullable
            />
            <DateField<Values> name="details.expectedExitDate" label="Saída esperada" optional />
          </div>
        </>
      ) : null}

      {type === 'other' && create ? (
        <MoneyField<Values> name="initial.amount" label="Valor aplicado" className="sm:max-w-xs" />
      ) : null}
    </div>
  );
}

export function DetailFields({
  type,
  options,
  mode,
}: {
  type: InvestmentType;
  options: InvestmentFormOptions;
  mode: Mode;
}) {
  const { control, register, setValue } = useFormContext<Values>();
  const [dayCountBasis, maturityDate, currentValue] = useWatch({
    control,
    name: ['details.dayCountBasis' as never, 'maturityDate', 'currentValue'],
  }) as [string | undefined, string | null, Values['currentValue']];
  const create = mode === 'create';
  const units = UNIT_TYPES.has(type);

  return (
    <div className="flex flex-col gap-6">
      {type === 'term_deposit' ? (
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <SegmentedField
              name="details.rateType"
              label="Tipo de taxa"
              options={RATE_TYPES.map((r) => ({ value: r, label: rateTypeLabel[r] }))}
            />
            <SelectField<Values>
              name="details.dayCountBasis"
              label="Convenção de dias"
              hint="Como o banco conta os dias do ano nos juros."
              options={DAY_COUNT_BASES.map((b) => ({ value: b, label: dayCountBasisLabel[b] }))}
            />
          </div>
          {dayCountBasis === 'custom' ? (
            <Field id="campo-details-customDayCount" label="Dias por ano" className="sm:max-w-40">
              <Input
                id="campo-details-customDayCount"
                type="number"
                inputMode="numeric"
                min={1}
                max={400}
                {...register('details.customDayCount' as never, {
                  setValueAs: (v: string) => (v === '' ? null : Number.parseInt(v, 10)),
                })}
              />
            </Field>
          ) : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <MoneyField<Values>
              name="details.estimatedTaxRate"
              label="Retenção estimada"
              mode="rate"
              optional
              nullable
              hint="Só se conhecer a taxa. Não pré-preenchemos valores fiscais."
            />
            <div className="sm:pt-7">
              <Checkbox label="Renovação automática" {...register('details.autoRenew' as never)} />
            </div>
          </div>
        </div>
      ) : null}

      {type === 'security' ? (
        <TextField<Values>
          name="details.market"
          label="Bolsa ou mercado"
          optional
          nullable
          placeholder="Ex.: BODIVA"
          className="sm:max-w-sm"
        />
      ) : null}
      {type === 'crypto' ? (
        <TextField<Values>
          name="details.network"
          label="Rede"
          optional
          nullable
          className="sm:max-w-sm"
        />
      ) : null}
      {type !== 'term_deposit' && type !== 'bond' ? (
        <DateField<Values>
          name="maturityDate"
          label="Data de vencimento"
          optional
          className="sm:max-w-xs"
        />
      ) : null}

      {create ? (
        <div className="flex flex-col gap-4 rounded-lg border border-rule bg-paper p-4">
          <Checkbox
            label="Já sei quanto vale hoje"
            hint="Regista uma primeira avaliação. Pode fazê-lo mais tarde."
            checked={currentValue !== null}
            onChange={(event) =>
              setValue(
                'currentValue',
                event.target.checked ? { valuedOn: options.today, totalValue: '' } : null,
              )
            }
          />
          {currentValue !== null ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <DateField<Values>
                name="currentValue.valuedOn"
                label="Data do valor"
                max={options.today}
              />
              <MoneyField<Values>
                name="currentValue.totalValue"
                label="Valor atual total"
                hint={units ? 'Quantidade × preço atual.' : undefined}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <NotesField<Values> name="notes" />
      <TagsField<Values> name="tags" />
      <CustomFieldsEditor<Values> name="customFields" />

      {create && maturityDate ? (
        <Checkbox
          label="Lembrar-me 7 dias antes do vencimento"
          hint="Cria um lembrete na página Prazos."
          {...register('remindBeforeMaturity')}
        />
      ) : null}
    </div>
  );
}
