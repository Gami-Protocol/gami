import assert from 'node:assert/strict';
import test from 'node:test';

import { validateNovaProposal } from '@/lib/chain';
import { getNovaAgent, NOVA_AGENTS } from '@/lib/nova-agents';
import { isNovaProposal } from '@/lib/nova-tools';

const ACCOUNT = '0x1111111111111111111111111111111111111111' as const;
const RECIPIENT = '0x2222222222222222222222222222222222222222' as const;

test('agent registry exposes only each specialist allowlist', () => {
  assert.deepEqual(getNovaAgent('wallet').toolIds, [
    'wallet_overview',
    'prepare_gami_transfer',
    'prepare_gami_claim',
  ]);
  assert.equal(NOVA_AGENTS.length, 3);
  assert.equal(getNovaAgent('quests').toolIds.includes('prepare_gami_transfer'), false);
});

test('proposal shape rejects malformed model output', () => {
  assert.equal(isNovaProposal({ kind: 'gami_transfer', amount: '1' }), false);
  assert.equal(
    isNovaProposal({
      id: 'proposal-1',
      kind: 'gami_transfer',
      chain: 'baseSepolia',
      from: ACCOUNT,
      to: RECIPIENT,
      amount: '1.5',
      symbol: 'GAMI',
    }),
    true,
  );
});

test('wallet proposal validation fails closed', () => {
  process.env.EXPO_PUBLIC_GAMI_TOKEN_ADDRESS_SEPOLIA =
    '0x3333333333333333333333333333333333333333';
  const proposal = {
    id: 'proposal-1',
    kind: 'gami_transfer' as const,
    chain: 'baseSepolia' as const,
    from: ACCOUNT,
    to: RECIPIENT,
    amount: '1.5',
    symbol: 'GAMI' as const,
  };

  assert.equal(validateNovaProposal(proposal, ACCOUNT, 'baseSepolia'), null);
  assert.match(
    validateNovaProposal(proposal, RECIPIENT, 'baseSepolia') ?? '',
    /does not belong/,
  );
  assert.match(
    validateNovaProposal({ ...proposal, to: 'not-an-address' }, ACCOUNT, 'baseSepolia') ?? '',
    /valid 0x address/,
  );
  assert.match(
    validateNovaProposal({ ...proposal, chain: 'base' }, ACCOUNT, 'baseSepolia') ?? '',
    /Proposal is for base/,
  );
});
