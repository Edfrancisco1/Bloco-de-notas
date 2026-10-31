import type { Metadata } from 'next';
import { NewInvestmentForm } from '@/components/investments/form/new-investment-form';
import { getOnboardedRepository } from '@/lib/data';
import { INVESTMENT_TYPES, type InvestmentType } from '@/lib/domain/types';
import { getInvestmentFormOptions } from '@/lib/services/investment-detail';

export const metadata: Metadata = { title: 'Novo investimento' };

export default async function NewInvestmentPage({
  searchParams,
}: PageProps<'/app/investimentos/novo'>) {
  const { tipo } = await searchParams;
  const repo = await getOnboardedRepository();
  const options = await getInvestmentFormOptions(repo);
  const initialType =
    typeof tipo === 'string' && (INVESTMENT_TYPES as readonly string[]).includes(tipo)
      ? (tipo as InvestmentType)
      : null;

  return (
    <>
      <p className="mx-auto mb-6 max-w-3xl eyebrow">Novo investimento</p>
      <NewInvestmentForm options={options} initialType={initialType} />
    </>
  );
}
