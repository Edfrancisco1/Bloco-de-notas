import ReactMarkdown from 'react-markdown';
import { Section } from '@/components/common/section';
import {
  alternativeSubtypeLabel,
  dayCountBasisLabel,
  interestMethodLabel,
  paymentFrequencyLabel,
  rateTypeLabel,
  securityAssetClassLabel,
} from '@/lib/domain/labels';
import { formatDate } from '@/lib/formatters/dates';
import { formatMoney, formatRate } from '@/lib/formatters/money';
import type { InvestmentDetailView } from '@/lib/services/investment-detail';

function rowsFor(view: InvestmentDetailView): [string, string][] {
  const { investment } = view;
  const d = investment.details;
  const rows: [string, string][] = [
    ['Tipo', view.typeLabel],
    ['Carteira', view.portfolio?.name ?? '—'],
    ['Instituição', view.institution?.name ?? 'Sem instituição'],
    ['Início', formatDate(investment.startDate)],
  ];
  if (investment.maturityDate) rows.push(['Vencimento', formatDate(investment.maturityDate)]);
  if (investment.symbol) rows.push(['Símbolo', investment.symbol]);
  switch (d.kind) {
    case 'term_deposit':
      rows.push(['Capital', formatMoney(d.principal)]);
      rows.push([
        'Taxa anual',
        `${formatRate(d.annualRate)} (${rateTypeLabel[d.rateType].toLowerCase()})`,
      ]);
      rows.push([
        'Juros',
        d.interestMethod === 'compound'
          ? `${interestMethodLabel.compound} ${paymentFrequencyLabel[d.compoundingFrequency].toLowerCase()}`
          : interestMethodLabel.simple,
      ]);
      rows.push([
        'Convenção de dias',
        d.dayCountBasis === 'custom'
          ? `${d.customDayCount} dias/ano`
          : dayCountBasisLabel[d.dayCountBasis],
      ]);
      rows.push(['Renovação automática', d.autoRenew ? 'Sim' : 'Não']);
      if (d.estimatedTaxRate) rows.push(['Retenção estimada', formatRate(d.estimatedTaxRate)]);
      break;
    case 'bond':
      if (d.issuer) rows.push(['Emitente', d.issuer]);
      if (d.nominalValue) rows.push(['Valor nominal', formatMoney(d.nominalValue)]);
      if (d.couponRate) rows.push(['Taxa de cupão', formatRate(d.couponRate)]);
      if (d.couponFrequency)
        rows.push(['Frequência do cupão', paymentFrequencyLabel[d.couponFrequency]]);
      break;
    case 'security':
      rows.push(['Tipo de ativo', securityAssetClassLabel[d.assetClass]]);
      if (d.market) rows.push(['Mercado', d.market]);
      break;
    case 'crypto':
      if (d.network) rows.push(['Rede', d.network]);
      break;
    case 'alternative':
      rows.push(['Subtipo', alternativeSubtypeLabel[d.subtype]]);
      if (d.platformOrProject) rows.push(['Plataforma ou projeto', d.platformOrProject]);
      if (d.expectedRate) rows.push(['Taxa esperada', formatRate(d.expectedRate)]);
      if (d.expectedExitDate) rows.push(['Saída esperada', formatDate(d.expectedExitDate)]);
      break;
    default:
      break;
  }
  for (const field of investment.customFields) rows.push([field.key, field.value || '—']);
  if (investment.tags.length) rows.push(['Etiquetas', investment.tags.join(', ')]);
  return rows;
}

export function InvestmentDetails({ view }: { view: InvestmentDetailView }) {
  return (
    <Section id="detalhes" title="Detalhes">
      <dl className="divide-y divide-rule">
        {rowsFor(view).map(([label, value]) => (
          <div
            key={label}
            className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-3 py-2.5 text-[0.9375rem]"
          >
            <dt className="text-sm text-ink-3">{label}</dt>
            <dd className="min-w-0 [overflow-wrap:anywhere] text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

/** Notas em Markdown limitado: sem HTML, só formatação básica e ligações seguras. */
export function InvestmentNotes({ notes }: { notes: string | null }) {
  if (!notes) return null;
  return (
    <Section id="notas" title="Notas">
      <div className="prose-notes mt-3 text-[0.9375rem] leading-relaxed text-ink-2">
        <ReactMarkdown
          skipHtml
          allowedElements={['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'code', 'br', 'blockquote']}
          unwrapDisallowed
          components={{
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent underline decoration-accent/40 underline-offset-4"
              >
                {children}
              </a>
            ),
            ul: ({ children }) => <ul className="my-2 list-disc pl-5">{children}</ul>,
            ol: ({ children }) => <ol className="my-2 list-decimal pl-5">{children}</ol>,
            p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
            code: ({ children }) => (
              <code className="rounded-sm bg-paper-sunken px-1 py-0.5 text-[0.875em]">
                {children}
              </code>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-2 border-l-2 border-rule-strong pl-3 text-ink-3">
                {children}
              </blockquote>
            ),
          }}
        >
          {notes}
        </ReactMarkdown>
      </div>
    </Section>
  );
}
