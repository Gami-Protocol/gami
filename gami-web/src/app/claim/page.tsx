'use client';

import { useState } from 'react';

const VESTING_ABI = [
  {
    name: 'claimable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'beneficiary', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

export default function ClaimPage() {
  const [wallet, setWallet] = useState('');
  const [claimable, setClaimable] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function checkClaimable() {
    if (!wallet.startsWith('0x')) return;
    setLoading(true);
    try {
      const { createPublicClient, http, formatEther } = await import('viem');
      const { baseSepolia } = await import('viem/chains');
      const vestingAddress = process.env.NEXT_PUBLIC_VESTING_ADDRESS as `0x${string}`;
      if (!vestingAddress) {
        setClaimable('Vesting contract not deployed yet');
        return;
      }
      const client = createPublicClient({ chain: baseSepolia, transport: http() });
      const amount = await client.readContract({
        address: vestingAddress,
        abi: VESTING_ABI,
        functionName: 'claimable',
        args: [wallet as `0x${string}`],
      });
      setClaimable(formatEther(amount));
    } catch {
      setClaimable('0');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <h1 className="font-display text-3xl font-bold">Claim $GAMI</h1>
      <p className="mt-2 text-muted">Claim your vested tokens after TGE. 15% unlocks immediately, remainder vests over 12 months.</p>

      <div className="mt-8 space-y-4">
        <div>
          <label className="font-mono text-xs text-muted">WALLET ADDRESS</label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="mt-1 w-full border-2 border-white/10 bg-surface p-3 font-mono text-sm focus:border-primary outline-none"
            placeholder="0x..."
          />
        </div>
        <button
          onClick={checkClaimable}
          disabled={loading}
          className="sticker-shadow w-full bg-primary py-4 font-display font-bold uppercase disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check Claimable Amount'}
        </button>
      </div>

      {claimable !== null && (
        <div className="sticker-shadow mt-8 border-2 border-white/10 bg-surface p-6 text-center">
          <p className="font-mono text-xs text-muted">CLAIMABLE</p>
          <p className="font-mono text-3xl font-bold text-primary">{claimable} GAMI</p>
          <p className="mt-4 text-sm text-muted">
            Use the Gami Wallet app for one-tap claim, or connect wallet here when TGE is live.
          </p>
        </div>
      )}
    </div>
  );
}
