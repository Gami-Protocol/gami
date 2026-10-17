# GAMI token monorepo merge plan

## Goal

Merge the base-token stack from `Gami-Protocol/gami-token` (LayerZero OFT v2 token deployment on Base + vesting + timelock + liquidity locker) into this monorepo without changing audit-sensitive logic in this PR.

## Current-state inventory

### In this repo today (`/home/runner/work/gami/gami`)

- On-chain package: `/home/runner/work/gami/gami/gami-contracts`
  - `contracts/GAMI.sol` (plain ERC20 fixed supply)
  - `contracts/TokenSale.sol` (includes `VestingVault` in same file)
  - `contracts/FeeRouter.sol`, `contracts/StakingRewards.sol`
  - Hardhat + Solidity `0.8.24` (`hardhat.config.ts`)
  - deployment registry files already emitted under `gami-contracts/deployments/*.json`
- Wallet/app chain integration:
  - `/home/runner/work/gami/gami/lib/chain.ts` reads addresses from env vars (`EXPO_PUBLIC_GAMI_TOKEN_ADDRESS*`, `EXPO_PUBLIC_VESTING_ADDRESS*`, etc.)
- Reward + eligibility surfaces:
  - `/home/runner/work/gami/gami/lib/ico-quests.ts`
  - `/home/runner/work/gami/gami/supabase/functions/sale-eligibility/index.ts`
  - `/home/runner/work/gami/gami/supabase/migrations/20260711000000_ico_schema.sql` (`sale_participants`, `claim_events`)

### In `gami-token` (from issue scope)

- OFT v2 token contract(s) on Base
- vesting
- timelock ownership controls
- liquidity locker

### Duplication/conflict callouts

1. **Token primitive conflict**: local `GAMI.sol` is vanilla ERC20, while target state needs OFT v2 semantics.
2. **Vesting overlap**: local `VestingVault` exists already; token repo also has vesting stack.
3. **Ownership model mismatch risk**: current scripts assume direct deployer ownership; token repo includes timelock posture.
4. **Address-source fragmentation**: app/backend currently rely on env vars + `deployments/*.json`; no single canonical cross-chain registry consumed by both agent and reward systems.
5. **Toolchain drift risk**: independent Solidity tooling/test assumptions between repos may diverge.

## Target monorepo layout

Proposed additive layout:

- `/home/runner/work/gami/gami/gami-contracts/` (kept as canonical contracts workspace)
  - `/home/runner/work/gami/gami/gami-contracts/contracts/core/` (existing sale/reward-adjacent contracts)
  - `/home/runner/work/gami/gami/gami-contracts/contracts/token/` (vendored OFT v2 token stack)
  - `/home/runner/work/gami/gami/gami-contracts/contracts/token/vesting/`
  - `/home/runner/work/gami/gami/gami-contracts/contracts/token/governance/` (timelock ownership contracts)
  - `/home/runner/work/gami/gami/gami-contracts/contracts/token/liquidity/` (locker contracts)
- `/home/runner/work/gami/gami/gami-contracts/deployments/registry.json` (multi-chain canonical output)
- `/home/runner/work/gami/gami/lib/chains/registry.ts` (typed runtime accessor for wallet/reward/agent systems)

This keeps one Solidity workspace (Hardhat) and avoids introducing a second contracts toolchain package unless future constraints require it.

## Migration phases

### Phase 0 — freeze and vendor baseline

1. Snapshot `gami-token` at a pinned commit SHA.
2. Vendor contracts + tests into `gami-contracts/contracts/token/*` and `gami-contracts/test/token/*`.
3. Preserve provenance with `NOTICE`/readme references to source commit.

### Phase 1 — unify compiler/toolchain

1. Align Solidity compiler versions and optimizer settings across old/new contract sets.
2. Pin OpenZeppelin + LayerZero libs in one `gami-contracts/package.json` lockfile.
3. Ensure `npm --prefix gami-contracts run compile` passes with both stacks together.

### Phase 2 — unify test surface

1. Keep legacy tests and import token-repo tests under namespaced folders.
2. Add compatibility tests that assert expected interfaces used by app/backend (token transfer, claimable/claim, ownership/timelock routing).
3. Keep CI job as one contracts test command (`npm --prefix gami-contracts run test`).

### Phase 3 — CI wiring + deployment registry

1. Add/extend workflow to run contracts compile/test for merged stack.
2. Replace ad hoc per-script deployment JSON output with one canonical `registry.json` keyed by chain id.
3. Include contract-version metadata and source commit SHA per deployment record.

### Phase 4 — runtime consumers

1. Switch `/home/runner/work/gami/gami/lib/chain.ts` and reward-distribution backend entry points to typed registry access.
2. Keep env var overrides only as explicit emergency override path.
3. Add validation startup checks to fail closed on missing addresses.

## Chain/address registry design (single source of truth)

Proposed schema (JSON + generated TS types):

```json
{
  "8453": {
    "chain": "base",
    "token": { "gami": "0x...", "oft": "0x..." },
    "vesting": { "primary": "0x..." },
    "sale": { "tokenSale": "0x..." },
    "governance": { "timelock": "0x..." },
    "liquidity": { "locker": "0x..." },
    "updatedAt": "ISO-8601",
    "sourceCommit": "sha"
  }
}
```

Consumption targets:

- wallet app + NOVA (`/home/runner/work/gami/gami/lib/chain.ts`)
- reward eligibility and payout services (`supabase/functions/*`, future payout worker)
- agentic telemetry/reporting for chain settlement references

## Reward engine ↔ token interface boundary

- **XP accrual and quest completion** remain off-chain deterministic state transitions (current quest/session and backend tables).
- **XP→token conversion** happens only in a deterministic settlement service (not in LLM response code), using approved conversion policy and eligibility checks.
- **Required settlement inputs**:
  - reward policy version
  - subject (user/tenant/session)
  - XP basis
  - idempotency key / settlement nonce
  - chain + token addresses from registry
- **Idempotency**:
  - nonce/idempotency key must be unique per payout intent and persisted before broadcast
  - repeated submit returns existing settlement receipt, never mints/sends twice
- **Policy guardrail**:
  - agents can only propose reward actions
  - deterministic policy service must approve before any payout transaction
  - direct “agent output → on-chain transfer” is prohibited for auditability and abuse resistance

## Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Pre-audit merged surface | Critical | Keep this PR planning/integration-only; no audit-sensitive edits to core token logic |
| Ownership/timelock mismatch | High | Explicit ownership matrix before migration; acceptance tests for owner-only flows |
| Key management drift | High | Move deploy/admin keys to managed secret store; block local plaintext key workflows |
| Upgrade path ambiguity | High | Record immutable vs upgradeable components and migration playbooks per chain |
| Address registry skew | Medium | Enforce one canonical registry and startup validation |
| Rollback complexity | Medium | Preserve old deployments + feature flag runtime selection until cutover signoff |

## Rollback approach

- Keep existing contract deployment scripts and env-based reads operational behind feature flags during migration.
- Ship registry consumer code in read-only mode first, then flip write/settlement systems after verification.
- Maintain ability to route rewards back to non-token XP-only mode if settlement service fails.

## Explicit out of scope for this PR

- Mainnet deployment or migration execution
- Changes to audit-sensitive token contract behavior
- Timelock parameter changes in production
- Vesting schedule mutations in production
- Liquidity lock operations on live assets
