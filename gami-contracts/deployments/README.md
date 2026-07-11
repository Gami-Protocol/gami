# Contract deployments

| File | Network | Usage |
|------|---------|-------|
| `31337.json` | Hardhat local | `npx hardhat run scripts/deploy.ts --network hardhat` |
| `84532.json` | Base Sepolia | `npm run deploy:sepolia` (requires funded deployer key) |

After deploying to Base Sepolia, copy contract addresses into:

- `gami-web/.env.local` (`NEXT_PUBLIC_*`)
- Root `.env` (`EXPO_PUBLIC_*`)

Local dev can point env vars at `31337.json` addresses when running a local Hardhat node.
