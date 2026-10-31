import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { controlClasses } from './field';

export function Input({ className, ...props }: React.ComponentProps<'input'>) {
  return <input className={cn(controlClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(controlClasses, 'h-auto min-h-24 py-2.5 leading-6', className)}
      {...props}
    />
  );
}

/** Seletor nativo: o melhor comportamento em telemóvel e acessível por defeito. */
export function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(controlClasses, 'appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3"
        strokeWidth={1.75}
      />
    </div>
  );
}

/** Data nativa (calendário do sistema em telemóvel). Valor em AAAA-MM-DD. */
export function DateInput({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  return (
    <input type="date" className={cn(controlClasses, 'figures-table', className)} {...props} />
  );
}
