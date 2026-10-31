'use client';

import { Popover as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Popover = Primitive.Root;
export const PopoverTrigger = Primitive.Trigger;
export const PopoverClose = Primitive.Close;

export function PopoverContent({
  className,
  align = 'start',
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={16}
        className={cn(
          'z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-rule bg-paper-raised p-4 text-sm text-ink-2 shadow-overlay outline-none',
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}
