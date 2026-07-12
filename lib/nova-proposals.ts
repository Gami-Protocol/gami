export type NovaProposal =
  | {
      id: string;
      kind: 'gami_transfer';
      chain: 'base' | 'baseSepolia';
      from: string;
      to: string;
      amount: string;
      symbol: 'GAMI';
    }
  | {
      id: string;
      kind: 'gami_claim';
      chain: 'base' | 'baseSepolia';
      from: string;
      symbol: 'GAMI';
    };

const ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;
const AMOUNT_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,18})?$/;

export function isNovaProposal(value: unknown): value is NovaProposal {
  if (!value || typeof value !== 'object') return false;
  const field = (key: string) => Reflect.get(value, key);
  if (
    typeof field('id') !== 'string' ||
    (field('chain') !== 'base' && field('chain') !== 'baseSepolia') ||
    typeof field('from') !== 'string' ||
    field('symbol') !== 'GAMI'
  ) {
    return false;
  }
  if (field('kind') === 'gami_claim') return true;
  return (
    field('kind') === 'gami_transfer' &&
    typeof field('to') === 'string' &&
    typeof field('amount') === 'string'
  );
}

export function validateNovaProposalAuthorization(
  proposal: NovaProposal,
  account: string,
  chain: 'base' | 'baseSepolia',
): string | null {
  if (proposal.chain !== chain) return `Proposal is for ${proposal.chain}, not ${chain}.`;
  if (proposal.from.toLowerCase() !== account.toLowerCase()) {
    return 'Proposal does not belong to the connected wallet.';
  }
  if (!ADDRESS_PATTERN.test(proposal.from) || !ADDRESS_PATTERN.test(account)) {
    return 'Connected wallet address is invalid.';
  }
  if (proposal.kind === 'gami_claim') return null;
  if (!ADDRESS_PATTERN.test(proposal.to)) return 'Recipient must be a valid 0x address.';
  if (!AMOUNT_PATTERN.test(proposal.amount) || Number(proposal.amount) <= 0) {
    return 'Transfer amount is invalid.';
  }
  return null;
}
