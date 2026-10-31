import type { Metadata } from 'next';
import { AllocationByInstitution, AllocationByType } from '@/components/dashboard/allocation';
import { AttentionList } from '@/components/dashboard/attention';
import { RecentActivity } from '@/components/dashboard/activity';
import { EmptyDashboard } from '@/components/dashboard/empty-dashboard';
import { PortfolioFilter } from '@/components/dashboard/portfolio-filter';
import { DashboardSummary } from '@/components/dashboard/summary';
import { UpcomingList } from '@/components/dashboard/upcoming';
import { getOnboardedRepository } from '@/lib/data';
import { formatDate } from '@/lib/formatters/dates';
import { getDashboardView } from '@/lib/services/dashboard';

export const metadata: Metadata = { title: 'Início' };

function greeting(timeZone: string, now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone }).format(now),
  );
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 19) return 'Boa tarde';
  return 'Boa noite';
}

function weekdayDate(date: string, timeZone: string) {
  const text = new Intl.DateTimeFormat('pt-AO', { dateStyle: 'full', timeZone }).format(
    new Date(`${date}T12:00:00Z`),
  );
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function DashboardPage({ searchParams }: PageProps<'/app'>) {
  const { carteira } = await searchParams;
  const repo = await getOnboardedRepository();
  const profile = await repo.getProfile();
  const view = await getDashboardView(repo, {
    portfolioId: typeof carteira === 'string' ? carteira : null,
  });

  return (
    <>
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">{weekdayDate(view.today, profile.timezone)}</p>
          <h1 className="mt-2 font-serif text-display text-ink">
            {greeting(profile.timezone)}
            {view.displayName ? `, ${view.displayName}` : ''}.
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <PortfolioFilter portfolios={view.portfolios} selected={view.portfolioId} />
          {view.lastUpdatedOn ? (
            <p className="text-sm text-ink-3">
              Última atualização:{' '}
              <span className="text-ink-2">{formatDate(view.lastUpdatedOn)}</span>
            </p>
          ) : null}
        </div>
      </header>

      {view.hasInvestments ? (
        <>
          <DashboardSummary view={view} />
          {view.unconverted.length > 0 ? (
            <p className="mt-6 rounded-md bg-marker-soft px-4 py-3 text-sm text-marker-ink">
              Há valores noutras moedas sem taxa de câmbio. Estão fora dos totais até definir uma
              taxa.
            </p>
          ) : null}
          <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-x-12">
            <AttentionList view={view} className="lg:col-span-7 lg:row-start-1" />
            <AllocationByType
              slices={view.allocation.byType}
              unvaluedCount={view.allocation.unvaluedCount}
              className="lg:col-span-7 lg:row-start-2"
            />
            <AllocationByInstitution
              slices={view.allocation.byInstitution}
              className="lg:col-span-5 lg:col-start-8 lg:row-start-2"
            />
            <UpcomingList view={view} className="lg:col-span-5 lg:col-start-8 lg:row-start-1" />
            <RecentActivity view={view} className="lg:col-span-12 lg:row-start-3" />
          </div>
          <p className="mt-16 max-w-2xl text-xs leading-relaxed text-ink-3">
            O InvestNote organiza a informação que regista e não presta aconselhamento financeiro,
            fiscal ou jurídico. Valores indicativos, calculados a partir dos seus registos.
          </p>
        </>
      ) : (
        <EmptyDashboard />
      )}
    </>
  );
}
