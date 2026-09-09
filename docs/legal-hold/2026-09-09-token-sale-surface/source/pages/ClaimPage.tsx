import { useEffect, useState } from 'react';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { formatEther } from 'viem';

import { GamiFooter } from '@/components/gami/GamiFooter';
import { GamiTokenLogo } from '@/components/gami/GamiTokenLogo';
import { VESTING_ABI, getContractAddress, getExplorerTxUrl, getChainId } from '@/lib/contracts';
import { logClaimEvent } from '@/lib/sale';

export function ClaimPage() {
  const { address, isConnected } = useAccount();
  const [wallet, setWallet] = useState('');
  const [claimableDisplay, setClaimableDisplay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const vestingAddress = getContractAddress('VESTING');
  const target = (isConnected && address ? address : wallet) as `0x${string}` | undefined;

  const { data: claimableRaw, refetch } = useReadContract({
    address: vestingAddress ?? undefined,
    abi: VESTING_ABI,
    functionName: 'claimable',
    args: target ? [target] : undefined,
    query: { enabled: Boolean(vestingAddress && target?.startsWith('0x')) },
  });

  const { writeContract, data: claimHash, isPending } = useWriteContract();
  const { isSuccess: claimConfirmed } = useWaitForTransactionReceipt({ hash: claimHash });

  useEffect(() => {
    if (address) setWallet(address);
  }, [address]);

  useEffect(() => {
    if (claimableRaw !== undefined) {
      setClaimableDisplay(formatEther(claimableRaw as bigint));
    }
  }, [claimableRaw]);

  useEffect(() => {
    if (!claimConfirmed || !claimHash || !target) return;
    setMessage('Claim successful!');
    void logClaimEvent({
      wallet_address: target,
      amount: claimableDisplay ?? '0',
      tx_hash: claimHash,
    });
    void refetch();
  }, [claimConfirmed, claimHash, target, claimableDisplay, refetch]);

  async function checkClaimable() {
    if (!wallet.startsWith('0x')) return;
    setLoading(true);
    await refetch();
    setLoading(false);
  }

  function handleClaim() {
    if (!vestingAddress) {
      setMessage('Vesting contract not configured.');
      return;
    }
    writeContract({
      address: vestingAddress,
      abi: VESTING_ABI,
      functionName: 'claim',
    });
  }

  const canClaim = claimableRaw && (claimableRaw as bigint) > 0n;

  return (
    <>
    <div className="mx-auto max-w-lg px-6 py-16">
      <GamiTokenLogo className="mb-4 h-14 w-14" />
      <h1 className="font-display text-3xl font-bold">Claim $GAMI</h1>
      <p className="mt-2 text-muted">
        Claim your vested tokens after TGE. 15% unlocks immediately, remainder vests over 12 months.
      </p>

      <div className="mt-8 space-y-4">
        <div>
          <label className="font-mono text-xs text-muted">WALLET ADDRESS</label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            disabled={isConnected}
            className="mt-1 w-full border-2 border-white/10 bg-surface p-3 font-mono text-sm focus:border-primary outline-none disabled:opacity-60"
            placeholder="0x..."
          />
        </div>
        <button
          type="button"
          onClick={checkClaimable}
          disabled={loading}
          className="sticker-shadow w-full border-2 border-white/20 py-3 font-display font-bold uppercase disabled:opacity-50"
        >
          {loading ? 'Checking…' : 'Check Claimable Amount'}
        </button>
      </div>

      {claimableDisplay !== null && (
        <div className="sticker-shadow mt-8 border-2 border-white/10 bg-surface p-6 text-center">
          <p className="font-mono text-xs text-muted">CLAIMABLE</p>
          <p className="font-mono text-3xl font-bold text-primary">{claimableDisplay} GAMI</p>
          {canClaim ? (
            <button
              type="button"
              onClick={handleClaim}
              disabled={isPending || !isConnected}
              className="sticker-shadow mt-4 w-full bg-primary py-4 font-display font-bold uppercase disabled:opacity-50"
            >
              {isPending ? 'Claiming…' : 'Claim Tokens'}
            </button>
          ) : (
            <p className="mt-4 text-sm text-muted">Nothing to claim yet, or connect your wallet to claim.</p>
          )}
          {claimHash && (
            <a
              href={getExplorerTxUrl(getChainId(), claimHash)}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block font-mono text-xs text-primary underline"
            >
              View claim tx
            </a>
          )}
        </div>
      )}

      {message && <p className="mt-4 font-mono text-sm text-green-400">{message}</p>}
    </div>
    <GamiFooter variant="ico" />
    </>
  );
}
