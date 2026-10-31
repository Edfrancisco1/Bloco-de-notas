import { cn } from '@/lib/utils';

/** Secção editorial: título em serifa e régua fina, sem caixa à volta. */
export function Section({
  title,
  id,
  action,
  description,
  className,
  children,
}: {
  title: React.ReactNode;
  id?: string;
  action?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const headingId = id ? `${id}-titulo` : undefined;
  return (
    <section aria-labelledby={headingId} id={id} className={cn('min-w-0', className)}>
      <header className="flex items-end justify-between gap-4 border-b border-ink/80 pb-2.5">
        <div className="min-w-0">
          <h2 id={headingId} className="font-serif text-title text-ink">
            {title}
          </h2>
          {description ? <p className="mt-0.5 text-sm text-ink-3">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

/** Cabeçalho de página: título grande em serifa, descrição e ações. */
export function PageHeader({
  title,
  eyebrow,
  description,
  actions,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 eyebrow">{eyebrow}</p> : null}
        <h1 className="font-serif text-display text-ink">{title}</h1>
        {description ? <p className="mt-2 max-w-prose text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  className,
}: {
  title: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('py-10 text-center', className)}>
      <p className="font-serif text-title text-ink">{title}</p>
      {children ? <div className="mx-auto mt-2 max-w-md text-ink-2">{children}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
