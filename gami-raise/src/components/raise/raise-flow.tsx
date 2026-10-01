'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RAISE_STEPS } from '@/lib/constants';
import { env } from '@/lib/env';
import { cn, createReferralCode, shortenAddress } from '@/lib/utils';

const STEP_IDS = RAISE_STEPS.map((step) => step.id);

export function RaiseFlow() {
  const { ready, authenticated, login, user } = usePrivy();
  const { wallets } = useWallets();
  const { address, isConnected } = useAccount();
  const [profileName, setProfileName] = useState('');
  const [intentUsd, setIntentUsd] = useState('2500');
  const [completed, setCompleted] = useState<string[]>([]);
  const saleLive = env.saleLive();

  const walletAddress = address ?? wallets[0]?.address ?? user?.wallet?.address;
  const referralCode = useMemo(
    () => createReferralCode(walletAddress ?? user?.id ?? 'guest'),
    [user?.id, walletAddress],
  );

  const activeIndex = useMemo(() => {
    if (!authenticated) return 0;
    if (!walletAddress) return 0;
    if (!user?.email?.address) return 1;
    if (!completed.includes('verify')) return 2;
    if (!completed.includes('profile')) return 3;
    if (!completed.includes('eligibility')) return 4;
    if (!completed.includes('register')) return 5;
    if (!completed.includes('referral')) return 6;
    return 7;
  }, [authenticated, completed, user?.email?.address, walletAddress]);

  function mark(step: string) {
    setCompleted((prev) => (prev.includes(step) ? prev : [...prev, step]));
    toast.success(`${step} complete`);
  }

  async function copyReferral() {
    await navigator.clipboard.writeText(`${window.location.origin}/raise?ref=${referralCode}`);
    mark('referral');
    toast.message('Referral link copied');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="overflow-hidden p-0">
        <div className="border-b border-white/10 bg-gradient-to-r from-[#6C3BFF]/20 to-transparent px-6 py-5">
          <CardTitle>Raise onboarding</CardTitle>
          <CardDescription>
            Connect, verify, register, and prepare your allocation before TGE.
          </CardDescription>
          <Progress className="mt-4" value={((activeIndex + 1) / STEP_IDS.length) * 100} />
        </div>
        <ol className="divide-y divide-white/5">
          {RAISE_STEPS.map((step, index) => {
            const done =
              index < activeIndex ||
              completed.includes(step.id) ||
              (step.id === 'connect' && Boolean(walletAddress)) ||
              (step.id === 'signin' && authenticated) ||
              (step.id === 'verify' && completed.includes('verify'));
            const current = index === activeIndex;
            return (
              <li
                key={step.id}
                className={cn(
                  'flex items-start gap-4 px-6 py-4',
                  current && 'bg-white/[0.03]',
                  done && 'opacity-80',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs',
                    done
                      ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                      : current
                        ? 'border-[#6C3BFF] bg-[#6C3BFF]/20 text-white'
                        : 'border-white/10 text-white/40',
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div>
                  <p className="font-medium text-white">{step.title}</p>
                  <p className="mt-1 text-sm text-white/50">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardTitle>Wallet & identity</CardTitle>
          <CardDescription>
            Privy creates an embedded wallet for email/social logins and can link external wallets.
          </CardDescription>
          <div className="mt-5 space-y-3 text-sm">
            <Row label="Status" value={authenticated ? 'Signed in' : 'Signed out'} />
            <Row
              label="Wallet"
              value={
                walletAddress
                  ? `${shortenAddress(walletAddress)}${isConnected ? ' · synced' : ''}`
                  : 'Not linked'
              }
            />
            <Row label="Email" value={user?.email?.address ?? 'Not set'} />
            <Row
              label="Email verified"
              value={
                completed.includes('verify')
                  ? 'Yes'
                  : user?.email?.address
                    ? 'Pending confirmation'
                    : '—'
              }
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button disabled={!ready} onClick={() => login()}>
              {authenticated ? 'Manage account' : 'Sign in / Connect wallet'}
            </Button>
            <Button
              variant="secondary"
              disabled={!authenticated || !user?.email?.address || completed.includes('verify')}
              onClick={() => mark('verify')}
            >
              Confirm email verified
            </Button>
            {!saleLive ? (
              <Button variant="secondary" disabled>
                Contributions not live
              </Button>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardTitle>Complete profile</CardTitle>
          <CardDescription>Required before investor registration and eligibility.</CardDescription>
          <div className="mt-4 space-y-3">
            <Input
              placeholder="Display name"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
            />
            <Input
              type="number"
              min={500}
              max={2500}
              placeholder="Intended allocation (USD)"
              value={intentUsd}
              onChange={(event) => setIntentUsd(event.target.value)}
            />
            <Button
              disabled={!authenticated || !profileName.trim()}
              onClick={() => mark('profile')}
            >
              Save profile
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Eligibility & registration</CardTitle>
          <CardDescription>
            Geo/KYC gates and phase whitelist checks run before contribution opens.
          </CardDescription>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={!authenticated || !completed.includes('profile')}
              onClick={() => mark('eligibility')}
            >
              Run eligibility checks
            </Button>
            <Button
              disabled={!completed.includes('eligibility')}
              onClick={() => mark('register')}
            >
              Submit investor registration
            </Button>
          </div>
        </Card>

        <Card>
          <CardTitle>Referral + dashboard</CardTitle>
          <CardDescription>Share your code and track XP / allocation readiness.</CardDescription>
          <div className="mt-4 flex items-center gap-2">
            <Input readOnly value={referralCode} />
            <Button variant="secondary" size="icon" onClick={() => void copyReferral()}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button asChild className="mt-4 w-full" variant="outline">
            <a href="/dashboard">Open user dashboard</a>
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2">
      <span className="text-white/45">{label}</span>
      <span className="text-right text-white">{value}</span>
    </div>
  );
}
