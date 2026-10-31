'use client';

import { cn } from '@/lib/utils';

/** Caixa de seleção nativa (acessível por defeito), com etiqueta e ajuda. */
export function Checkbox({
  label,
  hint,
  className,
  ...props
}: Omit<React.ComponentProps<'input'>, 'type'> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-[1.125rem] shrink-0 cursor-pointer accent-accent"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-[0.9375rem] text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-[0.8125rem] text-ink-3">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Controlo segmentado (2–4 opções mutuamente exclusivas), com semântica de grupo de rádio. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        'grid auto-cols-fr grid-flow-col rounded-md bg-paper-sunken p-1 text-sm',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-[5px] px-3 py-1.5 transition-colors',
            value === option.value
              ? 'bg-surface font-medium text-ink shadow-sm'
              : 'text-ink-2 hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Cartões de escolha única com rádios nativos (setas do teclado funcionam por defeito). */
export function RadioCards<T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
  columns = 'sm:grid-cols-2 lg:grid-cols-3',
}: {
  name: string;
  legend: string;
  value: T | null;
  options: readonly {
    value: T;
    title: string;
    description?: string;
    media?: React.ReactNode;
  }[];
  onChange: (value: T) => void;
  columns?: string;
}) {
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className={cn('grid gap-3', columns)}>
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'relative flex cursor-pointer gap-3.5 rounded-lg border bg-paper-raised p-4 transition-colors',
                'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent',
                checked
                  ? 'border-accent bg-surface shadow-[inset_0_0_0_1px_var(--color-accent)]'
                  : 'border-rule hover:border-rule-strong hover:bg-surface',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.media}
              <span className="min-w-0">
                <span className="block font-medium text-ink">{option.title}</span>
                {option.description ? (
                  <span className="mt-1 block text-sm leading-snug text-ink-3">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
