'use client';

import { LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wordmark } from '@/components/common/wordmark';
import { buttonVariants } from '@/components/ui/button';
import { signOutAction } from '@/lib/actions/session';
import { cn } from '@/lib/utils';
import { type NavItem, isActive, primaryNav, secondaryNav } from './nav';

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-[0.875rem] transition-colors',
        active
          ? 'bg-paper-sunken font-medium text-ink'
          : 'text-ink-2 hover:bg-paper-sunken/70 hover:text-ink',
      )}
    >
      <Icon
        aria-hidden
        className={cn(
          'size-[1.05rem] shrink-0',
          active ? 'text-accent' : 'text-ink-3 group-hover:text-ink-2',
        )}
        strokeWidth={1.6}
      />
      {item.label}
    </Link>
  );
}

/** Navegação lateral (≥ 1024px). */
export function Sidebar({
  name,
  email,
  isDemo,
}: {
  name: string | null;
  email: string;
  isDemo: boolean;
}) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col border-r border-rule bg-paper px-4 py-6 lg:flex">
      <Link href="/app" className="px-3" aria-label="InvestNote — início">
        <Wordmark />
      </Link>

      <Link
        href="/app/investimentos/novo"
        className={cn(buttonVariants({ variant: 'primary' }), 'mt-8 w-full justify-start')}
      >
        <Plus aria-hidden strokeWidth={2} />
        Adicionar investimento
      </Link>

      <nav aria-label="Principal" className="mt-6 flex flex-col gap-0.5">
        {primaryNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <nav aria-label="Conta" className="mt-6 flex flex-col gap-0.5 border-t border-rule pt-6">
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        {isDemo ? (
          <p className="rounded-md bg-marker-soft px-3 py-2.5 text-[0.8125rem] leading-snug text-marker-ink">
            <span className="font-medium">Modo demonstração.</span> Os valores são fictícios.
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2 px-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{name ?? 'Sem nome'}</p>
            <p className="truncate text-xs text-ink-3">{email}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md p-2 text-ink-3 transition-colors hover:bg-paper-sunken hover:text-ink"
              aria-label="Terminar sessão"
              title="Terminar sessão"
            >
              <LogOut aria-hidden className="size-4" strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
