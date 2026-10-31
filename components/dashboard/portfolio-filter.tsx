'use client';

import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Select } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Filtro de carteira (PLANO_MVP §9, ponto 1). Guarda a escolha no URL. */
export function PortfolioFilter({
  portfolios,
  selected,
}: {
  portfolios: { id: string; name: string }[];
  selected: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  if (portfolios.length < 2) return null;

  return (
    <div className={cn('w-full sm:w-56', pending && 'opacity-70')}>
      <label htmlFor="filtro-carteira" className="sr-only">
        Carteira
      </label>
      <Select
        id="filtro-carteira"
        value={selected ?? ''}
        className="h-10"
        onChange={(event) => {
          const value = event.target.value;
          const href = (
            value ? `${pathname}?carteira=${encodeURIComponent(value)}` : pathname
          ) as Route;
          startTransition(() => router.push(href));
        }}
      >
        <option value="">Todas as carteiras</option>
        {portfolios.map((portfolio) => (
          <option key={portfolio.id} value={portfolio.id}>
            {portfolio.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
