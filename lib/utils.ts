import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Os tamanhos de texto do tema (globals.css) têm de ser declarados, senão o tailwind-merge
// trata `text-hero` como cor e remove-a ao juntar com `text-ink`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['hero', 'display', 'title', 'label'],
    },
  },
});

/** Junta classes Tailwind resolvendo conflitos (a última ganha). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
