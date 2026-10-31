import { ArrowLeft } from 'lucide-react';
import type { Metadata, Route } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EditInvestmentForm } from '@/components/investments/form/edit-investment-form';
import { getOnboardedRepository } from '@/lib/data';
import { investmentTypeLabel } from '@/lib/domain/labels';
import { getInvestmentFormOptions } from '@/lib/services/investment-detail';

export const metadata: Metadata = { title: 'Editar investimento' };

export default async function EditInvestmentPage({
  params,
}: PageProps<'/app/investimentos/[id]/editar'>) {
  const { id } = await params;
  const repo = await getOnboardedRepository();
  const [investment, options] = await Promise.all([
    repo.getInvestment(id),
    getInvestmentFormOptions(repo),
  ]);
  if (!investment) notFound();

  return (
    <>
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/app/investimentos/${id}` as Route}
          className="inline-flex items-center gap-1.5 text-sm text-ink-3 underline-offset-4 hover:text-ink hover:underline"
        >
          <ArrowLeft aria-hidden className="size-4" strokeWidth={1.75} />
          {investment.name}
        </Link>
        <h1 className="mt-5 font-serif text-display text-ink">Editar dados</h1>
        <p className="mt-2 text-ink-2">
          {investmentTypeLabel[investment.type]}. Os valores (compras, vendas, juros, avaliações)
          alteram-se pelos movimentos, para manter o histórico.
        </p>
      </div>
      <div className="mt-10">
        <EditInvestmentForm investment={investment} options={options} />
      </div>
    </>
  );
}
