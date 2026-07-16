import { useState } from 'react';

import { ConnectWallet } from '@/components/ConnectWallet';
import { usePaymentGateway } from '@/hooks/usePaymentGateway';
import { useUniswapSwap } from '@/hooks/useUniswapSwap';
import { getExplorerTxUrl, getChainId } from '@/lib/contracts';
import {
  fiatGatewayAvailable,
  paymentChainLabel,
  type PaymentMethod,
  type SwapAsset,
} from '@/lib/payment-gateway';

type PaymentGatewayPanelProps = {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  address?: `0x${string}`;
  isConnected: boolean;
  amountUsd: string;
  onFunded?: () => void;
  /** Light (SalePage) vs dark (ContributePage) surface. */
  variant?: 'light' | 'dark';
};

const METHODS: Array<[PaymentMethod, string]> = [
  ['usdc', 'USDC'],
  ['usdt', 'USDT / Swap'],
  ['fiat', 'Card / Fiat'],
];

const SWAP_OPTIONS: Array<[SwapAsset, string]> = [
  ['usdt', 'USDT → USDC'],
  ['eth', 'ETH → USDC'],
  ['other', 'Other token → USDC'],
];

export function PaymentGatewayPanel({
  paymentMethod,
  onPaymentMethodChange,
  address,
  isConnected,
  amountUsd,
  onFunded,
  variant = 'light',
}: PaymentGatewayPanelProps) {
  const gateway = usePaymentGateway({ address, amountUsd, onFunded });
  const uniswap = useUniswapSwap({
    address,
    amountUsd,
    onComplete: onFunded,
  });
  const [selectedSwap, setSelectedSwap] = useState<SwapAsset>('usdt');
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
  const monoTiny = light ? 'text-[#77727e]' : 'text-muted';

  const swapBusy = ['quoting', 'approving', 'swapping', 'confirming'].includes(uniswap.phase);

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
          Contribute with USDC already in your wallet. Settlement is on {paymentChainLabel()}.
        </p>
      )}

      {paymentMethod === 'usdt' && (
        <div className={panelClass}>
          <p className={textMuted}>
            The sale settles in USDC. Swap via the Uniswap Trading API (
            <span className="font-mono">check_approval → quote → swap</span>
            ), then select USDC to contribute.
          </p>

          {!isConnected ? (
            <div className="mt-3">
              <ConnectWallet light={light} className="w-full py-3 text-xs" />
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {SWAP_OPTIONS.map(([asset, label]) => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => {
                      setSelectedSwap(asset);
                      uniswap.clear();
                    }}
                    className={`${tabBase} ${selectedSwap === asset ? tabActive : tabIdle}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {selectedSwap === 'other' && (
                <input
                  type="text"
                  value={uniswap.customToken}
                  onChange={(event) => uniswap.setCustomToken(event.target.value)}
                  placeholder="Token address 0x…"
                  className={
                    light
                      ? 'w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs outline-none'
                      : 'w-full border border-white/20 bg-black/40 px-3 py-2 font-mono text-xs outline-none'
                  }
                />
              )}

              {uniswap.apiConfigured ? (
                <>
                  <button
                    type="button"
                    disabled={swapBusy}
                    onClick={() => void uniswap.fetchQuote(selectedSwap)}
                    className={btnPrimary}
                  >
                    {uniswap.phase === 'quoting'
                      ? 'Fetching Uniswap quote…'
                      : `Get Uniswap quote for ${amountUsd || '—'} USDC`}
                  </button>

                  {uniswap.preview && (
                    <div
                      className={
                        light
                          ? 'border-2 border-black bg-white p-3 font-mono text-[10px]'
                          : 'border border-white/20 bg-black/30 p-3 font-mono text-[10px]'
                      }
                    >
                      <p className="uppercase opacity-60">Quote · {uniswap.preview.routing}</p>
                      <p className="mt-2 font-bold">
                        Pay ~{Number(uniswap.preview.amountInFormatted).toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}{' '}
                        → receive {Number(uniswap.preview.amountOutFormatted).toLocaleString()} USDC
                      </p>
                      {uniswap.preview.gasFeeUsd && (
                        <p className={`mt-1 ${monoTiny}`}>Est. gas ${uniswap.preview.gasFeeUsd}</p>
                      )}
                      {uniswap.pendingApproval && (
                        <p className={`mt-1 ${monoTiny}`}>
                          Approval required before swap (Permit2 proxy flow).
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={swapBusy || uniswap.phase === 'done'}
                        onClick={() => void uniswap.executeSwap()}
                        className={`mt-3 w-full ${btnPrimary}`}
                      >
                        {uniswap.phase === 'approving'
                          ? 'Confirm approval in wallet…'
                          : uniswap.phase === 'swapping'
                            ? 'Building swap…'
                            : uniswap.phase === 'confirming'
                              ? 'Confirming swap…'
                              : uniswap.phase === 'done'
                                ? 'Swap complete'
                                : 'Approve & swap via Uniswap'}
                      </button>
                    </div>
                  )}

                  {uniswap.phase === 'done' && uniswap.txHash && (
                    <a
                      href={getExplorerTxUrl(getChainId(), uniswap.txHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="block font-mono text-[10px] font-bold uppercase text-[#7047eb] underline"
                    >
                      View swap transaction ↗
                    </a>
                  )}
                </>
              ) : (
                <p className="font-mono text-[10px] font-bold uppercase text-[#a13b3b]">
                  Set `VITE_UNISWAP_API_KEY` to enable in-app Uniswap Trading API swaps.
                </p>
              )}

              <button
                type="button"
                disabled={Boolean(gateway.busy)}
                onClick={() => uniswap.openDeepLinkFallback(selectedSwap)}
                className={btnSecondary}
              >
                Open Uniswap app fallback ↗
              </button>
            </div>
          )}

          <p className={`mt-3 font-mono text-[10px] uppercase ${monoTiny}`}>
            API flow: check_approval → quote → swap on {paymentChainLabel()}. After USDC arrives,
            select USDC to contribute.
          </p>

          {(uniswap.error || gateway.error) && (
            <p className="mt-3 border-l-4 border-[#a13b3b] bg-[#fff4f4] p-3 font-mono text-[10px] text-[#a13b3b]">
              {uniswap.error ?? gateway.error}
            </p>
          )}
        </div>
      )}

      {paymentMethod === 'fiat' && (
        <div className={panelClass}>
          <p className={textMuted}>
            Buy USDC on Base with a debit/credit card or Coinbase, then return here and select USDC to
            contribute. Funds land in your linked allocation wallet.
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
                  {gateway.busy === 'coinbase' ? 'Opening Coinbase…' : 'Pay with Coinbase / card'}
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
          <p className={`mt-3 font-mono text-[10px] uppercase ${monoTiny}`}>
            Never send funds to a sale address. Only buy USDC into your linked wallet.
          </p>
        </div>
      )}

      {paymentMethod === 'fiat' && gateway.error && (
        <p className="mt-3 border-l-4 border-[#a13b3b] bg-[#fff4f4] p-3 font-mono text-[10px] text-[#a13b3b]">
          {gateway.error}
        </p>
      )}
    </div>
  );
}
