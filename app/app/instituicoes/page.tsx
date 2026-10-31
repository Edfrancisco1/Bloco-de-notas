import { Plus } from 'lucide-react';
import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { EmptyState, PageHeader } from '@/components/common/section';
import { InstitutionDialog, OrganizeRowActions } from '@/components/organize/organize-dialogs';
import { Button } from '@/components/ui/button';
import { getOnboardedRepository } from '@/lib/data';
import { institutionKindLabel } from '@/lib/domain/labels';
import { formatMoney } from '@/lib/formatters/money';
import { getInstitutionsView } from '@/lib/services/management';

export const metadata: Metadata = { title: 'Instituições' };

export default async function InstitutionsPage() {
  const repo = await getOnboardedRepository();
  const institutions = await getInstitutionsView(repo);
  const addButton = (
    <InstitutionDialog
      trigger={
        <Button>
          <Plus aria-hidden strokeWidth={2} />
          Nova instituição
        </Button>
      }
    />
  );

  return (
    <>
      <PageHeader
        title="Instituições"
        description="Bancos, corretoras, exchanges, wallets e plataformas onde estão os seus investimentos. Sem ligações nem credenciais: só para organizar."
        actions={addButton}
      />
      {institutions.length === 0 ? (
        <EmptyState title="Ainda não tem instituições." className="mt-10">
          Pode criá-las aqui ou ao registar um investimento.
        </EmptyState>
      ) : (
        <ul className="mt-10 divide-y divide-rule border-y border-ink/80">
          {institutions.map((institution) => (
            <li
              key={institution.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
            >
              <div className="min-w-0">
                <Link
                  href={`/app/investimentos?instituicao=${institution.id}` as Route}
                  className="font-serif text-[1.25rem] text-ink underline-offset-4 hover:underline"
                >
                  {institution.name}
                </Link>
              </div>
              <div className="col-start-1 row-start-2 sm:mt-0.5">
                <p className="text-sm text-ink-3">
                  {institutionKindLabel[institution.kind]} · {institution.openCount}{' '}
                  {institution.openCount === 1 ? 'investimento aberto' : 'investimentos abertos'}
                  {institution.closedCount ? ` · ${institution.closedCount} encerrado(s)` : ''}
                </p>
                {institution.notes ? (
                  <p className="mt-1 text-sm text-ink-2">{institution.notes}</p>
                ) : null}
              </div>
              <p className="col-start-2 row-start-2 self-start text-right text-[0.9375rem] text-ink figures-table sm:row-span-2 sm:row-start-1 sm:self-center">
                {formatMoney(institution.currentValue)}
                <span className="block text-[0.8125rem] text-ink-3">valor atual conhecido</span>
              </p>
              <div className="col-start-2 row-start-1 justify-self-end sm:col-start-3 sm:row-span-2">
                <OrganizeRowActions
                  kind="institution"
                  id={institution.id}
                  name={institution.name}
                  institution={{ kind: institution.kind, notes: institution.notes }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
