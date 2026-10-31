import { BottomNav, MobileTopBar } from '@/components/shell/mobile-nav';
import { Sidebar } from '@/components/shell/sidebar';
import { requireSession } from '@/lib/auth/session';
import { getRepository } from '@/lib/data';

export default async function AppLayout({ children }: LayoutProps<'/app'>) {
  const session = await requireSession();
  const profile = await (await getRepository()).getProfile();

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar para o conteúdo
      </a>
      <Sidebar name={profile.displayName} email={session.email} isDemo={session.isDemo} />
      <div className="min-w-0">
        <MobileTopBar isDemo={session.isDemo} />
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-[72rem] px-4 pt-6 pb-28 outline-none sm:px-6 lg:px-12 lg:pt-12 lg:pb-20"
        >
          {children}
        </main>
      </div>
      <BottomNav name={profile.displayName} email={session.email} />
    </div>
  );
}
