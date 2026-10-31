import type { Metadata } from 'next';
import { PageHeader, Section } from '@/components/common/section';
import { DeleteAccount, ProfileForm } from '@/components/settings/settings-forms';
import { Button } from '@/components/ui/button';
import { resetDemoAction } from '@/lib/actions/demo';
import { requireSession } from '@/lib/auth/session';
import { getRepository } from '@/lib/data';
import { MARKET } from '@/lib/domain/market';

export const metadata: Metadata = { title: 'Definições' };

const SUGGESTED_ZONES = [
  'Africa/Luanda',
  'Africa/Johannesburg',
  'Africa/Maputo',
  'Africa/Lagos',
  'Europe/Lisbon',
  'Europe/London',
  'America/Sao_Paulo',
];

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[14rem_minmax(0,1fr)] sm:gap-6">
      <dt className="text-sm font-medium text-ink">{label}</dt>
      <dd className="text-[0.9375rem] text-ink-2">{children}</dd>
    </div>
  );
}

export default async function SettingsPage() {
  const session = await requireSession();
  const repo = await getRepository();
  const profile = await repo.getProfile();
  const allZones = Intl.supportedValuesOf('timeZone');

  return (
    <>
      <PageHeader title="Definições" description={profile.email} />

      <div className="mt-12 flex flex-col gap-14">
        <Section id="perfil" title="Perfil">
          <ProfileForm
            displayName={profile.displayName ?? ''}
            timezone={profile.timezone}
            suggested={SUGGESTED_ZONES}
            all={allZones}
          />
        </Section>

        <Section id="moeda" title="Moeda e valores">
          <dl className="divide-y divide-rule">
            <Info label="Moeda base">
              {MARKET.currencyName} ({MARKET.baseCurrency}) — valores como{' '}
              <span className="figures-table">1 234 567,89 Kz</span>. Outras moedas (USD, EUR)
              chegam numa fase seguinte, com taxas de câmbio manuais.
            </Info>
            <Info label="Valor desatualizado">
              Uma avaliação com mais de {MARKET.staleAfterDays} dias é marcada como desatualizada e
              aparece em «Precisa de atenção». Este limite será configurável no futuro.
            </Info>
          </dl>
        </Section>

        {session.isDemo ? (
          <Section
            id="dados-demo"
            title="Dados de demonstração"
            description="Os dados de exemplo vivem só na memória do servidor e são fictícios."
          >
            <div className="flex flex-col gap-3 py-5 sm:flex-row">
              <form action={resetDemoAction}>
                <input type="hidden" name="modo" value="exemplo" />
                <Button type="submit" variant="secondary">
                  Repor carteira de exemplo
                </Button>
              </form>
              <form action={resetDemoAction}>
                <input type="hidden" name="modo" value="vazia" />
                <Button type="submit" variant="secondary">
                  Começar com carteira vazia
                </Button>
              </form>
            </div>
          </Section>
        ) : null}

        <Section id="zona-perigo" title="Eliminar conta">
          <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-[0.9375rem] text-ink-2">
              Apaga a conta e todos os dados associados. Exporte primeiro se quiser guardar uma
              cópia.
            </p>
            <DeleteAccount isDemo={session.isDemo} />
          </div>
        </Section>
      </div>
    </>
  );
}
