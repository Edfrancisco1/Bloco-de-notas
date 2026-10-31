import { cn } from '@/lib/utils';

/** Ids e atributos ARIA que ligam um campo à sua ajuda e ao seu erro. */
export function fieldA11y(id: string, options: { hint?: boolean; error?: string | null }) {
  const describedBy = [options.hint ? `${id}-ajuda` : null, options.error ? `${id}-erro` : null]
    .filter(Boolean)
    .join(' ');
  return {
    id,
    'aria-invalid': options.error ? true : undefined,
    'aria-describedby': describedBy || undefined,
  } as const;
}

interface FieldProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: string | null;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Etiqueta real + campo + ajuda + erro junto ao campo (PLANO_MVP §14). */
export function Field({ id, label, hint, error, optional, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="flex items-baseline gap-2 text-sm font-medium text-ink">
        {label}
        {optional ? <span className="text-xs font-normal text-ink-3">opcional</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-ajuda`} className="text-[0.8125rem] text-ink-3">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-erro`} className="text-[0.8125rem] font-medium text-negative" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const controlClasses = cn(
  'h-11 w-full rounded-md border border-field bg-surface px-3 text-ink',
  'transition-colors duration-150 placeholder:text-ink-3/80',
  'hover:border-ink-3 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent',
  'disabled:cursor-not-allowed disabled:bg-paper-sunken disabled:opacity-70 aria-invalid:border-negative',
);
