'use client';

import { Ellipsis, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Wordmark } from '@/components/common/wordmark';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { signOutAction } from '@/lib/actions/session';
import { cn } from '@/lib/utils';
import { type NavItem, isActive, primaryNav, secondaryNav } from './nav';

const tabs = [primaryNav[0]!, primaryNav[1]!, primaryNav[2]!];
const moreItems: NavItem[] = [primaryNav[3]!, primaryNav[4]!, ...secondaryNav];

function Tab({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-1 pt-2 pb-1.5 text-[0.6875rem] transition-colors',
        active ? 'font-medium text-ink' : 'text-ink-3',
      )}
    >
      <Icon aria-hidden className={cn('size-5', active && 'text-accent')} strokeWidth={1.6} />
      {item.label}
    </Link>
  );
}

/** Barra superior do telemóvel: logótipo e aviso de demonstração. */
export function MobileTopBar({ isDemo }: { isDemo: boolean }) {
  return (
    <div className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur-sm lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/app" aria-label="InvestNote — início">
          <Wordmark className="text-[1.25rem]" />
        </Link>
        {isDemo ? (
          <span className="rounded-sm bg-marker-soft px-2 py-1 text-[0.6875rem] font-medium text-marker-ink">
            Demonstração
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Barra inferior (< 1024px): Início · Investimentos · + · Prazos · Mais. */
export function BottomNav({ name, email }: { name: string | null; email: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = moreItems.some((item) => isActive(pathname, item));

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch px-2">
        <Tab item={tabs[0]!} pathname={pathname} />
        <Tab item={tabs[1]!} pathname={pathname} />
        <div className="flex flex-1 items-center justify-center">
          <Link
            href="/app/investimentos/novo"
            aria-label="Adicionar investimento"
            className="flex size-12 -translate-y-1 items-center justify-center rounded-full bg-accent text-paper-raised shadow-overlay transition-colors hover:bg-accent-hover"
          >
            <Plus aria-hidden className="size-6" strokeWidth={2} />
          </Link>
        </div>
        <Tab item={tabs[2]!} pathname={pathname} />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger
            className={cn(
              'flex min-w-0 flex-1 flex-col items-center gap-1 pt-2 pb-1.5 text-[0.6875rem] transition-colors',
              moreActive ? 'font-medium text-ink' : 'text-ink-3',
            )}
          >
            <Ellipsis
              aria-hidden
              className={cn('size-5', moreActive && 'text-accent')}
              strokeWidth={1.6}
            />
            Mais
          </DialogTrigger>
          <DialogContent title={<Wordmark />} description={email}>
            <ul className="-mx-2 flex flex-col">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive(pathname, item) ? 'page' : undefined}
                      className="flex items-center gap-3 rounded-md px-2 py-3 text-[0.9375rem] text-ink hover:bg-paper-sunken"
                    >
                      <Icon aria-hidden className="size-5 text-ink-3" strokeWidth={1.6} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <form action={signOutAction} className="mt-3 border-t border-rule pt-3">
              <p className="mb-2 text-sm text-ink-3">{name ?? 'Sem nome'}</p>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-md px-0 py-2 text-[0.9375rem] text-ink-2 hover:text-ink"
              >
                <LogOut aria-hidden className="size-5 text-ink-3" strokeWidth={1.6} />
                Terminar sessão
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </nav>
  );
}
