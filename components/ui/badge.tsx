import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[0.6875rem] leading-4 font-medium whitespace-nowrap [&_svg]:size-3',
  {
    variants: {
      tone: {
        neutral: 'bg-paper-sunken text-ink-2',
        outline: 'border border-rule-strong text-ink-2',
        accent: 'bg-accent-soft text-accent',
        marker: 'bg-marker text-marker-ink',
        positive: 'bg-positive-soft text-positive',
        negative: 'bg-negative-soft text-negative',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
