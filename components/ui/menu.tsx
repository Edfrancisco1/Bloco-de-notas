'use client';

import { DropdownMenu as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Menu = Primitive.Root;
export const MenuTrigger = Primitive.Trigger;

export function MenuContent({
  className,
  align = 'end',
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        className={cn(
          'z-50 min-w-52 rounded-lg border border-rule bg-paper-raised p-1.5 shadow-overlay outline-none',
          className,
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}

export function MenuItem({
  className,
  tone = 'default',
  ...props
}: React.ComponentProps<typeof Primitive.Item> & { tone?: 'default' | 'danger' }) {
  return (
    <Primitive.Item
      className={cn(
        'flex cursor-default items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none select-none',
        'data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-paper-sunken',
        '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-3',
        tone === 'danger' ? 'text-negative [&_svg]:text-negative' : 'text-ink',
        className,
      )}
      {...props}
    />
  );
}

export function MenuSeparator() {
  return <Primitive.Separator className="my-1.5 h-px bg-rule" />;
}
