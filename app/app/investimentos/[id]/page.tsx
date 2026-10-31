import { ArrowLeft, CircleCheck } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Section } from '@/components/common/section';
import { DeadlineBadge, InvestmentStatusBadge } from '@/components/common/status';
import { TypeMonogram } from '@/components/common/type-monogram';
import { InvestmentDetails, InvestmentNotes } from '@/components/investments/detail/details';
import { InvestmentActions } from '@/components/investments/detail/investment-actions';
import { InvestmentMetrics } from '@/components/investments/detail/metrics';
import { InvestmentReminders } from '@/components/investments/detail/reminders';
import { Timeline } from '@/components/investments/detail/timeline';
import { ValuationChart } from '@/components/investments/detail/valuation-chart';
import { TermDepositEstimate } from '@/components/investments/term-deposit-estimate';
import type { TransactionContext } from '@/components/investments/transaction-dialog';
import { getOnboardedRepository } from '@/lib/data';
import { getInvestmentDetailView } from '@/lib/services/investment-detail';

export async function generateMetadata({
  params,
}: PageProps<'/app/investimentos/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const repo = await getOnboardedRepository();
  const investment = await repo.getInvestment(id);
  return { title: investment?.name ?? 'Investimento' };
}

export default async function InvestmentPage({
  params,
  searchParams,
}: PageProps<'/app/investimentos/[id]'>) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const repo = await getOnboardedRepository();
  const view = await getInvestmentDetailView(repo, id);
  if (!view) notFound();

  const { investment } = view;
  const context: TransactionContext = {
    investmentId: investment.id,
    investmentName: investment.name,
    investmentType: investment.type,
    status: investment.status,
    startDate: investment.startDate,
    today: view.today,
    usesUnits:
      view.metrics.quantity !== null || ['bond', 'security', 'crypto'].includes(investment.type),
    transactions: view.transactions,
    latestValuation: view.latestValuation,
  };
  const meta = [view.typeLabel, view.institution?.name, view.portfolio?.name].filter(Boolean);

  return (
    <>
      <Link
        href="/app/investimentos"
        className="inline-flex items-center gap-1.5 text-sm text-ink-3 underline-offset-4 hover:text-ink hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />
        Investimentos
      </Link>

      <header className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <TypeMonogram type={investment.type} size="lg" className="mt-1" />
          <div className="min-w-0">
            <h1 className="font-serif text-display text-balance text-ink">{investment.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-sm text-ink-3">
              <span>{meta.join(' · ')}</span>
              <InvestmentStatusBadge status={investment.status} />
              <DeadlineBadge deadline={view.deadline} />
            </div>
          </div>
        </div>
        <InvestmentActions
          context={context}
          target={view.valuationTarget}
          status={investment.status}
          netInvested={view.metrics.netInvested}
          quantity={view.metrics.quantity}
          maturityDate={investment.maturityDate}
          counts={view.counts}
        />
      </header>

      {query.novo === '1' ? (
        <div
          role="status"
          className="mt-6 flex items-start gap-3 rounded-lg bg-positive-soft px-4 py-3.5 text-[0.9375rem] text-positive"
        >
          <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0" strokeWidth={1.75} />
          <p>
            <span className="font-medium">Investimento registado.</span>{' '}
            <span className="text-ink-2">
              Pode registar movimentos, criar um lembrete ou{' '}
              <Link
                href="/app"
                className="text-accent underline decoration-accent/40 underline-offset-4"
              >
                voltar ao painel
              </Link>
              .
            </span>
          </p>
        </div>
      ) : null}

      <div className="mt-10">
        <InvestmentMetrics view={view} />
      </div>

      <div className="mt-14 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-x-12">
        <div className="flex min-w-0 flex-col gap-14 lg:col-span-8">
          {view.estimate && view.isOpen ? <TermDepositEstimate estimate={view.estimate} /> : null}
          {view.valuationSeries.length >= 2 ? (
            <Section id="evolucao" title="Evolução do valor">
              <div className="mt-5">
                <ValuationChart series={view.valuationSeries} />
              </div>
            </Section>
          ) : null}
          <Timeline
            entries={view.timeline}
            transactions={view.transactions}
            context={context}
            editable={view.isOpen}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-14 lg:col-span-4">
          <InvestmentReminders
            reminders={view.reminders}
            investmentId={investment.id}
            investmentName={investment.name}
            today={view.today}
            editable={investment.status !== 'archived'}
          />
          <InvestmentDetails view={view} />
          <InvestmentNotes notes={investment.notes} />
        </div>
      </div>
    </>
  );
}
