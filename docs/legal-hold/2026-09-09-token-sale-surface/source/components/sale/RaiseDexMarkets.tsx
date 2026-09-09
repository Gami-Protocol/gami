import {
  GAMI_PROTOCOL_CHAIN_REPO,
  gamiEvmTokenAddress,
  gamiSolanaMint,
  openDex,
  raiseDexMarkets,
} from '@/lib/token-markets';

type RaiseDexMarketsProps = {
  wallet?: string;
  amountUsd?: string;
  variant?: 'light' | 'dark';
};

export function RaiseDexMarkets({
  wallet,
  amountUsd,
  variant = 'light',
}: RaiseDexMarketsProps) {
  const light = variant === 'light';
  const markets = raiseDexMarkets({ wallet, amountUsd });
  const evm = gamiEvmTokenAddress();
  const sol = gamiSolanaMint();

  const panel = light
    ? 'border-2 border-black bg-[#f4f1f8] p-4'
    : 'border border-white/15 bg-white/5 p-4';
  const btn = light
    ? 'border-2 border-black bg-white px-3 py-3 text-left font-mono text-[10px] font-bold uppercase hover:bg-[#ffeb55] disabled:opacity-40'
    : 'border border-white/20 bg-surface px-3 py-3 text-left font-mono text-[10px] font-bold uppercase hover:border-primary disabled:opacity-40';
  const muted = light ? 'text-[#77727e]' : 'text-muted';

  return (
    <div className={panel}>
      <p className={`font-mono text-[11px] font-bold uppercase ${light ? '' : 'text-muted'}`}>
        Get $GAMI · raise markets
      </p>
      <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
        Start on Uniswap (EVM / Base), then Raydium + Jupiter on Solana. Token addresses from{' '}
        <a
          href={GAMI_PROTOCOL_CHAIN_REPO}
          target="_blank"
          rel="noopener noreferrer"
          className={light ? 'underline' : 'text-gami-accent underline'}
        >
          gami-protocol-chain
        </a>
        .
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {markets.map((market) => (
          <button
            key={market.id}
            type="button"
            disabled={!market.href}
            onClick={() => openDex(market.href)}
            className={btn}
            title={market.href ? market.blurb : `${market.label} address not configured`}
          >
            <span className="block">{market.label}</span>
            <span className={`mt-1 block font-normal normal-case ${muted}`}>
              {market.network} · {market.href ? market.blurb : 'Set token mint'}
            </span>
          </button>
        ))}
      </div>
      <p className={`mt-3 break-all font-mono text-[9px] uppercase ${muted}`}>
        EVM {evm ? `${evm.slice(0, 6)}…${evm.slice(-4)}` : 'unset'}
        {sol ? ` · SOL ${sol.slice(0, 4)}…${sol.slice(-4)}` : ' · SOL mint unset'}
      </p>
    </div>
  );
}
