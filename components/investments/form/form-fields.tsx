'use client';

import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import {
  type FieldPath,
  type FieldValues,
  get,
  useController,
  useFieldArray,
  useFormContext,
} from 'react-hook-form';
import { Field, fieldA11y } from '@/components/ui/field';
import { DateInput, Input, Select, Textarea } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { type ParseFailure, parseFailureMessage } from '@/lib/formatters/parse';

/**
 * Campos ligados ao React Hook Form. Cada um mostra o erro junto ao campo e associa-o por ARIA.
 * Os valores monetários ficam em texto canónico ("1234567.89"); nunca em `number`.
 */

function useFieldError(name: string): string | null {
  const { formState } = useFormContext();
  const error = get(formState.errors, name) as { message?: string } | undefined;
  return error?.message ?? null;
}

const idOf = (name: string) => `campo-${name.replace(/\./g, '-')}`;

export function MoneyField<T extends FieldValues>({
  name,
  label,
  hint,
  optional,
  mode = 'money',
  suffix,
  nullable = false,
  autoFocus,
  className,
}: {
  name: FieldPath<T>;
  label: React.ReactNode;
  hint?: React.ReactNode;
  optional?: boolean;
  mode?: 'money' | 'quantity' | 'rate';
  suffix?: string;
  /** Vazio é `null` (campos opcionais) em vez de ''. */
  nullable?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  const { control } = useFormContext<T>();
  const { field } = useController({ control, name });
  const [failure, setFailure] = useState<ParseFailure | null>(null);
  const schemaError = useFieldError(name);
  const error = failure ? parseFailureMessage[failure] : schemaError;
  const id = idOf(name);
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <MoneyInput
        {...fieldA11y(id, { hint: !!hint, error })}
        mode={mode}
        suffix={suffix}
        autoFocus={autoFocus}
        value={(field.value as string | null) ?? ''}
        onBlur={field.onBlur}
        onValueChange={(value, reason) => {
          setFailure(reason === 'empty' ? null : reason);
          field.onChange(value === '' && nullable ? null : value);
        }}
      />
    </Field>
  );
}

export function TextField<T extends FieldValues>({
  name,
  label,
  hint,
  optional,
  placeholder,
  nullable = false,
  autoFocus,
  className,
  maxLength,
}: {
  name: FieldPath<T>;
  label: React.ReactNode;
  hint?: React.ReactNode;
  optional?: boolean;
  placeholder?: string;
  nullable?: boolean;
  autoFocus?: boolean;
  className?: string;
  maxLength?: number;
}) {
  const { register } = useFormContext<T>();
  const error = useFieldError(name);
  const id = idOf(name);
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <Input
        {...fieldA11y(id, { hint: !!hint, error })}
        {...register(name, {
          setValueAs: (value: string | null) => (nullable && !value ? null : (value ?? '')),
        })}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={maxLength}
        autoComplete="off"
      />
    </Field>
  );
}

export function DateField<T extends FieldValues>({
  name,
  label,
  hint,
  optional,
  max,
  min,
  className,
}: {
  name: FieldPath<T>;
  label: React.ReactNode;
  hint?: React.ReactNode;
  optional?: boolean;
  max?: string;
  min?: string;
  className?: string;
}) {
  const { register } = useFormContext<T>();
  const error = useFieldError(name);
  const id = idOf(name);
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <DateInput
        {...fieldA11y(id, { hint: !!hint, error })}
        {...register(name, {
          setValueAs: (value: string | null) => (optional && !value ? null : (value ?? '')),
        })}
        max={max}
        min={min}
      />
    </Field>
  );
}

export function SelectField<T extends FieldValues>({
  name,
  label,
  hint,
  optional,
  options,
  className,
  emptyLabel,
}: {
  name: FieldPath<T>;
  label: React.ReactNode;
  hint?: React.ReactNode;
  optional?: boolean;
  options: readonly { value: string; label: string }[];
  className?: string;
  /** Opção vazia (valor `null`). */
  emptyLabel?: string;
}) {
  const { register } = useFormContext<T>();
  const error = useFieldError(name);
  const id = idOf(name);
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      optional={optional}
      className={className}
    >
      <Select
        {...fieldA11y(id, { hint: !!hint, error })}
        {...register(name, {
          setValueAs: (value: string | null) => (value === '' || value === null ? null : value),
        })}
      >
        {emptyLabel !== undefined ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/** Notas em texto simples ou Markdown limitado (sem HTML). */
export function NotesField<T extends FieldValues>({ name }: { name: FieldPath<T> }) {
  const { register } = useFormContext<T>();
  const error = useFieldError(name);
  const id = idOf(name);
  return (
    <Field
      id={id}
      label="Notas"
      optional
      hint="Pode usar **negrito**, *itálico*, listas e ligações. HTML não é interpretado."
      error={error}
    >
      <Textarea
        {...fieldA11y(id, { hint: true, error })}
        {...register(name, { setValueAs: (value: string | null) => (value ? value : null) })}
        rows={4}
        maxLength={5000}
      />
    </Field>
  );
}

/** Etiquetas separadas por vírgulas (convertidas em lista ao sair do campo). */
export function TagsField<T extends FieldValues>({ name }: { name: FieldPath<T> }) {
  const { control } = useFormContext<T>();
  const { field } = useController({ control, name });
  const [text, setText] = useState(() => ((field.value as string[] | undefined) ?? []).join(', '));
  const error = useFieldError(name);
  const id = idOf(name);
  return (
    <Field
      id={id}
      label="Etiquetas"
      optional
      hint="Separadas por vírgulas. Ex.: reserva, família"
      error={error}
    >
      <Input
        {...fieldA11y(id, { hint: true, error })}
        value={text}
        onChange={(event) => setText(event.target.value)}
        onBlur={() => {
          const tags = [
            ...new Set(
              text
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            ),
          ].slice(0, 10);
          setText(tags.join(', '));
          field.onChange(tags);
          field.onBlur();
        }}
        autoComplete="off"
      />
    </Field>
  );
}

/** Campos personalizados chave/valor (só informação adicional, sem impacto nos cálculos). */
export function CustomFieldsEditor<T extends FieldValues>({ name }: { name: FieldPath<T> }) {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({ control, name: name as never });
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-sm font-medium text-ink">
        Campos personalizados <span className="text-xs font-normal text-ink-3">opcional</span>
      </legend>
      {fields.map((item, index) => (
        <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2">
          <Input
            aria-label={`Nome do campo ${index + 1}`}
            placeholder="Nome (ex.: Setor)"
            {...register(`${name}.${index}.key`)}
          />
          <Input
            aria-label={`Valor do campo ${index + 1}`}
            placeholder="Valor"
            {...register(`${name}.${index}.value`)}
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="flex size-11 items-center justify-center rounded-md text-ink-3 hover:bg-paper-sunken hover:text-ink"
            aria-label={`Remover campo ${index + 1}`}
          >
            <X aria-hidden className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      ))}
      {fields.length < 20 ? (
        <button
          type="button"
          onClick={() => append({ key: '', value: '' } as never)}
          className="inline-flex items-center gap-1.5 self-start text-sm text-accent underline-offset-4 hover:underline"
        >
          <Plus aria-hidden className="size-4" strokeWidth={1.75} />
          Adicionar campo
        </button>
      ) : null}
    </fieldset>
  );
}
