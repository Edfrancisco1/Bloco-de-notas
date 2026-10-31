import type { Metadata } from 'next';
import { LegalPage } from '@/components/common/legal-page';

export const metadata: Metadata = { title: 'Privacidade' };

export default function PrivacyPage() {
  return (
    <LegalPage title="Política de privacidade" updated="outubro de 2026">
      <section>
        <h2>Que dados recolhemos</h2>
        <ul>
          <li>Dados de conta: e-mail, nome que indicar e fuso horário.</li>
          <li>
            Os registos que fizer: carteiras, instituições, investimentos, movimentos, avaliações,
            notas e lembretes.
          </li>
          <li>
            Dados técnicos mínimos para segurança (por exemplo, registos de erros sem valores).
          </li>
        </ul>
      </section>
      <section>
        <h2>O que não fazemos</h2>
        <ul>
          <li>Não ligamos a bancos, corretoras ou wallets e não pedimos credenciais de acesso.</li>
          <li>Não vendemos dados nem os usamos para publicidade.</li>
          <li>
            Não enviamos montantes, notas ou nomes de ativos para ferramentas de análise de
            utilização.
          </li>
        </ul>
      </section>
      <section>
        <h2>Para que servem</h2>
        <p>
          Apenas para lhe mostrar e calcular a sua própria informação: totais, resultados, prazos e
          lembretes. Cada conta só vê os seus dados.
        </p>
      </section>
      <section>
        <h2>Os seus direitos</h2>
        <ul>
          <li>Consultar e corrigir os seus dados a qualquer momento na aplicação.</li>
          <li>Exportar todos os dados em JSON ou CSV (Definições → Exportar dados).</li>
          <li>Eliminar a conta e todos os dados associados (Definições → Eliminar conta).</li>
        </ul>
      </section>
      <section>
        <h2>Conservação</h2>
        <p>
          Os dados ficam guardados enquanto a conta existir. A política de retenção de cópias de
          segurança e o procedimento de recuperação serão definidos antes do lançamento.
        </p>
      </section>
    </LegalPage>
  );
}
