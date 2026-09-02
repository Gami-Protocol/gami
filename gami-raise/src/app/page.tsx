import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Wallet } from 'lucide-react';

import { GamiBrandLogo } from '@/components/brand/logo';
import { HeroScene } from '@/components/home/hero-scene';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { RAISE, RAISE_STEPS } from '@/lib/constants';
import { formatUsd } from '@/lib/utils';

const PORTALS = [
  {
    title: 'Investors',
    detail: 'Fund registration, pitch deck access, meetings, and data room requests.',
    href: '/investors',
  },
  {
    title: 'Partners',
    detail: 'Apply for integrations, request SDK access, and track approvals.',
    href: '/partners',
  },
  {
    title: 'Developers',
    detail: 'API keys, project dashboards, analytics, and webhook logs.',
    href: '/developers',
  },
  {
    title: 'Community',
    detail: 'Waitlist, XP, referrals, leaderboard, and TGE readiness.',
    href: '/community',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-6">
        <HeroScene />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <GamiBrandLogo
              variant="landing"
              priority
              className="mb-6 h-20 w-20 drop-shadow-[0_0_40px_rgba(108,59,255,0.55)] sm:h-24 sm:w-24"
            />
            <Badge>Official raise portal</Badge>
            <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              GAMI
              <span className="block bg-gradient-to-r from-white via-[#cbbdff] to-[#3B82F6] bg-clip-text text-transparent">
                Raise Platform
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              The production fundraising portal for ICO participation, TGE registration, waitlist,
              investor access, and partner/developer onboarding — secured by Privy wallets.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/raise">
                  Enter raise flow <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/waitlist">Join waitlist</Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
              {[
                ['Hard cap', formatUsd(RAISE.hardCapUsd)],
                ['Price', `$${RAISE.priceUsd}`],
                ['Wallet cap', formatUsd(RAISE.perWalletCapUsd)],
              ].map(([label, value]) => (
                <div key={label} className="glass-panel rounded-2xl p-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-lg font-semibold">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <CardTitle>Raise flow</CardTitle>
            <CardDescription>Eight steps from wallet connect to dashboard readiness.</CardDescription>
            <div className="mt-6 space-y-3">
              {RAISE_STEPS.slice(0, 5).map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-3 py-3"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6C3BFF]/20 text-xs font-semibold text-[#cbbdff]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-xs text-white/45">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild className="mt-6 w-full">
              <Link href="/raise">Continue onboarding</Link>
            </Button>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <Badge>Portals</Badge>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-semibold">
              One platform. Every stakeholder.
            </h2>
          </div>
          <Button asChild variant="ghost">
            <Link href="/docs">Read docs</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PORTALS.map((portal) => (
            <Link key={portal.href} href={portal.href}>
              <Card className="h-full transition hover:border-[#6C3BFF]/40 hover:bg-white/[0.05]">
                <CardTitle>{portal.title}</CardTitle>
                <CardDescription>{portal.detail}</CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-28 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Wallet,
              title: 'Privy wallets',
              detail: 'Embedded wallets, social login, and external wallet linking in one flow.',
            },
            {
              icon: ShieldCheck,
              title: 'Security first',
              detail: 'Turnstile, rate limits, RBAC, audit logs, and verified wallet ownership.',
            },
            {
              icon: Sparkles,
              title: 'TGE ready',
              detail: 'Allocations, vesting, referrals, XP, and countdown surfaces built in.',
            },
          ].map((item) => (
            <Card key={item.title}>
              <item.icon className="h-5 w-5 text-[#cbbdff]" />
              <CardTitle className="mt-4">{item.title}</CardTitle>
              <CardDescription>{item.detail}</CardDescription>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
