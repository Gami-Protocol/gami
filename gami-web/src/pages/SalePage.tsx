import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

import { TOKEN_SALE_ABI, getContractAddress } from '@/lib/contracts';
import { fetchSaleStats, type SaleStats } from '@/lib/sale';

export function SalePage() {
  const [stats, setStats] = useState<SaleStats | null>(null);
  const saleAddress = getContractAddress('TOKEN_SALE');

  const { data: onChainRaised } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'totalRaised',
    query: { enabled: Boolean(saleAddress), refetchInterval: 15_000 },
  });

  const { data: hardCapRaw } = useReadContract({
    address: saleAddress ?? undefined,
    abi: TOKEN_SALE_ABI,
    functionName: 'hardCap',
    query: { enabled: Boolean(saleAddress) },
  });

  useEffect(() => {
    void fetchSaleStats().then(setStats);
  }, []);

  const onChainUsd = onChainRaised ? Number(formatUnits(onChainRaised as bigint, 6)) : 0;
  const raised = Math.max(stats?.total_raised_usd ?? 0, onChainUsd);
  const cap = hardCapRaw
    ? Number(formatUnits(hardCapRaw as bigint, 6))
    : (stats?.hard_cap_usd ?? 2_160_000);
  const pct = cap > 0 ? Math.min(100, (raised / cap) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold">Token Sale</h1>
      <p className="mt-2 text-muted">
        Phase:{' '}
        <span className="font-mono text-primary uppercase">{stats?.current_phase ?? 'public'}</span>
      </p>

      <div className="sticker-shadow mt-8 border-2 border-white/10 bg-surface p-8">
        <div className="flex justify-between font-mono text-sm">
          <span>Raised</span>
          <span>
            ${raised.toLocaleString()} / ${cap.toLocaleString()}
          </span>
        </div>
        <div className="mt-3 h-4 bg-white/10">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        {onChainUsd > 0 && (
          <p className="mt-2 font-mono text-xs text-muted">On-chain: ${onChainUsd.toLocaleString()} USDC</p>
        )}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="font-mono text-2xl font-bold text-primary">{stats?.participants_approved ?? 0}</p>
            <p className="text-xs text-muted">Participants</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold text-secondary">{stats?.waitlist_count ?? 0}</p>
            <p className="text-xs text-muted">Waitlist</p>
          </div>
          <div>
            <p className="font-mono text-2xl font-bold">$0.012</p>
            <p className="text-xs text-muted">Public Price</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          to="/sale/contribute"
          className="sticker-shadow bg-primary px-8 py-4 font-display font-bold uppercase"
        >
          Contribute Now
        </Link>
        <Link
          to="/wallet"
          className="border-2 border-white/20 px-8 py-4 font-display font-bold uppercase hover:border-primary"
        >
          Download Wallet
        </Link>
      </div>
    </div>
  );
}
