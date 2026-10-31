'use client';

import { CircleHelp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * Definição e fórmula de uma métrica, num popover (cálculos explicados, como no Sharesight).
 * Abre com clique/toque e teclado — não depende de hover.
 */
export function MetricDefinition({
  label,
  children,
  formula,
}: {
  label: string;
  children: React.ReactNode;
  formula?: React.ReactNode;
}) {
  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex size-6 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-paper-sunken hover:text-ink"
        aria-label={`O que é: ${label}`}
      >
        <CircleHelp aria-hidden className="size-3.5" strokeWidth={1.75} />
      </PopoverTrigger>
      <PopoverContent>
        <p className="font-serif text-[1.0625rem] text-ink">{label}</p>
        <div className="mt-1.5 leading-relaxed">{children}</div>
        {formula ? (
          <p className="mt-3 rounded-md bg-paper-sunken px-3 py-2 text-[0.8125rem] leading-relaxed text-ink-2">
            {formula}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
