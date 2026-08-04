import { ConnectWallet } from '@/components/ConnectWallet';
import { usePaymentGateway } from '@/hooks/usePaymentGateway';
import {
  fiatGatewayAvailable,
  openExternalUrl,
  paymentChainLabel,
  type PaymentMethod,
} from '@/lib/payment-gateway';
import { buildUniswapRaiseUsdcUrl } from '@/lib/token-markets';

type PaymentGatewayPanelProps = {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  address?: `0x${string}`;
  solanaAddress?: string;
  isConnected: boolean;
  amountUsd: string;
  onFunded?: () => void;
  /** Light (SalePage) vs dark (ContributePage) surface. */
  variant?: 'light' | 'dark';
};

const METHODS: Array<[PaymentMethod, string]> = [
  ['usdc', 'USDC'],
  ['crypto', 'Crypto'],
  ['fiat', 'Card / Coinbase'],
];

export function PaymentGatewayPanel({
  paymentMethod,
  onPaymentMethodChange,
  address,
  solanaAddress,
  isConnected,
  amountUsd,
  onFunded,
  variant = 'light',
}: PaymentGatewayPanelProps) {
  const gateway = usePaymentGateway({ address, solanaAddress, amountUsd, onFunded });
  const light = variant === 'light';

  const panelClass = light
    ? 'mt-3 border-2 border-black bg-[#f4f1f8] p-4'
    : 'mt-3 border border-white/15 bg-white/5 p-4';
  const tabActive = light ? 'bg-[#ffeb55]' : 'bg-primary text-white';
  const tabIdle = light ? 'bg-white hover:bg-[#f4f1f8]' : 'bg-surface hover:bg-white/10';
  const tabBase = light
    ? 'border-2 border-black px-2 py-3 font-mono text-[10px] font-bold uppercase'
    : 'border border-white/20 px-2 py-3 font-mono text-[10px] font-bold uppercase';
  const btnPrimary = light
    ? 'border-2 border-black bg-[#7047eb] px-4 py-3 font-mono text-xs font-bold uppercase text-white disabled:opacity-50'
    : 'border border-primary bg-primary px-4 py-3 font-mono text-xs font-bold uppercase text-white disabled:opacity-50';
  const btnSecondary = light
    ? 'border-2 border-black bg-white px-4 py-3 font-mono text-xs font-bold uppercase disabled:opacity-50'
    : 'border border-white/25 bg-transparent px-4 py-3 font-mono text-xs font-bold uppercase disabled:opacity-50';
  const textMuted = light ? 'text-xs leading-relaxed' : 'text-xs leading-relaxed text-muted';
  const labelClass = light
    ? 'font-mono text-[11px] font-bold uppercase'
    : 'font-mono text-[11px] font-bold uppercase text-muted';

  function openUniswapRaise() {
    const href = buildUniswapRaiseUsdcUrl({
      wallet: address,
      amountUsdc: amountUsd,
      fromNative: true,
    });
    if (!href) return;
    openExternalUrl(href);
    onFunded?.();
  }

  return (
    <div>
      <p className={labelClass}>Payment route</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {METHODS.map(([method, label]) => (
          <button
            key={method}
            type="button"
            onClick={() => onPaymentMethodChange(method)}
            className={`${tabBase} ${paymentMethod === method ? tabActive : tabIdle}`}
          >
            {label}
          </button>
        ))}
      </div>

      {paymentMethod === 'usdc' && (
        <p className={`mt-3 ${textMuted}`}>
          Contribute with USDC already in your wallet. Settlement is on {paymentChainLabel()}. This
          funds your raise allocation directly.
        </p>
      )}

      {paymentMethod === 'crypto' && (
        <div className={panelClass}>
          <p className={textMuted}>
            Accept crypto for the raise: swap ETH, USDT, or any token to USDC on Uniswap (Base), then
            select USDC to lock your allocation. Sale contract settles in USDC only.
          </p>
          {!isConnected ? (
            <div className="mt-3">
              <ConnectWallet light={light} className="w-full py-3 text-xs" />
            </div>
          ) : (
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                disabled={Boolean(gateway.busy)}
                onClick={openUniswapRaise}
                className={btnPrimary}
              >
                Uniswap · any crypto → USDC (raise)
              </button>
              <button
                type="button"
                disabled={Boolean(gateway.busy)}
                onClick={() => gateway.swapToUsdc('eth')}
                className={btnSecondary}
              >
                {gateway.busy === 'eth' ? 'Opening swap…' : 'ETH → USDC'}
              </button>
              <button
                type="button"
                disabled={Boolean(gateway.busy)}
                onClick={() => gateway.swapToUsdc('usdt')}
                className={btnSecondary}
              >
                {gateway.busy === 'usdt' ? 'Opening swap…' : 'USDT → USDC'}
              </button>
              <button
                type="button"
                disabled={Boolean(gateway.busy)}
                onClick={() => gateway.swapToUsdc('other')}
                className={btnSecondary}
              >
                {gateway.busy === 'other' ? 'Opening swap…' : 'Other crypto → USDC'}
              </button>
            </div>
          )}
          <p className={`mt-3 font-mono text-[10px] uppercase ${light ? 'text-[#77727e]' : 'text-muted'}`}>
            Uniswap / Aerodrome on Base. After the swap, select USDC and confirm contribution.
          </p>
        </div>
      )}

      {paymentMethod === 'fiat' && (
        <div className={panelClass}>
          <p className={textMuted}>
            Buy USDC with a debit/credit card via Coinbase — for your Base (EVM) allocation wallet or a
            linked Solana wallet. Then return here and select USDC to invest.
          </p>
          {!isConnected ? (
            <div className="mt-3">
              <ConnectWallet light={light} className="w-full py-3 text-xs" />
            </div>
          ) : fiatGatewayAvailable() ? (
            <div className="mt-3 grid gap-2">
              {gateway.coinbaseAvailable && (
                <button
                  type="button"
                  disabled={Boolean(gateway.busy)}
                  onClick={() => void gateway.buyWithCoinbase()}
                  className={btnPrimary}
                >
                  {gateway.busy === 'coinbase'
                    ? 'Opening Coinbase…'
                    : 'Coinbase card → Base (EVM) USDC'}
                </button>
              )}
              {gateway.coinbaseAvailable && (
                <button
                  type="button"
                  disabled={Boolean(gateway.busy) || !gateway.hasSolanaWallet}
                  onClick={() => void gateway.buyWithCoinbaseSolana()}
                  className={btnSecondary}
                  title={
                    gateway.hasSolanaWallet
                      ? 'Fund linked Solana wallet with Coinbase card'
                      : 'Link Phantom, Solflare, or Coinbase Solana first'
                  }
                >
                  {gateway.busy === 'coinbase-solana'
                    ? 'Opening Coinbase…'
                    : gateway.hasSolanaWallet
                      ? 'Coinbase card → Solana USDC'
                      : 'Link Solana wallet for Coinbase'}
                </button>
              )}
              {gateway.rampAvailable && (
                <button
                  type="button"
                  disabled={Boolean(gateway.busy)}
                  onClick={() => void gateway.buyWithRamp()}
                  className={btnSecondary}
                >
                  {gateway.busy === 'ramp' ? 'Opening Ramp…' : 'Pay with Ramp (card / Apple Pay)'}
                </button>
              )}
              {gateway.externalFiatAvailable && (
                <button
                  type="button"
                  disabled={Boolean(gateway.busy)}
                  onClick={gateway.buyWithExternalFiat}
                  className={btnSecondary}
                >
                  Open external on-ramp ↗
                </button>
              )}
            </div>
          ) : (
            <p className="mt-3 font-mono text-[10px] font-bold uppercase text-[#a13b3b]">
              Card / fiat gateway is not configured. Set VITE_PRIVY_APP_ID (Coinbase) or
              VITE_RAMP_HOST_API_KEY (Ramp).
            </p>
          )}
          <p className={`mt-3 font-mono text-[10px] uppercase ${light ? 'text-[#77727e]' : 'text-muted'}`}>
            Sale settles in Base USDC. Solana card buys fund Solana — bridge/swap to your Base wallet
            before confirming. Never send funds to a sale address.
          </p>
        </div>
      )}

      {gateway.error && (
        <p className="mt-3 border-l-4 border-[#a13b3b] bg-[#fff4f4] p-3 font-mono text-[10px] text-[#a13b3b]">
          {gateway.error}
        </p>
      )}
    </div>
  );
}
