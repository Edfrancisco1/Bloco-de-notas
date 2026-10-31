import type { Metadata } from 'next';
import { LegalPage } from '@/components/common/legal-page';

export const metadata: Metadata = { title: 'Termos' };

export default function TermsPage() {
  return (
    <LegalPage title="Termos de utilização" updated="outubro de 2026">
      <section>
        <h2>O que é o InvestNote</h2>
        <p>
          Uma ferramenta para registar e organizar os seus investimentos. Os valores, cálculos e
          estimativas baseiam-se exclusivamente na informação que regista.
        </p>
      </section>
      <section>
        <h2>Sem aconselhamento</h2>
        <p>
          O InvestNote não presta aconselhamento financeiro, fiscal ou jurídico, não recomenda a
          compra ou venda de ativos e não executa ordens, transferências ou pagamentos. As
          estimativas (por exemplo, juros de um depósito) são indicativas: o valor confirmado é
          sempre o da sua instituição.
        </p>
      </section>
      <section>
        <h2>A sua responsabilidade</h2>
        <ul>
          <li>Manter a palavra-passe segura e os registos atualizados.</li>
          <li>Confirmar junto das instituições os valores, taxas e prazos.</li>
        </ul>
      </section>
      <section>
        <h2>Fase de testes</h2>
        <p>
          Durante a fase de testes o serviço é gratuito e pode mudar. Avisaremos com antecedência de
          alterações relevantes. Pode exportar os seus dados a qualquer momento.
        </p>
      </section>
    </LegalPage>
  );
}
