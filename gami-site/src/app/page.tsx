import { Hero } from '@/components/hero';
import { AiChat } from '@/components/chat/ai-chat';
import { WalletSection } from '@/components/sections/wallet-section';
import { PartnersSection } from '@/components/sections/partners-section';
import { DevelopersSection } from '@/components/sections/developers-section';
import { AiSection } from '@/components/sections/ai-section';
import { BlockchainSection } from '@/components/sections/blockchain-section';
import { TokenSection } from '@/components/sections/token-section';
import { RoadmapSection } from '@/components/sections/roadmap-section';
import { ButtonLink } from '@/components/ui/button';

export default function HomePage() {
  return (
    <>
      <Hero />
      <AiChat />
      <WalletSection />
      <PartnersSection />
      <DevelopersSection />
      <AiSection />
      <BlockchainSection />
      <TokenSection />
      <RoadmapSection />
      <section className="mx-auto max-w-6xl px-5 pb-28 md:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-primary/30 via-card to-accent/20 p-10 md:p-14">
          <h2 className="max-w-2xl font-[family-name:var(--font-syne)] text-3xl font-semibold md:text-5xl">
            Join the waitlist and help shape the next layer of engagement.
          </h2>
          <p className="mt-4 max-w-xl text-zinc-300">
            Early members get priority access to wallet beta, SDK, partner programs, and protocol
            updates.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/waitlist" size="lg">
              Join Waitlist
            </ButtonLink>
            <ButtonLink href="/wallet" variant="secondary" size="lg">
              Download Wallet
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
