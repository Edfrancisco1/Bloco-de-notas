'use client';

import { Search, X } from 'lucide-react';
import type { Route } from 'next';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useTransition } from 'react';
import { Select } from '@/components/ui/input';
import { investmentTypeGroupLabel, investmentTypeOrder } from '@/lib/domain/labels';
import type { InvestmentFilters } from '@/lib/services/investments';
import { cn } from '@/lib/utils';

const PARAM: Record<keyof InvestmentFilters, string> = {
  q: 'q',
  type: 'tipo',
  status: 'estado',
  institutionId: 'instituicao',
  portfolioId: 'carteira',
  sort: 'ordem',
};

const DEFAULTS: Partial<Record<keyof InvestmentFilters, string>> = {
  status: 'abertos',
  sort: 'valor',
};

function toQuery(filters: InvestmentFilters): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(PARAM) as (keyof InvestmentFilters)[]) {
    const value = filters[key];
    if (value && value !== DEFAULTS[key]) params.set(PARAM[key], value);
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/** Pesquisa, filtros e ordenação no URL (partilháveis e com o botão "voltar" a funcionar). */
export function InvestmentFiltersBar({
  filters,
  portfolios,
  institutions,
}: {
  filters: InvestmentFilters;
  portfolios: { id: string; name: string }[];
  institutions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = (next: Partial<InvestmentFilters>) => {
    const href = `${pathname}${toQuery({ ...filters, ...next })}` as Route;
    startTransition(() => router.replace(href, { scroll: false }));
  };

  const active =
    filters.q !== '' ||
    filters.type !== null ||
    filters.status !== 'abertos' ||
    filters.institutionId !== null ||
    filters.portfolioId !== null;

  return (
    <div className={cn('flex flex-col gap-3 transition-opacity', pending && 'opacity-70')}>
      <div className="relative">
        <label htmlFor="pesquisa" className="sr-only">
          Pesquisar investimentos
        </label>
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3"
          strokeWidth={1.75}
        />
        <input
          id="pesquisa"
          type="search"
          defaultValue={filters.q}
          placeholder="Pesquisar por nome, símbolo, instituição ou etiqueta"
          className="h-11 w-full rounded-md border border-field bg-surface pr-3 pl-9 text-ink placeholder:text-ink-3/80 hover:border-ink-3 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent"
          onChange={(event) => {
            const value = event.target.value;
            if (debounce.current) clearTimeout(debounce.current);
            debounce.current = setTimeout(() => apply({ q: value.trim() }), 300);
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-[1fr_0.85fr_1.35fr_1fr_1.1fr]">
        <FilterSelect
          id="filtro-tipo"
          label="Tipo"
          value={filters.type ?? ''}
          onChange={(v) => apply({ type: (v || null) as InvestmentFilters['type'] })}
        >
          <option value="">Tipo: todos</option>
          {investmentTypeOrder.map((type) => (
            <option key={type} value={type}>
              {investmentTypeGroupLabel[type]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="filtro-estado"
          label="Estado"
          value={filters.status}
          onChange={(v) => apply({ status: v as InvestmentFilters['status'] })}
        >
          <option value="abertos">Abertos</option>
          <option value="encerrados">Encerrados</option>
          <option value="arquivados">Arquivados</option>
          <option value="todos">Todos</option>
        </FilterSelect>
        <FilterSelect
          id="filtro-instituicao"
          label="Instituição"
          value={filters.institutionId ?? ''}
          onChange={(v) => apply({ institutionId: v || null })}
        >
          <option value="">Instituição: todas</option>
          {institutions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="filtro-carteira"
          label="Carteira"
          value={filters.portfolioId ?? ''}
          onChange={(v) => apply({ portfolioId: v || null })}
        >
          <option value="">Carteira: todas</option>
          {portfolios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect
          id="filtro-ordem"
          label="Ordenar por"
          value={filters.sort}
          onChange={(v) => apply({ sort: v as InvestmentFilters['sort'] })}
          className="col-span-2 md:col-span-1"
        >
          <option value="valor">Maior valor atual</option>
          <option value="resultado">Maior resultado</option>
          <option value="vencimento">Vencimento mais próximo</option>
          <option value="atualizacao">Atualização mais antiga</option>
          <option value="nome">Nome (A–Z)</option>
        </FilterSelect>
      </div>
      {active ? (
        <button
          type="button"
          onClick={() => {
            const input = document.getElementById('pesquisa') as HTMLInputElement | null;
            if (input) input.value = '';
            startTransition(() =>
              router.replace(
                `${pathname}${filters.sort !== 'valor' ? `?ordem=${filters.sort}` : ''}` as Route,
                { scroll: false },
              ),
            );
          }}
          className="inline-flex items-center gap-1.5 self-start text-sm text-accent underline-offset-4 hover:underline"
        >
          <X aria-hidden className="size-3.5" strokeWidth={2} />
          Limpar filtros
        </button>
      ) : null}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 text-sm"
      >
        {children}
      </Select>
    </div>
  );
}
