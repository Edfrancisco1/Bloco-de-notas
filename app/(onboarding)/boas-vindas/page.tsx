import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Wordmark } from '@/components/common/wordmark';
import { OnboardingFlow } from '@/components/onboarding/onboarding-flow';
import { getRepository } from '@/lib/data';

export const metadata: Metadata = { title: 'Boas-vindas' };

const PREFERRED = [
  'Africa/Luanda',
  'Africa/Johannesburg',
  'Africa/Maputo',
  'Africa/Lagos',
  'Europe/Lisbon',
];

export default async function WelcomePage() {
  const repo = await getRepository();
  const profile = await repo.getProfile();
  if (profile.onboardedAt) redirect('/app');
  const all = Intl.supportedValuesOf('timeZone');
  const timezones = [...PREFERRED, ...all.filter((z) => !PREFERRED.includes(z))];

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 py-10 sm:py-16">
      <Wordmark className="mb-14 self-start" />
      <OnboardingFlow initialName={profile.displayName ?? ''} timezones={timezones} />
    </main>
  );
}
