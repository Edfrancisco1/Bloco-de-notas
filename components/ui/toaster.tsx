'use client';

import { Toaster as Sonner } from 'sonner';

/** Toasts só para feedback breve; erros importantes ficam junto do campo ou do bloco. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      offset={88}
      mobileOffset={84}
      toastOptions={{
        classNames: {
          toast:
            '!rounded-lg !border !border-rule !bg-ink !text-paper-raised !shadow-overlay !font-sans',
          description: '!text-paper-raised/80',
        },
      }}
    />
  );
}
