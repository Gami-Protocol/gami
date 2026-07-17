import type { Metadata } from 'next';
import { WalletSection } from '@/components/sections/wallet-section';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Wallet',
  description: 'Download the Gami Wallet for XP, rewards, quests, staking, and cross-chain assets.',
};

export default function WalletPage() {
  return (
    <div className="pt-24">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.24em] text-secondary">
          Gami Wallet
        </p>
        <h1 className="max-w-3xl font-[family-name:var(--font-syne)] text-4xl font-semibold md:text-6xl">
          The easiest way to participate in Gami
        </h1>
        <p className="mt-4 max-w-2xl text-zinc-400">
          Universal rewards, cross-chain assets, AI-powered quests, and secure identity — in one
          app.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="#" size="lg">
            Download on App Store
          </ButtonLink>
          <ButtonLink href="#" variant="secondary" size="lg">
            Get it on Google Play
          </ButtonLink>
          <ButtonLink href="/waitlist" variant="ghost" size="lg">
            Join Beta
          </ButtonLink>
        </div>
      </div>
      <WalletSection />
    </div>
  );
}
