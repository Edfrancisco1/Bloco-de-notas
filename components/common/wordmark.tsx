import { cn } from '@/lib/utils';

/** Logótipo tipográfico provisório (o nome "InvestNote" ainda será validado). */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline font-serif text-[1.375rem] leading-none tracking-[-0.01em] text-ink',
        className,
      )}
    >
      Invest<span className="italic">Note</span>
      <span
        aria-hidden
        className="ml-0.5 inline-block size-1.5 translate-y-[-0.05em] rounded-full bg-accent"
      />
    </span>
  );
}
