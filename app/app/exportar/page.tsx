import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import type { Metadata } from 'next';
import { PageHeader, Section } from '@/components/common/section';
import { buttonVariants } from '@/components/ui/button';
import { getOnboardedRepository } from '@/lib/data';

export const metadata: Metadata = { title: 'Exportar dados' };

const CSV_FILES = [
  ['investimentos', 'Investimentos', 'Nome, tipo, estado, datas, detalhes e notas'],
  ['movimentos', 'Movimentos', 'Compras, vendas, juros, dividendos, comissões e impostos'],
  ['avaliacoes', 'Avaliações', 'Histórico dos valores registados'],
  ['lembretes', 'Lembretes', 'Prazos e estado'],
  ['carteiras', 'Carteiras', 'Incluindo as arquivadas'],
  ['instituicoes', 'Instituições', 'Incluindo as arquivadas'],
] as const;

export default async function ExportPage() {
  const repo = await getOnboardedRepository();
  const [investments, transactions] = await Promise.all([
    repo.listInvestments({ includeArchived: true }),
    repo.listTransactions(),
  ]);

  return (
    <>
      <PageHeader
        title="Exportar dados"
        description="Os dados são seus. Descarregue tudo, quando quiser, num formato aberto."
      />
      <p className="mt-4 text-sm text-ink-3">
        {investments.length} investimentos e {transactions.length} movimentos na conta.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-x-12">
        <Section
          id="json"
          title="Tudo num ficheiro"
          description="JSON com perfil, carteiras, instituições, investimentos, movimentos, avaliações, lembretes e registo de auditoria."
          className="lg:col-span-5"
        >
          <a
            href="/app/exportar/json"
            download
            className={buttonVariants({ size: 'lg', className: 'mt-6' })}
          >
            <FileJson aria-hidden strokeWidth={1.75} />
            Descarregar JSON
          </a>
          <p className="mt-4 text-[0.8125rem] leading-relaxed text-ink-3">
            Os valores vão em texto decimal com ponto (ex.: 1234567.89) para não perder precisão.
          </p>
        </Section>

        <Section
          id="csv"
          title="Tabelas CSV"
          description="Uma tabela por tipo de dado. Abre no Excel ou Google Sheets (UTF-8, vírgula como separador, datas AAAA-MM-DD)."
          className="lg:col-span-7"
        >
          <ul className="divide-y divide-rule">
            {CSV_FILES.map(([entity, title, description]) => (
              <li key={entity} className="flex items-center gap-4 py-3.5">
                <FileSpreadsheet
                  aria-hidden
                  className="size-5 shrink-0 text-ink-3"
                  strokeWidth={1.5}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] font-medium text-ink">{title}</p>
                  <p className="text-sm text-ink-3">{description}</p>
                </div>
                <a
                  href={`/app/exportar/csv/${entity}`}
                  download
                  className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                  aria-label={`Descarregar ${title} em CSV`}
                >
                  <Download aria-hidden strokeWidth={1.75} />
                  CSV
                </a>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </>
  );
}
