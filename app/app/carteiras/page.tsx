import { Plus } from 'lucide-react';
import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/common/section';
import { OrganizeRowActions, PortfolioDialog } from '@/components/organize/organize-dialogs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getOnboardedRepository } from '@/lib/data';
import { formatMoney } from '@/lib/formatters/money';
import { getPortfoliosView } from '@/lib/services/management';

export const metadata: Metadata = { title: 'Carteiras' };

function counts(open: number, closed: number) {
  const parts = [`${open} ${open === 1 ? 'aberto' : 'abertos'}`];
  if (closed) parts.push(`${closed} ${closed === 1 ? 'encerrado' : 'encerrados'}`);
  return parts.join(' · ');
}

export default async function PortfoliosPage() {
  const repo = await getOnboardedRepository();
  const portfolios = await getPortfoliosView(repo);

  return (
    <>
      <PageHeader
        title="Carteiras"
        description="Agrupe os investimentos como lhe fizer sentido. Cada carteira tem o Kwanza como moeda base."
        actions={
          <PortfolioDialog
            trigger={
              <Button>
                <Plus aria-hidden strokeWidth={2} />
                Nova carteira
              </Button>
            }
          />
        }
      />
      <ul className="mt-10 divide-y divide-rule border-y border-ink/80">
        {portfolios.map((portfolio) => (
          <li
            key={portfolio.id}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/app/investimentos?carteira=${portfolio.id}` as Route}
                  className="font-serif text-[1.25rem] text-ink underline-offset-4 hover:underline"
                >
                  {portfolio.name}
                </Link>
                {portfolio.isDefault ? <Badge tone="accent">Principal</Badge> : null}
              </div>
            </div>
            <p className="col-start-1 row-start-2 text-sm text-ink-3 sm:mt-0.5">
              {counts(portfolio.openCount, portfolio.closedCount)}
              {portfolio.unvalued ? ` · ${portfolio.unvalued} sem valor atual` : ''}
            </p>
            <p className="col-start-2 row-start-2 text-right text-[0.9375rem] text-ink figures-table sm:row-span-2 sm:row-start-1">
              {formatMoney(portfolio.currentValue)}
              <span className="block text-[0.8125rem] text-ink-3">valor atual conhecido</span>
            </p>
            <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3 sm:row-span-2">
              <OrganizeRowActions
                kind="portfolio"
                id={portfolio.id}
                name={portfolio.name}
                archiveDisabledReason={
                  portfolio.isDefault
                    ? 'A carteira principal não pode ser arquivada'
                    : portfolio.openCount > 0
                      ? 'Tem investimentos abertos'
                      : null
                }
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
