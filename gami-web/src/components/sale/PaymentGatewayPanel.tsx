import { useEffect, useState } from 'react';

import { ConnectWallet } from '@/components/ConnectWallet';
import { usePaymentGateway } from '@/hooks/usePaymentGateway';
import { useUniswapSwap } from '@/hooks/useUniswapSwap';
import {
  BRIDGE_SOURCE_CHAINS,
  type BridgeSourceChainId,
} from '@/lib/uniswap-chains';
import {
  fiatGatewayAvailable,
  paymentChainLabel,
  type PaymentMethod,
  type SwapAsset,
} from '@/lib/payment-gateway';
import type { TradeDestination } from '@/lib/uniswap-trade-api';

type PaymentGatewayPanelProps = {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  address?: `0x${string}`;
  isConnected: boolean;
  amountUsd: string;
  onFunded?: () => void;
  variant?: 'light' | 'dark';
};

const METHODS: Array<[PaymentMethod, string]> = [
  ['usdc', 'USDC'],
  ['usdt', 'Swap / Bridge'],
  ['fiat', 'Card / Fiat'],
];

const SWAP_OPTIONS: Array<[SwapAsset, string]> = [
  ['usdt', 'USDT'],
  ['eth', 'ETH'],
  ['other', 'Other'],
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

  useEffect(() => {
    if (uniswap.phase === 'done' && uniswap.destination === 'usdc') {
      onPaymentMethodChange('usdc');
    }
  }, [onPaymentMethodChange, uniswap.destination, uniswap.phase]);

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
  const inputClass = light
    ? 'w-full border-2 border-black bg-white px-3 py-2 font-mono text-xs outline-none'
    : 'w-full border border-white/20 bg-black/40 px-3 py-2 font-mono text-xs outline-none';

  const swapBusy = ['quoting', 'approving', 'swapping', 'confirming'].includes(uniswap.phase);
  const destinationLabel = uniswap.destination === 'gami' ? '$GAMI on Base' : 'USDC on Base';

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
          Contribute with USDC already on {paymentChainLabel()}. That funds your $GAMI allocation on
          the Gami chain (Base).
        </p>
      )}

      {paymentMethod === 'usdt' && (
        <div className={panelClass}>
          <p className={textMuted}>
            Use the Uniswap Trading API to move value onto the Gami chain (Base):{' '}
            <span className="font-mono">check_approval → quote → swap/order</span>. Bridge from
            Ethereum / Arbitrum / Optimism / Polygon, or swap on Base, then contribute USDC for
            $GAMI — or route directly into $GAMI when the token address is configured.
          </p>

          {!isConnected ? (
            <div className="mt-3">
              <ConnectWallet light={light} className="w-full py-3 text-xs" />
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              <div>
                <p className={`mb-2 font-mono text-[10px] uppercase ${monoTiny}`}>
                  1. Destination on Gami chain (Base)
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['usdc', 'USDC (for sale)'],
                      ['gami', '$GAMI token'],
                    ] as Array<[TradeDestination, string]>
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      disabled={value === 'gami' && !uniswap.gamiConfigured}
                      onClick={() => {
                        uniswap.setDestination(value);
                        uniswap.clear();
                      }}
                      className={`${tabBase} ${uniswap.destination === value ? tabActive : tabIdle}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {!uniswap.gamiConfigured && (
                  <p className={`mt-2 font-mono text-[10px] ${monoTiny}`}>
                    $GAMI route needs `VITE_GAMI_TOKEN_ADDRESS`. Sale contributions still use USDC.
                  </p>
                )}
              </div>

              <div>
                <p className={`mb-2 font-mono text-[10px] uppercase ${monoTiny}`}>
                  2. Source chain
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {BRIDGE_SOURCE_CHAINS.map((chain) => (
                    <button
                      key={chain.chainId}
                      type="button"
                      onClick={() => {
                        uniswap.setSourceChainId(chain.chainId as BridgeSourceChainId);
                        uniswap.clear();
                      }}
                      className={`${tabBase} ${
                        uniswap.sourceChainId === chain.chainId ? tabActive : tabIdle
                      }`}
                    >
                      {chain.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className={`mb-2 font-mono text-[10px] uppercase ${monoTiny}`}>
                  3. Asset to spend
                </p>
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
              </div>

              {selectedSwap === 'other' && (
                <input
                  type="text"
                  value={uniswap.customToken}
                  onChange={(event) => uniswap.setCustomToken(event.target.value)}
                  placeholder="Token address on source chain 0x…"
                  className={inputClass}
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
                      : uniswap.sourceChainId === 8453
                        ? `Quote swap → ${destinationLabel}`
                        : `Quote bridge ${uniswap.sourceChainLabel} → ${destinationLabel}`}
                  </button>

                  {uniswap.preview && (
                    <div
                      className={
                        light
                          ? 'border-2 border-black bg-white p-3 font-mono text-[10px]'
                          : 'border border-white/20 bg-black/30 p-3 font-mono text-[10px]'
                      }
                    >
                      <p className="uppercase opacity-60">
                        {uniswap.preview.crossChain ? 'Bridge' : 'Swap'} · {uniswap.preview.routing}
                      </p>
                      <p className="mt-2 font-bold">
                        Pay ~{Number(uniswap.preview.amountInFormatted).toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}{' '}
                        on {uniswap.sourceChainLabel}
                        <br />
                        Receive{' '}
                        {Number(uniswap.preview.amountOutFormatted).toLocaleString(undefined, {
                          maximumFractionDigits: uniswap.destination === 'gami' ? 2 : 2,
                        })}{' '}
                        {uniswap.destination === 'gami' ? '$GAMI' : 'USDC'} on Base
                      </p>
                      {uniswap.preview.gasFeeUsd && (
                        <p className={`mt-1 ${monoTiny}`}>Est. gas ${uniswap.preview.gasFeeUsd}</p>
                      )}
                      {uniswap.preview.bridgeFee && (
                        <p className={`mt-1 ${monoTiny}`}>Bridge fee {uniswap.preview.bridgeFee}</p>
                      )}
                      {uniswap.preview.estimatedFillTime && (
                        <p className={`mt-1 ${monoTiny}`}>
                          ETA {uniswap.preview.estimatedFillTime}
                        </p>
                      )}
                      {uniswap.pendingApproval && (
                        <p className={`mt-1 ${monoTiny}`}>
                          Approval required on the source chain before the swap/bridge.
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
                            ? 'Building Uniswap transaction…'
                            : uniswap.phase === 'confirming'
                              ? 'Confirming on-chain…'
                              : uniswap.phase === 'done'
                                ? 'Complete'
                                : uniswap.preview.crossChain
                                  ? 'Approve & bridge to Base'
                                  : 'Approve & swap on Base'}
                      </button>
                    </div>
                  )}

                  {uniswap.phase === 'done' && uniswap.explorerUrl && (
                    <a
                      href={uniswap.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block font-mono text-[10px] font-bold uppercase text-[#7047eb] underline"
                    >
                      View source-chain transaction ↗
                    </a>
                  )}

                  {uniswap.phase === 'done' && uniswap.destination === 'usdc' && (
                    <p className="font-mono text-[10px] font-bold uppercase text-[#7047eb]">
                      USDC is on Base — select the USDC tab and confirm your $GAMI contribution.
                    </p>
                  )}
                </>
              ) : (
                <p className="font-mono text-[10px] font-bold uppercase text-[#a13b3b]">
                  Set `VITE_UNISWAP_API_KEY` to enable in-app Uniswap Trading API swaps & bridges.
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
            Path: other chain/asset → Uniswap API → USDC/$GAMI on Base (Gami chain) → sale
            contribution for allocation.
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
            Buy USDC on Base with a debit/credit card or Coinbase, then select USDC to contribute for
            $GAMI on the Gami chain.
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
