'use client';

import { X } from 'lucide-react';
import { Dialog as Primitive } from 'radix-ui';
import { cn } from '@/lib/utils';

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

/**
 * Diálogo que, no telemóvel, aparece como folha a subir do fundo (mais fácil de alcançar com
 * o polegar) e, a partir de 640px, como janela centrada.
 */
export function DialogContent({
  className,
  children,
  title,
  description,
  ...props
}: Omit<React.ComponentProps<typeof Primitive.Content>, 'title'> & {
  title: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-ink/30 backdrop-blur-[1px]" />
      <Primitive.Content
        className={cn(
          'dialog-content fixed z-50 flex max-h-[92dvh] w-full flex-col bg-paper-raised shadow-overlay outline-none',
          'inset-x-0 bottom-0 rounded-t-lg pb-[env(safe-area-inset-bottom)]',
          'sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:pb-0',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-rule px-5 pt-5 pb-4">
          <div className="min-w-0">
            <Primitive.Title className="font-serif text-title text-ink">{title}</Primitive.Title>
            {description ? (
              <Primitive.Description className="mt-1 text-sm text-ink-3">
                {description}
              </Primitive.Description>
            ) : (
              <Primitive.Description className="sr-only">{title}</Primitive.Description>
            )}
          </div>
          <Primitive.Close
            className="-mt-1 -mr-1 rounded-md p-2 text-ink-3 transition-colors hover:bg-paper-sunken hover:text-ink"
            aria-label="Fechar"
          >
            <X className="size-4" strokeWidth={1.75} />
          </Primitive.Close>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </Primitive.Content>
    </Primitive.Portal>
  );
}
